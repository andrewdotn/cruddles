// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

declare module "parseurl" {
  import { Url } from "url";

  function parseurl(options: { url: string }): Url | undefined;
  export = parseurl;
}
