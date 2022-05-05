// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { i } from "../fw/i";

export function saferParseInt(s: string): number {
  if (typeof s !== "string") {
    throw new Error("Not a string, refusing to parse.");
  }
  if (!/^-?[0-9]+$/.test(s)) throw new Error(i`${s} is not an integer`);
  const ret = Number(s);
  if (ret.toString() !== s) {
    throw new Error(`${s} is ambiguous or not a JS-representable integer`);
  }
  return ret;
}
