// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import {
  Connection,
  ConnectionOptionsReader,
  createConnection,
  getConnectionManager,
} from "typeorm";
import { endsWith } from "lodash";

let db: Promise<Connection> | null = null;

export async function ensureTestDb({
  root,
}: {
  root: string;
}): Promise<Connection> {
  if (db === null) {
    // Usually it’s wrong for an async function to create a promise. But
    // here we’re using the promise as a form of lock, so that only one db
    // connection attempt is made, regardless of how many times this
    // function gets called before the db is connected.
    db = new Promise(async (resolve, reject) => {
      try {
        if ((process.env.NODE_ENV || "test") !== "test") {
          throw new Error(
            "This function is incompatible with" +
              `NODE_ENV=${process.env.NODE_ENV}`
          );
        }
        process.env.NODE_ENV = "test";

        if (getConnectionManager().connections.length != 0) {
          throw new Error("something else already created a connection");
        }

        const options = await new ConnectionOptionsReader({ root }).get(
          "default"
        );
        if (typeof options.database != "string") {
          throw new Error("database must be string");
        }
        if (!endsWith(options.database, "/test.sqlite3")) {
          throw new Error("configured db is not test db");
        }

        const conn = await createConnection(options);

        await conn.synchronize(true);

        resolve(conn);
      } catch (e) {
        reject(e);
      }
    });
  }
  return await db;
}
