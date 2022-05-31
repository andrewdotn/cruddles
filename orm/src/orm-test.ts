import { expect } from "chai";
import { describe, it } from "mocha";
import { ModelDescription } from "./model-description";
import { DB_MANAGER, DbManager } from "./db-manager";

import type { Foo as FooType } from "../generated-model";
import { constructionCookie } from "./_internal";

describe("foo", function () {
  it("can make something", async function () {
    let desc = new ModelDescription("Foo");
    desc.addField("hi", { type: "int" });
    let model = await desc.build();

    DB_MANAGER.connect();
    try {
      const Foo = (await import(`${process.cwd()}/${model.path}`))
        .Foo as typeof FooType;
      Foo.syncSchema();

      expect(Foo.objects.all().length).to.eql(0);
      Foo.create({ hi: 3 });
      expect(Foo.objects.all().length).to.eql(1);
      expect(Foo.objects.all()[0].hi).to.eql(3);
    } finally {
      DB_MANAGER.close();
    }
  });
});
