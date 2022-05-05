// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

export function appendClasses(
  className?: string,
  moreClassNames?: (string | undefined)[] | string
) {
  if (moreClassNames instanceof Array) {
    moreClassNames = moreClassNames.filter((e) => e !== undefined).join(" ");
  }
  if (moreClassNames !== undefined) {
    return (className ? className + " " : "") + moreClassNames;
  }
  return className;
}
