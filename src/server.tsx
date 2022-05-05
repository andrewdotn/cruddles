// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { join as joinpath, resolve } from "path";
import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import React from "react";
import { myHtml } from "./site";
import { setupSessions } from "./fw/session";
import { getConnection } from "typeorm";
import { editTask } from "./controllers/task-edit";
import { i } from "./fw/i";
import { readFile } from "fs/promises";
import {
  CssAndJsLinks,
  extractCssAndJsLinks,
} from "./fw/extract-css-and-js-links";
import { AlertProps } from "react-bootstrap";
import { taskList } from "./controllers/task-list";
import { taskDetail } from "./controllers/task-detail";
import { SelfDescribingError } from "./fw/error-utils";
import { VError } from "verror";
import * as http from "http";
import { taskEditBody } from "./controllers/task-edit-api";

export interface FlashItem {
  variant: AlertProps["variant"];
  dangerouslySetHtmlContent: string;
}

declare global {
  namespace Express {
    interface Request {
      flash?: FlashItem[];
    }
  }
}

function validateUser(...args: unknown[]) {
  return true;
}

export interface ServerLocals {
  cssAndJs: CssAndJsLinks;
}

// https://stackoverflow.com/a/48794739/14558
export function isPromise<T>(val: Promise<T> | T): val is Promise<T> {
  return val && (val as Promise<T>).then !== undefined;
}

interface ServerArgs {
  sessionSecret?: string;
  devSetup?: (s: Server, e: Express) => void;
}

export class NotFoundError extends SelfDescribingError {}

export class Server {
  app: Express;
  hasDevServer: boolean;
  parcelServerUrl?: string;
  // For testing
  exitOnException = false;

  constructor({ sessionSecret, devSetup }: ServerArgs = {}) {
    const server = this;
    const app = express();

    app.set("trust proxy", "loopback");

    app.use(morgan("dev"));

    // The code would be shorter if it stored the condition in a boolean
    // directly, but TypeScript can’t infer through that.
    if (devSetup && process.env.NODE_ENV !== "production") {
      // this.app is not set until end of constructor, so pass it separately
      devSetup(this, app);
      this.hasDevServer = true;
    } else {
      this.hasDevServer = false;
    }
    this.setupAssets(app);

    app.disable("x-powered-by");

    app.use(bodyParser.urlencoded({ extended: false, parameterLimit: 100000 }));
    app.use(bodyParser.json());

    app.use(setupSessions(getConnection(), sessionSecret));

    /**
     * Call the given route handler, and if it returns a promise, wait for the
     * result and make sure next() gets called so that the browser gets a 500
     * page instead of a hanging request.
     *
     * NotFoundError is turned into a 404.
     *
     * TODO: return 404 on synchronous NotFoundError too; not an issue while
     * only returned by async functions that query database
     */
    function _asyncHandler(
      route: string,
      func: (req: Request, res: Response, next: NextFunction) => unknown
    ) {
      return (req: Request, res: Response, next: NextFunction) => {
        const ret = func(req, res, next);
        if (isPromise(ret)) {
          ret.catch((e) => {
            if (e instanceof NotFoundError) {
              // Let NotFoundError become a 404, instead of a 500.
              next();
            } else {
              if (server.exitOnException) {
                console.error(
                  `Exception encountered handling request ${route}, exiting`,
                  e
                );
                process.exit(1);
              }
              next(e);
            }
          });
        }
      };
    }

    function get(
      route: string,
      func: (req: Request, res: Response, next: NextFunction) => unknown
    ) {
      app.get(route, _asyncHandler(route, func));
    }
    function post(
      route: string,
      func: (req: Request, res: Response, next: NextFunction) => unknown
    ) {
      app.post(route, _asyncHandler(route, func));
    }

    get("/", async (req, res) => {
      if (await validateUser(req)) {
        res.redirect("/tasks");
        return;
      }
      res.redirect("/login");
    });

    if (process.env.NODE_ENV !== "production") {
      get("/hello", async (req, res) => {
        res.setHeader("Content-Type", "text/plain");
        res.send("Hello, world.\n");
      });

      get("/userinfo.json", async (req, res) => {
        const user = await validateUser(req);
        const loggedIn = !!user;
        const ret: { loggedIn: boolean; username?: string } = {
          loggedIn,
        };
        if (user) {
          ret.username = user.username!;
        }

        res.json(ret);
      });
    }

    // *Permission Check* -- everything below here only works if logged in.
    app.use(async (req, res, next) => {
      if (await validateUser(req)) {
        return next();
      }
      res.redirect("/");
    });

    app.use("/dist", express.static(joinpath(__dirname, "..", "dist")));

    get("/tasks", taskList);

    get("/tasks/new", editTask);
    post("/tasks/new", editTask);

    get("/tasks/:taskId(\\d+)", taskDetail);

    get("/tasks/:taskId(\\d+)/edit", editTask);
    post("/tasks/:taskId(\\d+)/edit", editTask);

    post("/tasks/:taskId(\\d+)/editBody", taskEditBody);

    if (process.env.NODE_ENV !== "production") {
      app.get("/test", (req, res) => {
        const prefix = this.parcelServerUrl ?? "/dist/";

        res.send(
          myHtml(
            <div id="mocha">
              <h1 className="page-heading">
                Mocha in-browser test run
                <h2 className="results-summary"></h2>
              </h1>
            </div>,
            {
              js: [`${prefix}/test-index.js`],
              css: [`${prefix}/test-index.css`],
            }
          )
        );
      });
    }

    this.app = app;
  }

  async setupAssets(app: Express) {
    const serverLocals = app.locals as ServerLocals;

    if (process.env.NODE_ENV === "production" || !this.hasDevServer) {
      try {
        const wrapperHtml = (
          await readFile(resolve(__dirname, "..", "dist", ".wrapper.html"))
        ).toString();
        const links = extractCssAndJsLinks(wrapperHtml);
        serverLocals.cssAndJs = links;
      } catch (e) {
        if (e.code === "ENOENT") {
          throw new VError(e, "do you need to run parcel?");
        } else {
          throw e;
        }
      }
    } else {
      const prefix = this.parcelServerUrl ?? "/dist/";
      serverLocals.cssAndJs = {
        css: [`${prefix}/client.css`],
        js: [`${prefix}/client.js`],
      };
    }
  }

  async serve({ port }: { port?: number } = {}): Promise<http.Server> {
    const listenMaybeWithPort = (cb: () => void) => {
      if (port !== undefined) {
        return this.app.listen(port, cb);
      } else {
        return this.app.listen(cb);
      }
    };

    return new Promise((resolve) => {
      const server = listenMaybeWithPort(() => {
        console.log(i`now listening on ${server.address()}`);
        resolve(server);
      });
    });
  }
}
