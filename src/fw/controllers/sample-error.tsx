// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import express from "express";
import { reactPage } from "../../react-page";
import { SiteNav } from "../../views/site-nav";
import React from "react";

export async function sampleError(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!req.user?.isAdmin) {
    next();
    return;
  }

  if (req.method === "POST") {
    if (req.body.action === "reject-promise") {
      await new Promise((resolve, reject) =>
        reject(new Error("Test" + " rejection"))
      );
    } else {
      throw new Error("Test exception");
    }
  }

  res.send(
    reactPage(
      <SiteNav {...SiteNav.propsFromRequest(req)}>
        <h1>Error testing</h1>
        <p>
          Use this page to generate a test error, to see how the web server
          responds to errors.
        </p>
        <form method="post">
          <button className="button">Throw exception</button>
          <button className="button" name="action" value="reject-promise">
            Reject promise
          </button>
        </form>
      </SiteNav>,
      req
    )
  );
}
