import { writeFile } from "fs/promises";

class Field {
  _name: string;
  _type: string;

  constructor(name: string, type: string) {
    this._name = name;
    this._type = type;
  }

  toJsonObj() {
    return { name: this._name, type: this._type };
  }
}

export class ModelDescription {
  private _name: string;
  private _fields: Field[] = [];

  constructor(name: string) {
    this._name = name;
  }

  addField(name: string, { type = "int" }) {
    this._fields.push(new Field(name, type));
  }

  private _fieldSql() {
    const ret = [];
    for (const f of this._fields) {
      ret.push(`${f._name} ${f._type}`);
    }
    return ret.join(", ");
  }

  private _createParams() {
    const ret = [];

    for (const f of this._fields) {
      let tsType;
      switch (f._type) {
        case "int":
          tsType = "number";
          break;
        default:
          throw new Error(`No conversion exists for type ${f._type}`);
      }
      ret.push(`${f._name}?: ${tsType}`);
    }

    return `params: { ${ret.join(", ")} }`;
  }

  private _fieldSpec() {
    const ret = [];
    for (const f of this._fields) {
      ret.push(f.toJsonObj());
    }
    return JSON.stringify(ret);
  }

  async build() {
    const outFile = "generated-model.ts";
    writeFile(
      outFile,
      `
            import { AbstractModel } from './src/abstract-model'; 
            
            export class ${this._name} extends AbstractModel {
                protected static _tableName = "${this._name}";
                protected static _fields = ${this._fieldSpec()};
                
                protected static _tableCreationSql = \`
                    CREATE TABLE ${this._name} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ${this._fieldSql()}
                    ) STRICT;
                \`
                
                static create(${this._createParams()}) {
                    // TODO: validate 
                    this._create(params);
                }
            
                // FIXME: need quoting
                static objects = this._getQueryer();
            }
        `
    );
    return { path: outFile };
  }
}
