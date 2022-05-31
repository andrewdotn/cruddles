import type BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import { constructionCookie } from "./_internal";

export type DbType = BetterSqlite3.Database;

const DEFAULT_CONNECTION_NAME = "default";

// The type is public but should not be constructed by clients; instead, use the
// public instance
export class DbManager {
  private _dbMap = new Map<string, DbType>();

  constructor(cookie: Symbol) {
    if (cookie != constructionCookie) {
      throw new Error("Cannot be constructed; use DB_MANAGER instance instead");
    }
  }

  connect(connectionName = DEFAULT_CONNECTION_NAME) {
    if (!connectionName) {
      connectionName = DEFAULT_CONNECTION_NAME;
    }

    if (this._dbMap.has(connectionName)) {
      throw new Error(`Connection name ${connectionName} already in use`);
    }
    const db = new Database(":memory:", {});
    console.log(db.pragma("FOREIGN_KEYS = ON"));
    this._dbMap.set(connectionName, db);
  }

  get(connectionName = DEFAULT_CONNECTION_NAME): DbType {
    if (!connectionName) {
      connectionName = DEFAULT_CONNECTION_NAME;
    }

    const db = this._dbMap.get(connectionName);
    if (!db) {
      throw new Error(`No connected database ${DEFAULT_CONNECTION_NAME}`);
    }
    return db;
  }

  close(connectionName = DEFAULT_CONNECTION_NAME) {
    if (!connectionName) {
      connectionName = DEFAULT_CONNECTION_NAME;
    }

    const db = this.get(connectionName);
    this._dbMap.delete(connectionName);
    db.close();
  }
}

export const DB_MANAGER = new DbManager(constructionCookie);
