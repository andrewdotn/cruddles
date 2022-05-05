// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { appendClasses } from "./util";
import { expect } from "chai";
import { i } from "../fw/i";

describe("appendClasses", function () {
  for (const [orig, extra, expected] of [
    ["foo", undefined, "foo"],
    [undefined, undefined, undefined],
    [undefined, "", ""],
    ["", undefined, ""],
    ["foo", "bar", "foo bar"],
    ["foo", "bar baz", "foo bar baz"],
    ["foo", ["bar", "baz"], "foo bar baz"],
    ["foo", ["bar", undefined, "baz"], "foo bar baz"],
    [undefined, "bar", "bar"],
    [undefined, ["bar", "baz"], "bar baz"],
  ] as [string | undefined, string[] | string | undefined, string][]) {
    it(i`gets ${expected} for ${orig} and ${extra}`, function () {
      expect(appendClasses(orig, extra)).to.eql(expected);
    });
  }
});
