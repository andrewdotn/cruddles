// Copyright © 2019 - 2022 Andrew Neitsch. All rights reserved.

export {}; // For TS1208

describe("mocha tests", function () {
  specify("the test suite passes", function () {
    // cy.login();

    cy.visit("/test");
    cy.get(".results-summary").contains("Done. 0 failures");
  });
});
