// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";

import { createFormInstance, FormField, formClassFor } from "./forms";
import { newChoiceList } from "./forms/choices";

describe("fw forms", function () {
  const ChoicesForC = newChoiceList("foo", "bar");
  type ChoicesForC = typeof ChoicesForC[number];

  class C {
    @FormField
    a?: string;

    @FormField
    b?: number;

    @FormField
    c?: ChoicesForC;
  }

  it("works", async function () {
    const formClass = formClassFor(C, ["a", "b"]);
    const f = await createFormInstance(formClass, {
      b: "123",
    });
    expect(f.isValid()).to.be.true;
    expect(f.cleanedData()["b"]).to.eql(123);
  });

  it("gives an error if a choice is invalid", async function () {
    const formClass = formClassFor(C, ["c"]);
    const f = await createFormInstance(formClass, { c: "baz" });
    expect(f.isValid()).to.be.false;
    expect(f.fieldErrors("c")).to.eql([`Must be one of foo,bar`]);
  });

  it("doesn’t turn empty numbers into zeros", async function () {
    const formClass = formClassFor(C, ["a", "b"]);
    const f = await createFormInstance(formClass, { b: "" });
    expect(f.isValid()).to.be.true;
    expect(f.cleanedData()["b"]).to.be.null;
  });
});
