// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import assertModule from "assert";

const ok: typeof assertModule.strict.ok = assertModule.strict.ok;

export const AssertionError = assertModule.AssertionError;

export function assertNotFalseNullOrUndefined(
  condition: unknown,
  message: string,
  diagnoser?: () => void
): asserts condition {
  if (
    diagnoser &&
    (condition === undefined || condition === null || condition === false)
  ) {
    diagnoser();
  }
  ok(
    condition !== undefined && condition !== null && condition !== false,
    message
  );
}
