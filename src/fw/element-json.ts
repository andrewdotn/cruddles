// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

/* Functions for turning server JSX into JSON, and then doing the inverse on the
 * client.
 *
 * Won’t handle all of react—certainly not anonymous onClick handlers—but
 * should be enough to make it more convenient to pass a top-level <App/>
 * with a few properties.
 *
 * Most of this was developed with ts-nocheck; the types are tricky and the
 *  code really needs vetting with tests. Don’t be afraid to ignore ts errors
 *  in here, with the caution that doing so will also hide some real bugs …
 */

import React, {
  Attributes,
  Fragment,
  isValidElement,
  ReactElement,
} from "react";
import { inspect } from "util";
import { ComponentType, TypeMap } from "./type-map";
import { isJsonWithDetails, throwIfNotJson, TsJson } from "./is-json";

// But see https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
function entries2<T>(o: T): [T, T[keyof T]][] {
  return Object.entries(o) as any;
}

type JsxProps = { children?: JsxJson } & { [k: string]: JsxJson } & Attributes;

export const TypeKey = "$$jsxType.";

type JsxElement = {
  [TypeKey]:
    | string
    | { $$custom: string }
    | { $$fragment: true }
    | { $$literal: TsJson };
  props?: JsxProps;
  key?: string;
};

type JsxJson = TsJson | JsxElement | JsxJson[];

export function elementToJsonObj(e: ReactElement, typeMap: TypeMap): JsxJson {
  const ret = elementToJsonObj1(e, typeMap);
  const isJson = isJsonWithDetails(ret);
  if (!isJson[0]) {
    throw new Error(`${inspect(ret)} is not json: ${isJson[1]}`);
  }
  return ret;
}

function elementToJsonObj1(e: unknown, typeMap: TypeMap): JsxJson {
  if (e === undefined) {
    throw new Error("undefined cannot be stored in json");
  }
  if (
    e === null ||
    typeof e === "number" ||
    typeof e === "boolean" ||
    typeof e === "string"
  ) {
    return e;
  }
  if (e instanceof Array) {
    return e.map((i) => elementToJsonObj1(i, typeMap));
  }
  if (typeof e === "object" && isValidElement(e)) {
    const reactElement: ReactElement = e;
    let ret: JsxElement;
    let props = reactElement.props;
    if (reactElement.type === React.Fragment) {
      ret = { [TypeKey]: { $$fragment: true } };
    } else if (typeof reactElement.type !== "string") {
      const customTypeName = typeMap?.getNameOrThrow(reactElement.type);

      if (customTypeName) {
        ret = { [TypeKey]: { $$custom: customTypeName } };
      } else {
        throw new Error(
          `No encoding defined for ${inspect(reactElement.type)}`
        );
      }
    } else {
      ret = { [TypeKey]: reactElement.type };
    }
    if (props && Object.keys(props).length != 0) {
      const retProps: { [k: string]: JsxJson } = {};
      for (const [k, v] of entries2(props) as [string, JsxJson][]) {
        if (v !== undefined) {
          if (k === TypeKey) {
            // @ts-ignore
            retProps[k] = { $$literal: elementToJsonObj1(v, typeMap) };
          } else {
            retProps[k] = elementToJsonObj1(v, typeMap);
          }
        }
      }
      ret.props = retProps;
    }
    if (reactElement.key) {
      ret.key = reactElement.key as string;
    }
    return ret;
  } else if (typeof e === "object") {
    const ret = {} as JsxJson;
    for (const k in e) {
      if (e.hasOwnProperty(k)) {
        if (k === TypeKey) {
          // @ts-ignore
          ret[k] = { $$literal: elementToJsonObj(e[k]) };
        } else {
          // @ts-ignore
          ret[k] = e[k];
        }
      }
    }
    throwIfNotJson(ret);
    return ret;
  } else {
    throwIfNotJson(e);
    return e as TsJson;
  }
}

function isJsxElement(j: unknown): j is JsxElement {
  return j && !!(<JsxElement>j)[TypeKey];
}

export function jsonObjToElement(
  json: JsxJson,
  typeMap: TypeMap
): ReactElement {
  if (isJsxElement(json)) {
    // @ts-ignore
    if (typeof json[TypeKey] !== "string" && "$$literal" in json[TypeKey]) {
      // @ts-ignore
      return { [TypeKey]: jsonObjToElement(json[TypeKey].$$literal) };
    }
    const props: JsxProps = {};
    for (const k in json.props) {
      if (k === TypeKey) {
        // @ts-ignore
        props[k] = jsonObjToElement(json.props[k].$$literal, typeMap) as any;
      } else {
        props[k] = jsonObjToElement(json.props[k], typeMap) as any;
      }
    }
    if (json.key) {
      props.key = json.key;
    }
    const children = json.props?.children;
    // the default inference is any[], so this isn’t much different
    let childList: any = [];
    if (children !== undefined) {
      if (
        children === null ||
        typeof children === "string" ||
        typeof children === "number" ||
        typeof children === "boolean" ||
        (typeof children === "object" && !(children instanceof Array))
      ) {
        childList = [children];
      } else if (children[Symbol.iterator]) {
        childList = [...children];
      } else {
        throw new Error(`don’t know what to do with ${children}`);
      }
      if (childList instanceof Array && childList.length > 0) {
        childList = childList.map((c) => jsonObjToElement(c, typeMap));
      } else {
        childList = jsonObjToElement(childList, typeMap);
      }
      delete props.children;
    }
    let type = json[TypeKey];
    let determinedType: string | ComponentType;
    if (typeof type === "string") {
      determinedType = type;
    } else if ("$$fragment" in type) {
      determinedType = Fragment;
    } else if ("$$literal" in type) {
      throw new Error("$$literal failed to be collapsed");
    } else {
      determinedType = typeMap?.getClassOrThrow(type.$$custom);
    }
    return React.createElement(determinedType, props, ...childList);
  } else {
    // @ts-ignore
    return json;
  }
}
