// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";
import { extractCssAndJsLinks } from "./extract-css-and-js-links";

describe("extractCssAndJsLinks", function () {
  it("works", function () {
    expect(
      extractCssAndJsLinks(`
       <html>
       <!-- Hello, world -->
       <head>
       <script src="foo.js"></script>
       <link rel="stylesheet" href="blah.css"/>
       </head>
       </head>
       <body>
       <h1 class="foo">Hi!</h1>h1>
       </body>
       <script src="bar baz.js"></script>
        <link rel="stylesheet" href="blah3.css">
       </html>
       `)
    ).to.eql({ css: ["blah.css", "blah3.css"], js: ["foo.js", "bar baz.js"] });
  });
});
