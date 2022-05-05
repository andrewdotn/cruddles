// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

// This is a separate file for importing and using dependencies that aren’t
// installed in production.

import Bundler from "parcel-bundler";
import { resolve } from "path";
import { Server } from "../server";
import { Express } from "express";

declare module "parcel-bundler" {
  interface ParcelOptions {
    autoInstall: boolean;
  }
}

export function setup(server: Server, app: Express) {
  const bundler = new Bundler(
    [
      resolve(__dirname, "..", "frontend", "login.css"),
      resolve(__dirname, "..", "frontend", "client.tsx"),
    ],
    { publicUrl: "/dist", autoInstall: false }
  );

  app.use(bundler.middleware());

  return bundler;
}
