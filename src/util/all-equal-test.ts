// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";
import { allEqual } from "./all-equal";

describe("allEqual", function () {
  for (const [input, expected] of [
    [[], { emptyArray: true }],
    [[1, 2, 3], { emptyArray: false, allEqual: false }],
    [[1, 1, 1], { emptyArray: false, allEqual: true, value: 1 }],
    [["a", "a", "a"], { emptyArray: false, allEqual: true, value: "a" }],
  ] as const) {
    it(`works on ${input}`, function () {
      expect(allEqual(input as any)).to.eql(expected);
    });
  }
});
