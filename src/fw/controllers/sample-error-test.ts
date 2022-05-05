// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

import { expect } from "chai";
import { serverTestCrud } from "../../test/server-test-crud";

describe("/500-page", function () {
  const testCrud = serverTestCrud();
  before(() => testCrud.connection());

  it("shows a page", async function () {
    const { agent } = await testCrud.loggedInSession();
    const { user } = await testCrud.lazyTestUser();
    user.isAdmin = true;
    await user.save();

    const response1 = await agent.get(`/500-test`);
    expect(response1.text).to.include(`>Throw exception<`);

    // We don’t actually do the POST here, because the server has logic, in the
    // form of a `catchAndMaybeExit` handler, that crashes if any route handler
    // throws an exception.
  });
});
