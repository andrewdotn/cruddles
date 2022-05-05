// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Task, taskFields } from "./task";
import { Change, compareModelInstances } from "../model-utils/history-utils";

export interface TaskHistoryJsonObj {
  id?: number;
  taskId?: number | null;
  change?: string;
  createdAt?: string;
  task?: { id: number; subject: string; body: string; priority: number };
}

export type TaskChange = Change<Task>;
export function compareTasks(t1: Task, t2: Task) {
  return compareModelInstances(taskFields, t1, t2);
}

@Entity()
export class TaskHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne((type) => Task, (t) => t.history)
  task?: Task;

  @Column({ nullable: true })
  taskId?: number | null;

  @Column()
  change?: string;

  @CreateDateColumn()
  createdAt?: Date;

  toJsonObj(): TaskHistoryJsonObj {
    const ret: TaskHistoryJsonObj = {
      id: this.id,
      taskId: this.taskId,
      change: this.change,
      createdAt: this.createdAt?.toString(),
    };
    if (this.task) {
      ret.task = {
        id: this.task.id!,
        subject: this.task.subject!,
        body: this.task.body!,
        priority: this.task.priority!,
      };
    }
    return ret;
  }
}
