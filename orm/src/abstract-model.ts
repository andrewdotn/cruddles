import { DB_MANAGER, DbType } from "./db-manager";

export class AbstractModel {
  protected static _tableName: string = "";
  protected static _tableCreationSql: string = "";

  protected static _getQueryer() {
    return new Queryer({ tableName: this._tableName });
  }

  protected static _create(params: { [fieldName: string]: unknown }) {
    const fields = [];
    const values = [];

    for (const [k, v] of Object.entries(params)) {
      fields.push(k);
      values.push(v);
    }

    const db = DB_MANAGER.get();
    const stmt = db.prepare(`
        INSERT INTO ${this._tableName}
        (${fields.join(", ")})
          VALUES (${values.map((e) => "?")})
      `);
    stmt.run(values);
  }

  static syncSchema() {
    const db = DB_MANAGER.get();
    db.exec(this._tableCreationSql);
  }
}

class Queryer {
  // TODO: need quote table name?
  private _tableName: string;
  private _db: DbType;

  constructor({
    tableName,
    connectionName,
  }: {
    tableName: string;
    connectionName?: string;
  }) {
    this._tableName = tableName;
    this._db = DB_MANAGER.get(connectionName);
  }

  all() {
    return this._db.prepare(`SELECT * FROM ${this._tableName}`).all();
  }
}
