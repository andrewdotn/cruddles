// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { SchemaSyncCommand } from "typeorm/commands/SchemaSyncCommand";
import { SchemaDropCommand } from "typeorm/commands//SchemaDropCommand";
import { createCypressUsers } from "./src/scripts/create-cypress-users";
import { Server } from "./src/server";
import { setup } from "./src/fw/devServer";
import yargs from "yargs";
import { ok } from "assert";
import { getConnection } from "../../xcvs/typeorm/build/package";

// Script to launch API server, run cypress headless, then clean up.

async function main() {
  // At the time of script creation, this was the easiest way to target the
  // database. Since it’s a global, it should run in a separate process.
  if (process.env.NODE_ENV !== undefined) {
    throw new Error("NODE_ENV must be unset, as this script overrides it");
  }
  process.env.NODE_ENV = "test";

  const args = ({} as any) as yargs.Arguments;

  // drop all tables in schema
  await new SchemaDropCommand().handler(args);
  // create tables; this skips migrations
  await new SchemaSyncCommand().handler(args);

  // Those scripts turned on SQL logging; turn it back off
  const connection = await getConnection();
  // Object.assign ignores TypeScript readonly attributes
  Object.assign(connection.options, { logging: false });

  // create test users
  await createCypressUsers();

  let setupReturnVal: any;

  const server = await new Server({
    devSetup: (s, e) => {
      setupReturnVal = setup(s, e);
    },
  }).serve();
  try {
    const addr = server.address();
    ok(addr && typeof addr === "object");
    const baseUrl = `http://localhost:${addr.port}/`;

    // This is in here to make TypeScript happy. The cypress types conflict with
    // the types in the rest of the project, which is why there’s a separate
    // `tsconfig.json` in the `cypress` folder. Usually keeping those two worlds
    // separate is one enough, but the whole point of this script is to bridge
    // those two worlds…
    const cypress = require("cypress");
    await cypress.run({
      config: {
        baseUrl,
      },
    });
  } finally {
    // stop parcel-bundler middleware so that the script exits cleanly instead
    // of hanging; not sure if this method is even documented
    await setupReturnVal.stop();
    server.close();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
