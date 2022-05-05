// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { BaseEntity, FindManyOptions, ObjectType } from "typeorm";
import { NotFoundError } from "../server";
import { SelfDescribingError } from "./error-utils";

class TooManyMatchesError extends SelfDescribingError {}

/**
 * Return the only entity matching the given conditions.
 *
 * Throws NotFoundError() if there are no matches, and TooManyMatchesError() if
 * there are multiple.
 */
export async function findExactlyOneOrFail<T extends BaseEntity>(
  entityClass: { new (): T } & {
    find<T>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<T[]>;
  },
  options: FindManyOptions<T>
): Promise<T> {
  if ("take" in options || "skip" in options) {
    throw new Error("Cannot use take or skip with findExactlyOneOrFail");
  }
  options.take = 2;
  const result = await entityClass.find(options);
  if (result.length == 0) {
    throw new NotFoundError();
  }
  if (result.length == 1) {
    return result[0];
  }
  throw new TooManyMatchesError(`querying ${entityClass.name}`);
}
