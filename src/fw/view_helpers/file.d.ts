// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { VFile } from "vfile";
import { ReactElement } from "react";

// Extended by remark-react
declare module "vfile" {
  interface VFile {
    result: ReactElement;
  }
}
