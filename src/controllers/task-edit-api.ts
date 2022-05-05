// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { saferParseInt } from "../util/safer-parse-int";
import { findExactlyOneOrFail } from "../fw/entity-utils";
import { Task } from "../models/task";
import type { Request, Response } from "express";

export async function taskEditBody(req: Request, res: Response) {
  const id = saferParseInt(req.params.taskId);
  const t = await findExactlyOneOrFail(Task, { where: { id } });

  const newBody = req.body.body;
  if (typeof newBody === "string") {
    if (newBody.length < 8) {
      res.status(422);
      res.json({ error: "must be at least 8 characters" });
      return;
    }

    t.body = newBody;
    await t.saveWithHistoryEntry();
    res.status(200);
    res.json({ id: t.id, body: t.body });
    return;
  } else {
    res.status(422);
    res.send({ error: "action must be a string" });
    return;
  }
}
