// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import {BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,} from "typeorm";
import {TaskHistory} from "./task-history";
import {saveHistoryWithComputedChanges} from "../model-utils/history-utils";


// TODO: would be nice to have a helper method to list fields of an entity
export const taskFields: readonly (keyof Task)[] = [
    "subject",
    "body",
    "priority"
];

export interface TaskJsonObj {
  id?: number;
  subject?: string;
  body?: string;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  subject?: string;

  @Column()
  body?: string;

  @Column()
  priority?: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany((type) => TaskHistory, (h) => h.task)
  history?: TaskHistory[];

  @Column({ type: Boolean, default: false })
  pinned?: boolean;

  toJsonObj(): TaskJsonObj {
return {
      id: this.id,
      subject: this.subject,
      body: this.body,
      priority: this.priority,
      createdAt: this.createdAt?.toJSON(),
      updatedAt: this.updatedAt?.toJSON(),
    };
  }

  async saveWithHistoryEntry() {
    return saveHistoryWithComputedChanges(
      this,
      Task,
      TaskHistory,
      "taskId",
      taskFields,
    );
  }
}
