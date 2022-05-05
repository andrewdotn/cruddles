// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";
import { elementToJsonObj, jsonObjToElement, TypeKey } from "./element-json";
import React, { Component, Fragment, ReactElement } from "react";
import { TypeMap } from "./type-map";

class Blah {
  n: string;

  constructor() {
    this.n = "blah";
  }
}
interface DummyProps {
  a: number;
  b: string;
  c: boolean;
  blah?: Blah;
}
class Dummy extends Component<DummyProps> {}
// Props can be fairly deep json objects
class DummyWithJsonProp extends Component<{
  a?: { description: string; cost: number; mass: number };
}> {}
class DummyWithObjProp extends Component<{
  obj?: object;
  [TypeKey]?: string;
}> {}

describe("element-json", function () {
  const typeMap = new TypeMap();
  typeMap.register(Dummy, "Dummy");
  typeMap.register(DummyWithJsonProp, "DummyWithJsonParam");
  typeMap.register(DummyWithObjProp, "DummyWithObjProp");

  const literalTypeKey = () => ({ [TypeKey]: "123" });

  const testCases: [string, ReactElement, any][] = [
    ["h1", <h1 />, { [TypeKey]: "h1" }],
    [
      "h1 with children",
      <h1>Hello {"world"}</h1>,
      { [TypeKey]: "h1", props: { children: ["Hello ", "world"] } },
    ],
    [
      "Div with headings",
      <div>
        <h1 title="foo">Level {1}</h1>
        <h2>Level 2</h2>
      </div>,
      {
        [TypeKey]: "div",
        props: {
          children: [
            {
              [TypeKey]: "h1",
              props: { title: "foo", children: ["Level ", 1] },
            },
            { [TypeKey]: "h2", props: { children: "Level 2" } },
          ],
        },
      },
    ],
    [
      "List with keys",
      <ul>
        <li key={1}>One</li>
        <li key={2}>Two</li>
        <li key={3}>Three</li>
      </ul>,
      {
        [TypeKey]: "ul",
        props: {
          children: [
            {
              [TypeKey]: "li",
              key: "1",
              props: {
                children: "One",
              },
            },
            {
              [TypeKey]: "li",
              key: "2",
              props: {
                children: "Two",
              },
            },
            {
              [TypeKey]: "li",
              key: "3",
              props: {
                children: "Three",
              },
            },
          ],
        },
      },
    ],
    [
      "Dummy with children",
      <Dummy a={1} b={"2"} c={false}>
        Hello, <a href="about:blank">world!</a>
      </Dummy>,
      {
        [TypeKey]: {
          $$custom: "Dummy",
        },
        props: {
          a: 1,
          b: "2",
          c: false,
          children: [
            "Hello, ",
            {
              [TypeKey]: "a",
              props: {
                children: "world!",
                href: "about:blank",
              },
            },
          ],
        },
      },
    ],
    [
      "Dummy with nested params",
      <DummyWithJsonProp
        a={{ description: "Widget", cost: 0.71, mass: 1.2 }}
      />,
      {
        [TypeKey]: {
          $$custom: "DummyWithJsonParam",
        },
        props: {
          a: {
            cost: 0.71,
            description: "Widget",
            mass: 1.2,
          },
        },
      },
    ],
    [
      "Dummy with child dummy",
      <DummyWithJsonProp>
        <DummyWithJsonProp />
      </DummyWithJsonProp>,
      {
        [TypeKey]: {
          $$custom: "DummyWithJsonParam",
        },
        props: {
          children: {
            [TypeKey]: {
              $$custom: "DummyWithJsonParam",
            },
          },
        },
      },
    ],
    [
      "Fragment",
      <>
        <div className="hi">
          Hello, <b>world!</b>
        </div>
      </>,
      {
        [TypeKey]: { $$fragment: true },
        props: {
          children: {
            [TypeKey]: "div",
            props: {
              children: [
                "Hello, ",
                {
                  [TypeKey]: "b",
                  props: {
                    children: "world!",
                  },
                },
              ],
              className: "hi",
            },
          },
        },
      },
    ],
    [
      // Not 100% sure if the fragment ends up with a key in the browser
      // or not here.
      "Fragment with key",
      <div>
        <Fragment key="1" />
        <Fragment key="2" />
        <Fragment key="3" />
      </div>,
      {
        [TypeKey]: "div",
        props: {
          children: [
            { [TypeKey]: { $$fragment: true }, key: "1" },
            { [TypeKey]: { $$fragment: true }, key: "2" },
            { [TypeKey]: { $$fragment: true }, key: "3" },
          ],
        },
      },
    ],
    [
      "Element as prop",
      <DummyWithObjProp obj={<div />} />,
      {
        [TypeKey]: { $$custom: "DummyWithObjProp" },
        props: { obj: { [TypeKey]: "div" } },
      },
    ],
    [
      "Reusing TypeKey",
      <DummyWithObjProp obj={{ [TypeKey]: "div" }} />,
      {
        [TypeKey]: { $$custom: "DummyWithObjProp" },
        props: { obj: { [TypeKey]: { $$literal: "div" } } },
      },
    ],
    [
      "Using TypeKey as prop name",
      <DummyWithObjProp {...literalTypeKey()} />,
      {
        [TypeKey]: { $$custom: "DummyWithObjProp" },
        props: { [TypeKey]: { $$literal: "123" } },
      },
    ],
  ];
  for (const [name, e, expected] of testCases) {
    it(`turns ${name} into json`, function () {
      expect(elementToJsonObj(e, typeMap)).to.eql(expected);
    });

    it(`round-trips ${name} through stringifying`, function () {
      const jsonObj = elementToJsonObj(e, typeMap);
      const json = JSON.stringify(jsonObj);
      const parsed = JSON.parse(json);
      expect(jsonObjToElement(parsed, typeMap)).to.eql(e);
    });

    it(`loads ${name} from json`, function () {
      expect(jsonObjToElement(expected, typeMap)).to.eql(e);
    });
  }

  // This is a separate test because React.createElement creates `undefined`
  // values which cannot go into json.
  it("Turns Dummy with undefined param into json", function () {
    expect(
      elementToJsonObj(<DummyWithJsonProp a={undefined} />, typeMap)
    ).to.eql({
      [TypeKey]: {
        $$custom: "DummyWithJsonParam",
      },
      props: {},
    });
  });
});
