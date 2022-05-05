// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import "mocha";

import { constants } from "mocha/lib/runner";

import "mocha/mocha.css";
import "./test-index.css";

mocha.setup("bdd");

import "../fw/frontend-tests/browser-tests";

// All that’s needed to run the tests is `mocha.run()`, but that doesn’t
// actually report when the suite is done. There’s just a canvas-based progress
// meter that can get to 100%. So we add our own `done` hook.
document.addEventListener("DOMContentLoaded", () => {
  const target = document.querySelector(".results-summary")!;

  /**
   * Add an ‘s’ to the end of `word`, if `n !== 1`.
   *
   * Only works for the most typical form of English pluralization.
   */
  function pluralize(n: number, word: string) {
    let result = `${n} ${word}`;
    if (n !== 1) {
      result += "s";
    }
    return result;
  }

  const runner = mocha
    .run((done) => {
      const { failures, total, stats } = runner;

      let status = `Done. ${pluralize(failures, "failure")}`;
      if (stats?.pending) {
        status += `, ${stats.pending} pending,`;
      }
      status += ` out of a total of ${pluralize(total, "test")}.`;
      target.textContent = status;
    })
    .on(constants.EVENT_RUN_BEGIN, () => (target.textContent = "started"));
});
