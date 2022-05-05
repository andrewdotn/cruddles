// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { newChoiceList } from "../fw/forms/choices";

export const StatusOptions = newChoiceList("todo", "started", "review", "done");
export type StatusOptions = typeof StatusOptions[number];
