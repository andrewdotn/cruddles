// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { ConnectionOptions } from "typeorm";
import { environment } from "./environment";
import { relative, resolve } from "path";

const extension = __filename.split(".").pop();

const env = environment();

function relPath(path: string) {
  const path1 = resolve(__dirname, path);
  return relative(resolve(__dirname, ".."), path1);
}

const config: ConnectionOptions = {
  type: "sqlite",
  database: `${env}.sqlite3`,
  entities: [relPath(`models/*.${extension}`)],
  // set `logging` to `"all"` to include messages from migration generator
  logging: false,
  // `file` goes to ormlogs.log, typeorm tries to put it near package.json, but
  // likely ends up one directory above, or node_modules/..
  // `"debug"` works well with environment variable `DEBUG='typeorm:*'`
  logger: "advanced-console",
  migrations: [relPath(`migrations/*.${extension}`)],
  subscribers: [relPath(`subscribers/*.${extension}`)],
  cli: {
    migrationsDir: relPath(`migrations`),
  },
};

module.exports = config;
