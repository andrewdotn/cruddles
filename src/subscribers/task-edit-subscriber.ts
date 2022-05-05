// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import {
  EntitySubscriberInterface,
  EventSubscriber,
  IsNull,
  MoreThanOrEqual,
  Not,
  UpdateEvent,
} from "typeorm";
import { Task } from "../models/task";
import { compareTasks, TaskHistory } from "../models/task-history";

@EventSubscriber()
export class TaskStatusSubscriber implements EntitySubscriberInterface<Task> {
  listenTo() {
    return Task;
  }

  async beforeUpdate(event: UpdateEvent<Task>) {
    // Ensure a history item has been created, with a non-null user. If
    // this turns out to be too slow, it could be disabled in production.
    // With good unit test coverage, having it enabled only in tests
    // should be enough.
    const change = JSON.stringify(
      compareTasks(event.databaseEntity, event.entity)
    );
    const history = await TaskHistory.findOne({
      where: {
        taskId: event.databaseEntity.id,
        change,
        userId: Not(IsNull()),
        createdAt: MoreThanOrEqual(new Date(new Date().getTime() - 5000)),
      },
    });
    if (!history) {
      throw new Error("refusing save, no history entry found");
    }
  }
}
