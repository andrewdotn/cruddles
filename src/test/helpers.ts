// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { readFile } from "fs-extra";
import { join } from "path";
import { JSDOM } from "jsdom";
import { Response } from "superagent";

export async function fixture(filename: string) {
  return readFile(join(__dirname, "..", "..", "fixtures", filename));
}

export function extractErrorText(response: Response) {
  const errorList = JSDOM.fragment(response.text).querySelectorAll(".error");
  // @ts-ignore
  const errorText = [...errorList].map((e) => e.textContent).join("\n");
  return errorText;
}
