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
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (username, password) => {
  return cy.readFile('server/e2e-settings.json').then(settings => {
    cy.request('POST', `${settings.apiUrl}/sessions`, {
      username: username,
      password: password,
    }).then(response => {
      window.localStorage.setItem('daaas:token', response.body.sessionID);
    });
  });
});

Cypress.Commands.add('clearDownloadCart', () => {
  return cy.readFile('server/e2e-settings.json').then(settings => {
    // TODO: find facility from somewhere...
    cy.request({
      method: 'DELETE',
      url: `${settings.downloadApiUrl}/user/cart/LILS/cartItems`,
      qs: {
        sessionId: window.localStorage.getItem('icat:token'),
        items: '*',
      },
    });
  });
});
