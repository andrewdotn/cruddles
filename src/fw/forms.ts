// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { getChoices, isChoiceList } from "./forms/choices";
import { BaseEntity, ColumnOptions, getMetadataArgsStorage } from "typeorm";
import { DateTimeParseException, LocalDate } from "js-joda";
import { isPromise } from "../server";

const FIELD_TYPES = new Map<unknown, Map<String, unknown>>();

export function FormField<T extends { constructor: Function }>(
  t: T,
  property: keyof T & string
) {
  const c = t.constructor;
  let mapForT: Map<String, unknown>;
  if (FIELD_TYPES.has(c)) {
    mapForT = FIELD_TYPES.get(c)!;
  } else {
    mapForT = new Map();
    FIELD_TYPES.set(c, mapForT);
  }
  mapForT.set(property, Reflect.getMetadata("design:type", t, property));
}

export type Stringified<T> = { [k in keyof T]: string };

// To create a form object, use the async createFormInstance() method.
//
// Originally the form object’s validity was checked during construction, but
// that’s incompatible with async validity checks, such as checks requiring
// database queries.
//
// So now there’s a semi-protected constructor that, internally, calls the
// protected async validateInput() method before returning the newly-constructed
// object.
abstract class Form<T> {
  abstract fields(): (string & keyof T)[];
  abstract fieldChoices(fieldName: string & keyof T): [string, string][];
  abstract isChoiceField(fieldName: string & keyof T): boolean;
  abstract isBooleanField(fieldName: string & keyof T): boolean;
  abstract isValid(): boolean;
  abstract cleanedData(): Partial<T>;
  abstract cleanedDataAsString(): Stringified<Partial<T>>;
  abstract formErrors(): string[];
  abstract fieldErrors(key: string & keyof T): string[];
  /** For errors not specific to a single form field */
  abstract addFormError(error: string): void;
  abstract addFieldError(key: string & keyof T, error: string): void;
  protected abstract validateInput(
    userInput?: Stringified<Partial<T>>,
    initial?: T
  ): Promise<void>;

  constructor(constructionSecret: ConstructionSecret) {
    if (constructionSecret !== constructionSecret_) {
      throw new Error("Attempt to call protected constructor");
    }
  }

  placeholders?: { [k: string]: string };

  /**
   * Warning: If there is no user input, `userInput` should be `undefined`, not
   * `{}`, otherwise checkboxes won’t work.
   */
  static async createFormInstance<T>(
    formClass: FormClass<T>,
    userInput?: Stringified<Partial<T>>,
    initial?: T
  ): Promise<InstanceType<FormClass<T>>> {
    const f = new formClass(constructionSecret_);
    await f.validateInput(userInput, initial);
    return f;
  }
}

export type FormType<T> = Form<T>;

// export the static method without exporting its class; the method must be
// static as it calls a protected method.
export const createFormInstance = Form.createFormInstance;

// Workaround for creating a static generic factory method for subclasses of
// Form<>. We’d like to have an abstract class with a protected constructor.
// But, in TypeScript, a parameter that is a class as opposed to an instance is
// referred to by the interface { new(...): C }; that’s not possible to do if
// C’s constructor is nonpublic.
const constructionSecret_ = {
  constructorIsOnlyUnprotectedFor: ["type", "checking", "reasons"],
} as const;
type ConstructionSecret = typeof constructionSecret_;

// values of this type are classes, not instances
// e.g., typeof will return 'function', not 'object'
interface FormClass<T> {
  new (constructionSecret: ConstructionSecret): Form<T>;
}

abstract class ModelForm<T> extends Form<T> {
  private _fieldErrors = new Map<string, string[]>();
  private _formErrors: string[] = [];
  protected _cleaned: Partial<T> = {};
  placeholders?: { [k: string]: string } | undefined;

  abstract fields(): (string & keyof T)[];

  addFormError(error: string): void {
    this._formErrors.push(error);
  }

  addFieldError(key: string & keyof T, error: string) {
    if (!this._fieldErrors.has(key)) {
      this._fieldErrors.set(key, []);
    }
    this._fieldErrors.get(key)!.push(error);
  }

  isValid() {
    return this._formErrors.length === 0 && this._fieldErrors.size === 0;
  }

  abstract fieldChoices(fieldName: string & keyof T): [string, string][];
  abstract isChoiceField(fieldName: string & keyof T): boolean;
  abstract isBooleanField(fieldName: string & keyof T): boolean;

  cleanedData(): Partial<T> {
    return { ...this._cleaned };
  }

  cleanedDataAsString(): Stringified<Partial<T>> {
    const ret = {} as Stringified<Partial<T>>;
    for (const k1 of Object.keys(this._cleaned)) {
      const k = k1 as keyof T;
      const v = this._cleaned[k];

      let stringified = false;
      if (typeof v === "string") {
        ret[k] = v;
        stringified = true;
      } else if (typeof v === "boolean") {
        ret[k] = v.toString();
        stringified = true;
      } else if (typeof v === "number") {
        ret[k] = v.toString();
        stringified = true;
      } else if (v === undefined || v === null) {
        ret[k] = "";
        stringified = true;
      } else if ("toString" in v) {
        const v2 = v as { toString: unknown };
        if (typeof v2.toString === "function") {
          ret[k] = v2.toString();
          stringified = true;
        }
      }
      if (!stringified) {
        throw new Error(`Don’t know how to stringify ${k}`);
      }
    }
    return ret;
  }

  fieldErrors(key: string & keyof T): string[] {
    return this._fieldErrors.get(key)?.slice() ?? [];
  }

  formErrors(): string[] {
    return this._formErrors.slice();
  }
}

// Create and return a form class for the fields of the given class. C will
// usually extend typeorm’s BaseEntity but does not need to.
export function formClassFor<T>(
  class_: any,
  fields: (
    | (string & keyof T)
    | { name: string & keyof T; choices: Map<String, String> }
  )[]
) {
  const fieldNames: (string & keyof T)[] = [];
  for (const f of fields) {
    if (typeof f === "object") {
      fieldNames.push(f.name);
    } else {
      fieldNames.push(f);
    }
  }

  const columnOptions = new Map<string & keyof T, ColumnOptions>();
  const fieldMap = new Map<string & keyof T, unknown>();
  // check inheritance https://stackoverflow.com/a/14486171/14558
  if (class_.prototype instanceof BaseEntity) {
    const columns = getMetadataArgsStorage().filterColumns(class_);
    for (const field of fields) {
      if (typeof field === "object") {
        fieldMap.set(field.name, field.choices);
      } else {
        const fieldName = field;
        const col = columns.find((c) => c.propertyName === fieldName);
        if (!col) {
          throw new Error(`column ${fieldName} not found`);
        }
        columnOptions.set(fieldName, col.options);
        const fieldType = Reflect.getMetadata(
          "design:type",
          class_.prototype,
          fieldName
        );
        fieldMap.set(fieldName, fieldType);
      }
    }
  } else {
    for (const fieldName of fieldNames) {
      const fieldType = FIELD_TYPES.get(class_)?.get(fieldName);
      if (!fieldType) {
        throw new Error(`Could not determine field type for ${fieldName}`);
      }
      fieldMap.set(fieldName, fieldType);
    }
  }

  for (const fieldName of fieldNames) {
    if (!fieldMap.get(fieldName)) {
      throw new Error(`Unknown type for field ${fieldName}`);
    }
  }

  return class extends ModelForm<T> {
    fields() {
      return fieldNames.slice();
    }

    fieldChoices(fieldName: string & keyof T): [string, string][] {
      const t = fieldMap.get(fieldName);
      if (t instanceof Map) {
        return [...t.entries()];
      }
      if (!this.isChoiceField(fieldName)) {
        throw new Error("not a choice field");
      }
      return getChoices(t).map((e) => [e, e]);
    }

    isChoiceField(fieldName: string & keyof T): boolean {
      const t = fieldMap.get(fieldName);
      return t instanceof Map || isChoiceList(fieldMap.get(fieldName));
    }

    isBooleanField(fieldName: string & keyof T): boolean {
      return fieldMap.get(fieldName) === Boolean;
    }

    async validateInput(input?: Stringified<Partial<T>>, initial?: T) {
      if (initial !== undefined) {
        for (const k in initial) {
          if (this.fields().includes(k)) {
            this._cleaned[k] = initial[k];
          }
        }
      }

      // This is a cleaning step
      if (input) {
        for (const k in input) {
          if (!fieldMap.has(k)) {
            continue;
          }

          const t = fieldMap.get(k)!;
          if (t === String) {
            this._cleaned[k] = input[k] as any;
          } else if (t === Number) {
            this._cleaned[k] =
              input[k] !== "" ? (Number(input[k]) as any) : null;
          } else if (t instanceof Map || isChoiceList(t)) {
            const choices = isChoiceList(t)
              ? getChoices(t)
              : [...(t as Map<String, String>).values()];
            if (choices.includes(input[k])) {
              this._cleaned[k] = input[k] === "" ? null : (input[k] as any);
            } else {
              this.addFieldError(k, `Must be one of ${choices}`);
            }
          } else if (t === Boolean) {
            // Assuming this is a checkbox, any value at all, even "", is
            // considered true. If not checked, no value is sent.
            this._cleaned[k] = true as any;
          } else if (t === LocalDate) {
            // TODO: check if string
            if (columnOptions.get(k)?.nullable && input[k] === "") {
              this._cleaned[k] = null as any;
            } else {
              try {
                const d = LocalDate.parse(input[k]);
                this._cleaned[k] = d as any;
              } catch (e) {
                if (e instanceof DateTimeParseException) {
                  this.addFieldError(
                    k,
                    "Not a supported date; try yyyy-mm-ddd"
                  );
                } else {
                  throw e;
                }
              }
            }
          } else {
            this.addFieldError(k, "Unknown type; cannot validate");
          }
        }
        for (const k of this.fields()) {
          const t = fieldMap.get(k);
          if (t === Boolean && !(k in input)) {
            this._cleaned[k] = false as any;
          }
        }
      }

      // Now validation
      for (const f of this.fields()) {
        const validator_name = `validate_${f}`;
        const validator_func = (this as any)[validator_name];
        if (typeof validator_func === "function") {
          const ret = validator_func.call(this);
          if (isPromise(ret)) {
            await ret;
          }
        }
      }
    }
  };
}
