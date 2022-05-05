// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { ISession } from "connect-typeorm";

@Entity()
export class Session implements ISession {
  @Index()
  @Column()
  // @ts-ignore - ISession is incompatible with --strictPropertyInitialization
  expiredAt: number;

  @PrimaryColumn("varchar", { length: 255 })
  // @ts-ignore
  id: string;

  @Column("text")
  // @ts-ignore
  json: string;
}
