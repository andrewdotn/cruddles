// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { saferParseInt } from "../util/safer-parse-int";
import { SimplifiedUser } from "./editable-user";

export function findUserNameInList(
  userId: number | string,
  userList: SimplifiedUser[]
) {
  if (typeof userId === "string") {
    userId = saferParseInt(userId);
  }
  const user = userList.find((u) => u.id === userId);
  if (!user) {
    throw new Error(`couldn’t find user with id ${userId}`);
  }
  return user.name;
}
