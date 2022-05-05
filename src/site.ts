// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { ReactElement } from "react";
import { Request } from "express";
import { fullHtmlDocumentWithBody } from "./fw/html";
import { CssAndJsLinks } from "./fw/extract-css-and-js-links";
import { ServerLocals } from "./server";

export function cssAndJsLinks(assets: CssAndJsLinks | Request): CssAndJsLinks {
  let r: CssAndJsLinks;
  // Both Request and CssAndJsLinks are interfaces, so pick a property
  // known to be in one and unlikely to be in the other.
  if ("range" in assets && typeof assets.range === "function") {
    r = (assets.app.locals as ServerLocals).cssAndJs;
  } else {
    r = assets as CssAndJsLinks;
  }
  return r;
}

export function myHtml(
  bodyContents: ReactElement,
  assets: CssAndJsLinks | Request
) {
  const a = cssAndJsLinks(assets);

  return fullHtmlDocumentWithBody(bodyContents, "", a.js, a.css);
}
