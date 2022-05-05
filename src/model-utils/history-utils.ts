// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { BaseEntity, FindManyOptions, ObjectType } from "typeorm";
import { findExactlyOneOrFail } from "../fw/entity-utils";

interface ChangeRecord<T, R extends keyof T = keyof T> {
  field: R;
  before: T[R];
  after: T[R];
}

export type Change<T> = (ChangeRecord<T> | { created: true })[];

export function compareModelInstances<T>(
  fields: readonly (keyof T)[],
  t1: T,
  t2: T
): Change<T> {
  const ret = [];
  for (const k of fields) {
    if (t1[k] !== t2[k]) {
      ret.push({
        field: k,
        before: t1[k],
        after: t2[k],
      });
    }
  }
  return ret;
}

// The specific thing I want, number-valued property names, is described here
// https://stackoverflow.com/questions/56227491/filter-generic-type-properties-to-specific-type
// The current solution works for correct type inference on *calling* the
// function—you can only pass number properties—but the call inside the function
// is still flagged, since it can’t infer that those number-value properties map
// to numbers. This derives from the “Conditional types are particularly useful
// when combined with mapped types” section of
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
type NumberPropertyNames<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];
type NumberProperties<T> = Pick<T, NumberPropertyNames<T>>;

export async function saveHistoryWithComputedChanges<
  T extends BaseEntity & { id?: number },
  TH extends { change?: string; save: () => Promise<TH> }
>(
  entity: T,
  entityClass: {
    new (): T;
    find<T>(
      this: ObjectType<T>,
      options?: FindManyOptions<T> | undefined
    ): Promise<T[]>;
  },
  historyEntityClass: { new (): TH },
  historyIdLink: NumberProperties<TH>,
  entityFields: readonly (keyof T)[],
  presaveHook?: (historyEntity: TH) => void
) {
  const isNew = entity.id == undefined;

  if (isNew) {
    await entity.save();
  }

  const history = new historyEntityClass();
  // @ts-ignore See above comment
  history[historyIdLink] = entity.id;
  const existing = await findExactlyOneOrFail<T>(entityClass, {
    where: { id: entity.id },
  });
  const delta = compareModelInstances(entityFields, existing!, entity);
  if (isNew) {
    delta.push({ created: true });
  }
  history.change = JSON.stringify(delta);
  // if (presaveHook) {
  //   presaveHook(history);
  // }
  await history.save();
  if (!isNew) {
    await entity.save();
  }
}
