// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Request } from "express";
import parseurl from "parseurl";

export function qs(req: Request) {
  const url = { url: req.url };
  const parsed = parseurl(url);
  if (!parsed) {
    throw new Error("failed to parse qs");
  }
  if (parsed.query === null) {
    parsed.query = "";
  }
  if (typeof parsed.query !== "string") {
    throw new Error("failed to parse qs");
  }
  return parsed.query;
}
