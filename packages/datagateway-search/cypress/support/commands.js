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

import jsrsasign from 'jsrsasign';

const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = decodeURIComponent(
    atob(base64).replace(/(.)/g, function (m, p) {
      var code = p.charCodeAt(0).toString(16).toUpperCase();
      return '%' + ('00' + code).slice(-2);
    })
  );
  return payload;
};

export const readSciGatewayToken = () => {
  const token = window.localStorage.getItem('scigateway:token');
  let sessionId = null;
  let username = null;
  if (token) {
    const parsedToken = JSON.parse(parseJwt(token));
    if (parsedToken.sessionId) sessionId = parsedToken.sessionId;
    if (parsedToken.username) username = parsedToken.username;
  }

  return {
    sessionId,
    username,
  };
};

Cypress.Commands.add('login', () => {
  // TODO Use the ICAT backend for this request once it is enabled for pre-prod
  cy.request({
    method: 'POST',
    url: 'https://scigateway-preprod.esc.rl.ac.uk:8181/icat/session',
    body: {
      json: JSON.stringify({
        plugin: 'anon',
      }),
    },
    form: true,
  }).then((response) => {
    const jwtHeader = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sessionId: response.body.sessionId,
      username: 'test',
    };
    const jwt = jsrsasign.KJUR.jws.JWS.sign('HS256', jwtHeader, payload, 'shh');
    window.localStorage.setItem('scigateway:token', jwt);
  });
});

Cypress.Commands.add('clearDownloadCart', () => {
  return cy.readFile('server/e2e-settings.json').then((settings) => {
    // TODO: find facility from somewhere (should be provided through e2e-settings?)
    cy.request({
      method: 'DELETE',
      url: `${settings.downloadApiUrl}/user/cart/LILS/cartItems`,
      qs: {
        sessionId: readSciGatewayToken().sessionId,
        items: '*',
      },
    });
  });
});
