// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Element, parse } from "parse5";

export interface CssAndJsLinks {
  css: string[];
  js: string[];
}

function walk(node: Element, css: string[], js: string[]) {
  if (node.nodeName === "script") {
    for (const c of node.attrs || []) {
      if (c.name === "src") {
        js.push(c.value);
      }
    }
  }
  if (node.nodeName === "link") {
    const stylesheet = (node.attrs || []).find(
      (a) => a.name === "rel" && a.value === "stylesheet"
    );
    if (stylesheet) {
      const href = (node.attrs || []).find((a) => a.name === "href");
      if (href) {
        css.push(href.value);
      }
    }
  }

  if (node.childNodes) {
    for (const c of node.childNodes) {
      walk(c, css, js);
    }
  }
}

export function extractCssAndJsLinks(html: string): CssAndJsLinks {
  const ret = { css: [], js: [] };

  const parsed = parse(html);
  walk(parsed, ret.css, ret.js);

  return ret;
}
