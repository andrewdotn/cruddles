// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";
import { inspect } from "util";
import { isJsonWithDetails } from "./is-json";

describe("is-json", function () {
  const cycle: { x?: {} } = {};
  cycle.x = cycle;
  const plainObj = { a: 1, b: 2 };

  const testCases: [unknown, boolean][] = [
    ["hi", true],
    [NaN, false],
    [true, true],
    [1.7e12, true],
    [[1, 2, "a"], true],
    [[new Date()], false],
    [{ a: 1.7 }, true],
    [{ a: [0, { b: { c: { d: [1, undefined] } } }] }, false],
    [{ a: [{ b: 12, "c.d": false }] }, true],
    [() => {}, false],
    [cycle, false],
    // This should break a naïve cycle detector
    [[plainObj, plainObj, plainObj], true],
  ];
  for (const [obj, expected] of testCases) {
    it(`returns ${expected} for ${inspect(obj)}`, function () {
      const result = isJsonWithDetails(obj);
      expect(result[0]).to.eql(expected);
    });
  }
});
