// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

export type Environment = "production" | "test" | "dev";

export function environment(): Environment {
  if (process.env.NODE_ENV === "production") {
    return "production";
  } else if (process.env.NODE_ENV === "test") {
    return "test";
  } else {
    return "dev";
  }
}
