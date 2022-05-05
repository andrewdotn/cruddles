// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { inspect } from "util";

// A typescript approximation of json
export type TsJson =
  | null
  | string
  | number
  | boolean
  | TsJson[]
  | { [s: string]: TsJson };
type retType = [true, undefined] | [false, string];

export function isJson(a: unknown): a is TsJson {
  const stack: unknown[] = [];
  const ret = isJson1(a, stack, []);
  if (stack.length !== 0) {
    throw new Error("stack mismatch");
  }
  return ret[0];
}

export function throwIfNotJson(obj: unknown) {
  const ret = isJsonWithDetails(obj);
  if (!ret[0]) {
    throw new Error(`${inspect(obj)} is not json: ${ret[1]}`);
  }
}

export function isJsonWithDetails(a: unknown): retType {
  return isJson1(a, [], []);
}

function makeRet(
  message: string | undefined,
  breadCrumbs: string[],
  v: unknown
): retType {
  if (message === undefined) {
    return [true, undefined];
  }
  let name = "obj";
  if (breadCrumbs.length !== 0) {
    name += "." + breadCrumbs.join(".");
  }
  return [false, `${name}, type ${typeof v} = ${inspect(v)} ${message}`];
}

function isJson1(
  a: unknown,
  cycleDetectorStack: unknown[],
  keyBreadCrumbs: string[]
): retType {
  if (a === undefined) {
    return makeRet(`is undefined`, keyBreadCrumbs, a);
  }
  if (a === null || typeof a === "string" || typeof a === "boolean") {
    return [true, undefined];
  }
  if (typeof a === "number") {
    const sub = Number.isFinite(a) && !Number.isNaN(a);
    return makeRet(!sub ? `is infinite or NaN` : undefined, keyBreadCrumbs, a);
  }
  if (cycleDetectorStack.indexOf(a) !== -1) {
    cycleDetectorStack.pop();
    return makeRet(`forms a cycle`, keyBreadCrumbs, a);
  }
  cycleDetectorStack.push(a);
  try {
    if (a instanceof Array) {
      for (let i = 0; i < a.length; i++) {
        const c = a[i];
        const sub = isJson1(
          c,
          cycleDetectorStack,
          keyBreadCrumbs.concat([i.toString()])
        );
        if (!sub[0]) {
          return sub;
        }
      }
      return [true, undefined];
    }
    if (Object.getPrototypeOf(a)?.constructor === Object) {
      for (const k in a as object) {
        const sub = isJson1(
          (a as any)[k],
          cycleDetectorStack,
          keyBreadCrumbs.concat([k])
        );
        if (!sub[0]) {
          return sub;
        }
      }
      return [true, undefined];
    }
  } finally {
    cycleDetectorStack.pop();
  }
  return makeRet("is not a plain object", keyBreadCrumbs, a);
}
