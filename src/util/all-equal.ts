// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

export function allEqual<T>(
  array: T[]
):
  | { emptyArray: false; allEqual: false }
  | { emptyArray: false; allEqual: true; value: T }
  | { emptyArray: true } {
  if (array.length === 0) {
    return { emptyArray: true };
  }
  const initial = array[0];
  for (let i = 1; i < array.length; i++) {
    if (array[i] !== initial) {
      return { emptyArray: false, allEqual: false };
    }
  }
  return { emptyArray: false, allEqual: true, value: initial };
}
