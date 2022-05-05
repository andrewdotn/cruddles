// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import yargs from "yargs";
import { getConnection } from "./db";
import { Server } from "./server";
import { sessionSecretFromDb } from "./fw/session";
import { Express } from "express";

type ArgvOptions = {
  _: string[];
  database?: string;
  port?: number;
  hotReloadAssets?: boolean;
  parcelServerUrl?: string;
};

async function serve(argv: ArgvOptions) {
  if (argv._.length > 0 && argv._[0] !== "serve") {
    // would be better to print help here
    throw new Error(`unknown command: ${argv._[0]}`);
  }

  await getConnection(argv);
  const sessionSecret = await sessionSecretFromDb();

  const serverArgs: {
    sessionSecret: string;
    devSetup?: (s: Server, e: Express) => void;
  } = { sessionSecret };

  if (argv.parcelServerUrl) {
    serverArgs.devSetup = (s) => {
      s.parcelServerUrl = argv.parcelServerUrl;
    };
  }

  if (argv.hotReloadAssets && process.env.NODE_ENV !== "production") {
    const { setup } = await import("./fw/devServer");
    serverArgs.devSetup = setup;
  }

  await new Server(serverArgs).serve(argv);
}

async function main() {
  // https://github.com/microsoft/TypeScript/issues/11498#issuecomment-550552965
  yargs
    .strict()
    .demandCommand(1, 1)
    .option("database", { type: "string" })
    .command(
      ["serve", "$0"],
      "start webserver",
      (args) =>
        args

          .option("port", { type: "number" })
          .option("hot-reload-assets", { type: "boolean" })
          .option("parcel-server-url", {
            type: "string",
            conflicts: ["hot-reload-assets"],
          }),
      serve
    ).argv as ArgvOptions;
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
