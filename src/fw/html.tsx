// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import React, { ReactElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";

function boilerplate(
  props: {
    title: string;
    dangerouslySetInnerHTML: { __html: string };
    bodyClasses?: string;
  },
  scripts: string[],
  stylesheets: string[]
) {
  return (
    <html>
      <head>
        <meta charSet="utf8" />
        <meta name="referrer" content="same-origin" />
        <title>{props.title}</title>
        {scripts.map((s, index) => (
          <script key={`js${index}`} src={s}></script>
        ))}
        {stylesheets.map((s, index) => (
          <link key={`css${index}`} rel="stylesheet" href={s}></link>
        ))}
      </head>
      <body
        className={props.bodyClasses}
        dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
      />
    </html>
  );
}

export function fullHtmlDocumentWithBody(
  bodyContents: ReactElement,
  title = "",
  scripts = ["/dist/main.js"],
  stylesheets: string[] = []
) {
  const renderedComponent = renderToString(bodyContents);

  return (
    "<!DOCTYPE html>\n" +
    renderToStaticMarkup(
      boilerplate(
        {
          title,
          dangerouslySetInnerHTML: { __html: renderedComponent },
        },
        scripts,
        stylesheets
      )
    )
  );
}
