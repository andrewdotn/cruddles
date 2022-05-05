// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Task } from "../models/task";
import { saferParseInt } from "../util/safer-parse-int";
import { TaskHistory } from "../models/task-history";
import { reactPage } from "../react-page";
import { SiteNav } from "../views/site-nav";
import { TaskDetail } from "../views/task-detail";
import { TaskHistoryList } from "../frontend/task-history-list";
import type { Request, Response } from "express";
import React from "react";
import { findExactlyOneOrFail } from "../fw/entity-utils";

export async function taskDetail(req: Request, res: Response) {
  const t = await findExactlyOneOrFail(Task, {
    where: { id: saferParseInt(req.params.taskId) },
  });

  const history = await TaskHistory.find({
    where: { taskId: saferParseInt(req.params.taskId) },
    order: { createdAt: "DESC" },
  });

  let noteInfo = null;

  res.send(
    reactPage(
      <SiteNav {...SiteNav.propsFromRequest(req)}>
        <TaskDetail task={t.toJsonObj()}>{noteInfo}</TaskDetail>
        <TaskHistoryList historyItems={history.map((t) => t.toJsonObj())} />
      </SiteNav>,
      req
    )
  );
}
