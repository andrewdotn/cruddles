// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Request } from "express";
import React, { ReactElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { elementToJsonObj, jsonObjToElement } from "./fw/element-json";
import { getAppTypeMap } from "./frontend/app-type-map";
import { CssAndJsLinks } from "./fw/extract-css-and-js-links";
import { cssAndJsLinks } from "./site";
import { PreRender } from "./fw/pre-render";

function base64forBrowser(s: string) {
  const utf16units = new Uint16Array(s.length);
  for (let i = 0; i < utf16units.length; i++) {
    utf16units[i] = s.charCodeAt(i);
  }
  return Buffer.from(
    utf16units.buffer,
    utf16units.byteOffset,
    utf16units.byteLength
  ).toString("base64");
}

// Returns [childChanged, preRenderedChild]
function preRender(element: ReactElement): [boolean, ReactElement] {
  let changed = false;
  if (element?.type === PreRender) {
    return [
      true,
      React.createElement("div", {
        dangerouslySetInnerHTML: {
          __html: renderToStaticMarkup(element.props.children),
        },
      }),
    ];
  }

  const children2 = [];
  let childList = element.props?.children ?? [];
  if (typeof childList !== "object" || !(childList instanceof Array)) {
    childList = [childList];
  }
  for (const c of childList) {
    if (c !== undefined) {
      const [childChanged, preRenderedChild] = preRender(c);
      changed = changed || childChanged;
      children2.push(preRenderedChild);
    }
  }
  if (!changed) {
    return [false, element];
  } else {
    return [true, React.createElement(element.type, element.props, children2)];
  }
}

export function reactPage(
  element: ReactElement,
  assetInfo: CssAndJsLinks | Request
) {
  const assets = cssAndJsLinks(assetInfo);

  element = preRender(element)[1];

  const data = elementToJsonObj(element, getAppTypeMap());
  const app = renderToString(element);
  const dataAsJson = JSON.stringify(data);
  jsonObjToElement(JSON.parse(dataAsJson), getAppTypeMap());

  return (
    "<!DOCTYPE html>\n" +
    renderToStaticMarkup(
      <html>
        <head>
          {assets.css.map((s, i) => (
            <link key={i} rel="stylesheet" href={s} />
          ))}
        </head>
        <body>
          <div id="app" dangerouslySetInnerHTML={{ __html: app }}></div>
          <script id="data" type="application/json">
            {base64forBrowser(dataAsJson)}
          </script>
          {assets.js.map((s, i) => (
            <script key={i} src={s} />
          ))}
        </body>
      </html>
    )
  );
}
