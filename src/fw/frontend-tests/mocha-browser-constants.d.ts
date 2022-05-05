// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

declare module "mocha/lib/runner" {
  import type { RunnerConstants } from "mocha";

  export const constants: RunnerConstants;
}
