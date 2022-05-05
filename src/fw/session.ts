// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Connection } from "typeorm";
import { Session } from "../models/session";
import ExpressSession from "express-session";
import { TypeormStore } from "connect-typeorm";
import { ConfigParam } from "../models/config-param";
import { randomBytes } from "crypto";

function generateSessionSecret() {
  return randomBytes(32).toString("hex");
}

export async function sessionSecretFromDb(): Promise<string> {
  const configKey = "sessionSecret";
  let param = await ConfigParam.findOne({ key: configKey });
  if (!param) {
    param = ConfigParam.create({
      key: configKey,
      value: generateSessionSecret(),
    });
    await param.save();
  }
  return param.value!;
}

export function setupSessions(connection: Connection, sessionSecret?: string) {
  const sessionRepository = connection.getRepository(Session);

  if (!sessionSecret) {
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      console.log("Warning: generating one-off session secret");
    }
    sessionSecret = generateSessionSecret();
  }

  return ExpressSession({
    resave: false,
    saveUninitialized: false,
    name: "session",
    cookie: {
      httpOnly: true,
    },
    store: new TypeormStore({
      cleanupLimit: 2,
      limitSubquery: false,
      ttl: 86400,
    }).connect(sessionRepository),
    secret: sessionSecret,
  });
}
