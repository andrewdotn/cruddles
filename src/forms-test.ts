// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";

import { createFormInstance, formClassFor } from "./fw/forms";
import { Task } from "./models/task";

describe("forms", function () {
  it("works", async function () {
    const FormClass = formClassFor(Task, ["description", "status"]);
    const form = await createFormInstance(FormClass, {
      description: "hi",
      status: "blah",
    });
    expect(form.isValid()).to.be.false;
    expect(form.fieldErrors("status")).to.eql([
      "Must be one of todo,started,review,done",
    ]);
  });
});
