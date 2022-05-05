// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class ConfigParam extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  key?: string;

  @Column()
  value?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
