// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

export function ensureNotProduction() {
  if (process.env.NODE_ENV !== "dev" && process.env.NODE_ENV !== "test") {
    throw new Error(
      "This operation is only permitted in dev or test environments."
    );
  }
}
