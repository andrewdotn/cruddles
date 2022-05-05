// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { readFile } from "fs-extra";
import { resolve } from "path";

let css: string;

/**
 * Return a cached copy of the CSS for inlining. Async because the first
 * call hit disk, *or* when not in production a missing compiled file is
 * resolved by returning the CSS directly.
 */
export async function loginCss() {
  if (css !== undefined) {
    return css;
  }

  try {
    css = (
      await readFile(resolve(__dirname, "..", "dist", "login.css"))
    ).toString();
  } catch (e) {
    if (process.env.NODE_ENV !== "production" && e.code === "ENOENT") {
      css = (
        await readFile(resolve(__dirname, "frontend", "login.css"))
      ).toString();
    } else {
      throw e;
    }
  }
  return css;
}
