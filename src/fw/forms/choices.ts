// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import "reflect-metadata";

const CHOICE_SYMBOL = Symbol("choices");

export function newChoiceList<T extends string[]>(...o: T) {
  Object.defineProperty(o, CHOICE_SYMBOL, { value: o });
  return o;
}

type Choice<T> = T &
  string[] & {
    [CHOICE_SYMBOL]: string[];
  };

export function isChoiceList(list: any) {
  return list != null && CHOICE_SYMBOL in list;
}

export function getChoices<T>(list: any) {
  const l2 = list as Choice<T>;
  if (!(CHOICE_SYMBOL in list)) {
    throw new Error("not a choice list");
  }
  return l2[CHOICE_SYMBOL].slice();
}
