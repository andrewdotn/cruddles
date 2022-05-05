// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import "./style.scss";

import "regenerator-runtime";

import React from "react";
import { hydrate } from "react-dom";
import { jsonObjToElement } from "../fw/element-json";
import { getAppTypeMap } from "./app-type-map";

/**
 * JSON embedded in a script tag either has " turn into &quot; making it
 * tricky to undo, or is vulnerable to </script> appearing inside some json
 * string somewhere.
 *
 * Base64 seems like the natural way to get around that, but the browser’s
 * vestigial window.{atob,btoa} functions—which I just learned about
 * today!—require the base64-decoded characters to be <= 0xff.
 *
 * So on the server we turn the utf-16 string into a buffer of Uint16s,
 * reinterpret that as a Uint8 buffer, and base64-encode that.
 *
 * This code reverses that.
 *
 * Would not be surprised if there were endianness bugs. Don’t have a sparc
 * handy to test.
 *
 * Based on
 *  https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_3_–_JavaScripts_UTF-16_>_binary_string_>_base64
 */
function decodeUtf16Base64(s: string) {
  const str16encodedAs8 = atob(s);
  const buf8 = new Uint8Array(str16encodedAs8.length);
  for (let i = 0; i < str16encodedAs8.length; i++) {
    buf8[i] = str16encodedAs8.charCodeAt(i);
  }
  const buf16 = new Uint16Array(
    buf8.buffer,
    buf8.byteOffset,
    buf8.byteLength / 2
  );
  let ret = "";
  for (let i = 0; i < buf16.length; i++) {
    ret += String.fromCharCode(buf16[i]);
  }
  return ret;
}

// The result of React.createElement() here is thrown away, but exists so that
// any packaging issues with importing react are caught as soon as possible.
<h1 />;

// Smoke test: this should be an otter emoji
console.log(decodeUtf16Base64("SABpACAAPtim3Q=="));

function doHydration() {
  const appElement = document.getElementById("app");
  if (appElement) {
    const dataElement = document.getElementById("data");
    if (dataElement) {
      const raw = dataElement.innerHTML;
      const decoded = decodeUtf16Base64(raw);
      const data = JSON.parse(decoded);
      const app = jsonObjToElement(data, getAppTypeMap());

      hydrate(app, appElement);
    }
    return true;
  }
  return false;
}

/*
 * If the DOM element already exists—which is the case on hot reload—render it
 * immediately. This assumes DOM nodes don’t exist until their children are
 * created; if the app DOM node already exists while its (potentially lengthy)
 * contents are still streaming in, that’ll throw off hydration.
 */
if (!doHydration()) {
  document.addEventListener("DOMContentLoaded", doHydration);
}

/*
 * My current understanding of how hot module reload works, that I wish was
 * explained at https://webpack.js.org/api/hot-module-replacement/, if my
 *  understanding is correct:
 *
 *   - Some wrapper functionality takes care of loading all modules
 *   - When that wrapper loads a module, it remembers whether
 *     `module.hot.accept` was called on initial load
 *   - Later, when that wrapper gets notified that a new version of module M is
 *     ready, it walks up the tree of things that imported M, until it
 *     finds a root R that called `module.hot.accept()` on initial load. It
 *     calls the `module.hot.dispose` handler for R if there is one, then
 *     loads the new version of M, passes that as the dependency to new
 *     versions of everything that depends on M, and so on, until it ends
 *     up at R and stops.
 *   - The new version of R calling `module.hot.accept()` is a declaration
 *     that R is willing to go through all this again, should M be updated
 *     again.
 *
 * The key things that were surprising for me:
 *   - `module.hot.accept` is not a callback/notification from the hmr
 *     system to hot-reloadable code; it’s a declaration from
 *     already-loaded, possibly just-hot-reloaded module, telling the hmr
 *     system that it can be a reload root in the future
 *   - and thus `module.hot.accept(libraryNames, callback)` isn’t for hmr to
 *     tell you, “hey, something you depend on got replaced, here’s the new
 *     version” but instead for you to tell hmr, “I will act as a reload
 *     root for these libraries.”
 */
if (process.env.NODE_ENV !== "production") {
  if (module.hot) {
    module.hot.dispose(() => {
      document.removeEventListener("DOMContentLoaded", doHydration);
    });

    module.hot.accept();
  }
}
