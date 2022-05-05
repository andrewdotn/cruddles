// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Request, Response } from "express";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";
import { Task } from "../models/task";
import { TaskList } from "../frontend/task-list";
import { reactPage } from "../react-page";
import { SiteNav } from "../views/site-nav";
import React from "react";
import { qs } from "./utils";
import { FindConditions } from "typeorm";
import { saferParseInt } from "../util/safer-parse-int";

export async function taskList(req: Request, res: Response) {
  const where: FindConditions<Task> = {};
  const taskQueryOptions: FindManyOptions<Task> = {
    where,
  };
  if (req.query.limit) {
    taskQueryOptions.take = saferParseInt(req.query.limit);
  }

  let tasks = await Task.find(taskQueryOptions);

  let description = "";

  let notes;

  res.send(
    reactPage(
      <SiteNav {...SiteNav.propsFromRequest(req)}>
        <h1>Tasks{description}</h1>
        {notes ?? []}
        <TaskList
          initialTasks={tasks.map((t) => t.toJsonObj())}
          originalQs={qs(req)}
        />
      </SiteNav>,
      req
    )
  );
}
