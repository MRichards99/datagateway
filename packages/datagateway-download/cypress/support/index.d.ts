declare namespace Cypress {
  interface Chainable<Subject> {
    login(
      username?: string,
      password?: string
    ): Cypress.Chainable<Cypress.Response>;
    clearDownloadCart(): Cypress.Chainable<Cypress.Response>;
    seedDownloadCart(): Cypress.Chainable<Cypress.Response>;
    addCartItem(cartItem: string): Cypress.Chainable<Cypress.Response>;
    seedDownloads(): Cypress.Chainable<Cypress.Response>;
    clearDownloads(): Cypress.Chainable<Cypress.Response>;
  }
}
