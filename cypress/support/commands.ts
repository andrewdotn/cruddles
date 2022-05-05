// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

/**
 * Log in, using the password from `fixtures/cypress-users.json`. These users
 * can be created using `src/scripts/create-cypress-users.ts`.
 */
// Cypress.Commands.add("login", (username = "cypress") => {
//   cy.fixture("cypress-users.json").then((users) => {
//     for (const u of users) {
//       if (u.username === username) {
//         cy.request({
//           method: "POST",
//           url: "/login",
//           form: true,
//           body: {
//             username: u.username,
//             password: u.password,
//           },
//         });
//         return;
//       }
//     }
//     throw new Error(`No user ‘${username}’ found in fixtures`);
//   });
// });

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      // login(username?: string): Chainable<Element>;
    }
  }
}
