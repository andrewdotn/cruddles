// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

declare module "chai-json-equal" {
  import Chai from "chai";

  const ChaiJsonEqual: Chai.ChaiPlugin;
  export = ChaiJsonEqual;
}

declare namespace Chai {
  interface Assertion {
    jsonEqual(other: unknown): Assertion;
  }
}
