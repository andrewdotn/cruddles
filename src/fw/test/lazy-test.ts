// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import { lazy } from "./lazy";

// Most of these tests aren’t very good examples of how to use the
// functionality, since they’re testing edge cases.
describe("lazy", function () {
  describe("lazily getting static things", function () {
    const c = lazy(() => 42);

    it("returns values", async function () {
      expect(await c()).to.eql(42);
    });
  });

  describe("getting something async", function () {
    let operationCalls = 0;
    let operationDone = false;
    function possiblyExpensiveOperation() {
      operationCalls++;
      return new Promise((resolve) =>
        setTimeout(() => {
          operationDone = true;
          resolve(new Object());
        }, 0)
      );
    }

    const l = lazy(possiblyExpensiveOperation);

    it("does nothing if not used", function () {
      expect(operationCalls).to.eql(0);
    });

    it("returns the value when called", async function () {
      expect(operationDone).to.be.false;
      const obj1 = await l();
      expect(operationDone).to.be.true;
      expect(operationCalls).to.eql(1);
      const obj2 = await l();
      expect(obj1 === obj2).to.be.true;
    });
  });

  describe("error handling", function () {
    const l = lazy(() => {
      throw new Error("oops");
    });

    it("how do normal errors work anyway?", async function () {
      // https://github.com/chaijs/chai/issues/415#issuecomment-89669181
      await expect(
        (async () => {
          throw new Error("oops");
        })()
      ).to.be.rejectedWith(/oops/);
    });

    it("handles errors gracefully", async function () {
      await expect(l()).to.be.rejectedWith(/oops/);
    });
  });

  describe("cleanup", function () {
    let object1: Object;
    let initHappened: boolean;
    let cleanupCalled: boolean;
    const l = lazy(
      () => {
        initHappened = true;
        return new Object({});
      },
      () => {
        cleanupCalled = true;
      }
    );

    beforeEach(() => {
      initHappened = false;
    });

    it("gets initialized on the first call", async function () {
      expect(cleanupCalled).to.be.undefined;
      expect(initHappened).to.be.false;
      object1 = await l();
      expect(initHappened).to.be.true;
    });

    // A little dodgy, but this test requires the previous test to run first in
    // the same session.
    it("gets cleaned up before the second call", async function () {
      expect(cleanupCalled).to.be.true;
      expect(initHappened).to.be.false;
      const object2 = await l();
      expect(initHappened).to.be.true;
      expect(object2 !== object1).to.be.true;
    });
  });

  describe("it doesn’t get cleaned up if not initialized", function () {
    let cleanupCalled = false;
    // @ts-ignore
    const l = lazy(
      () => {},
      () => (cleanupCalled = true)
    );

    specify("no-op test", function () {
      // need something here so afterEach runs
    });

    it("didn’t get cleaned up", function () {
      expect(cleanupCalled).to.be.false;
    });
  });

  describe("it calls cleanup even if the test throws", function () {
    let cleanedUp = false;
    const l = lazy(
      () => {
        throw new Error("oops");
      },
      () => (cleanedUp = true)
    );

    it("throws an error when awaited", function () {
      expect(l()).to.be.rejectedWith(/oops/);
    });

    it("cleaned up", function () {
      expect(cleanedUp).to.be.true;
    });
  });

  describe("cleanup gets passed the results of the initialization", function () {
    let createdObject: Object;
    const l = lazy(
      () => (createdObject = new Object()),
      (o: Object) => {
        if (o !== createdObject) {
          throw new Error("did not get same object back");
        }
      }
    );

    it("works", async function () {
      await l();
    });
  });

  describe("it runs cleanups in reverse order", function () {
    let initOrder: number[] = [];
    let cleanupOrder: number[] = [];
    const lazy1 = lazy(
      () => initOrder.push(1),
      () => cleanupOrder.push(1)
    );
    const lazy2 = lazy(
      () => initOrder.push(2),
      () => cleanupOrder.push(2)
    );

    specify("no-op test", async function () {
      await lazy1();
      await lazy2();
      expect(initOrder).to.eql([1, 2]);
    });

    it("worked", function () {
      this.skip();

      expect(cleanupOrder).to.eql([2, 1]);
    });
  });

  it("runs cleanup when lazy called during function", async function () {
    await lazy(
      () => 42,
      () => 42,
      this
    );
  });

  describe("it runs cleanups in reverse order when nested", function () {
    let initOrder: number[] = [];
    let cleanupOrder: number[] = [];
    const lazy1 = lazy(
      () => initOrder.push(1),
      () => cleanupOrder.push(1)
    );

    describe("nested", function () {
      const lazy2 = lazy(
        async () => {
          await lazy1();
          initOrder.push(2);
        },
        () => cleanupOrder.push(2)
      );

      specify("no-op test", async function () {
        await lazy1();
        await lazy2();
        expect(initOrder).to.eql([1, 2]);
      });

      it("worked", function () {
        expect(cleanupOrder).to.eql([2, 1]);
      });
    });
  });

  it("fails the test if the lazy initializer fails");
});
