// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { TaskJsonObj } from "../models/task";
import React from "react";

export function LinkToTask({ task }: { task: TaskJsonObj }) {
  return (
    <>
      <a href={`/tasks/${task.id}`} className="tasklink__id">
        {task.id}
      </a>{" "}
      <span className="tasklink__description">{task.description}</span>
    </>
  );
}
