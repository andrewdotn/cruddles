// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Request, Response } from "express";
import { Task } from "../models/task";
import { SiteNav } from "../views/site-nav";
import { saferParseInt } from "../util/safer-parse-int";
import React, { ReactElement } from "react";
import { createFormInstance, formClassFor, FormType } from "../fw/forms";
import { TableForm } from "../fw/forms/table-form";
import { pick } from "lodash";
import { PreRender } from "../fw/pre-render";
import { reactPage } from "../react-page";
import { LinkToTask } from "../components/link-to-task";
import { findExactlyOneOrFail } from "../fw/entity-utils";

export async function editTask(req: Request, res: Response) {
  let t: Task;
  if (req.params.taskId !== undefined) {
    t = await findExactlyOneOrFail(Task, {
      where: { id: saferParseInt(req.params.taskId) },
    });
  } else {
    t = new Task();
  }

  const formClass = class extends formClassFor<Task>(Task, [
    "subject",
    "body",
    "priority",
  ]) {
    placeholders = {
      priority: "1-9",
    };

    validate_priority() {
      const value = this.cleanedData()["priority"];
      if (!value) {
        this.addFieldError("priority", "Required");
      } else if (!/^[0-9]+$/.test(value)) {
        this.addFieldError("priority", "Cannot contain newlines");
      }
    }
  };

  let form: FormType<Task>;
  if (req.method === "POST") {
    form = await createFormInstance(formClass, req.body, t);
    if (form.isValid()) {
      Task.merge(t, form.cleanedData());
      await t.saveWithHistoryEntry();
      res.redirect(`/tasks/${t.id}`);
      return;
    }
  } else {
    if (req.query.clone) {
      try {
        const cloneSource = saferParseInt(req.query.clone);
        const tMaybe = await Task.findOne({ where: { id: cloneSource } });
        if (tMaybe) {
          tMaybe.id = undefined;
          tMaybe.createdAt = undefined;
          tMaybe.updatedAt = undefined;
          t = tMaybe;
        }
      } catch (e) {}
    }

    const queryDefaults = pick(req.query, ["priority"]);
    // We’re grabbing some values from the query string as sample user input.
    // Because there’s some user input, the form class will think that all
    // checkboxes are unset. That’s how HTML forms work: if unchecked, send
    // nothing. So if the boolean value is set in the database, simulate filling
    // it in when GETting the form.
    const userInput = t.pinned
      ? { ...queryDefaults, pinned: "on" }
      : queryDefaults;
    form = await createFormInstance(formClass, userInput, t);
  }

  // This doesn’t have to be tsx, the view should probably take a form object
  // instead
  let titleBlock: ReactElement;
  if (!t?.hasId()) {
    titleBlock = <>New Task</>;
  } else {
    titleBlock = <LinkToTask task={t.toJsonObj()} />;
  }

  res.send(
    reactPage(
      <SiteNav {...SiteNav.propsFromRequest(req)}>
        <h1>{titleBlock}</h1>
        <PreRender>
          <form method="POST">
            <TableForm form={form} />
            <div className="form__control">
              <button type="submit" className="button form__submit">
                {t.hasId() ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </PreRender>
      </SiteNav>,
      req
    )
  );
}
