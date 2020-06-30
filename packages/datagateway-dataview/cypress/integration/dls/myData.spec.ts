describe('DLS - MyData Table', () => {
  beforeEach(() => {
    cy.login('user', 'password');
    cy.visit('/my-data/DLS');
    cy.server();
    cy.route('**/datasets/count*').as('getDatasetCount');
  });

  it('should load correctly', () => {
    cy.title().should('equal', 'DataGateway DataView');
    cy.get('#datagateway-dataview').should('be.visible');
  });

  it('should be able to click an investigation to see its datasets', () => {
    cy.get('[role="gridcell"] a').first().click({ force: true });

    cy.location('pathname').should(
      'eq',
      '/browse/proposal/INVESTIGATION%201/investigation/1/dataset'
    );
  });

  it('should be able to resize a column', () => {
    let columnWidth = 0;

    cy.window()
      .then((window) => {
        const windowWidth = window.innerWidth;
        columnWidth = (windowWidth - 40) / 6;
      })
      .then(() => expect(columnWidth).to.not.equal(0));

    cy.get('[role="columnheader"]').eq(1).as('titleColumn');
    cy.get('[role="columnheader"]').eq(2).as('visitIdColumn');

    cy.get('@titleColumn').should(($column) => {
      const { width } = $column[0].getBoundingClientRect();
      expect(width).to.equal(columnWidth);
    });

    cy.get('@visitIdColumn').should(($column) => {
      const { width } = $column[0].getBoundingClientRect();
      expect(width).to.equal(columnWidth);
    });

    cy.get('.react-draggable')
      .first()
      .trigger('mousedown')
      .trigger('mousemove', { clientX: 400 })
      .trigger('mouseup');

    cy.get('@titleColumn').should(($column) => {
      const { width } = $column[0].getBoundingClientRect();
      expect(width).to.be.greaterThan(columnWidth);
    });

    cy.get('@visitIdColumn').should(($column) => {
      const { width } = $column[0].getBoundingClientRect();
      expect(width).to.be.lessThan(columnWidth);
    });
  });

  describe.skip('should be able to sort by', () => {
    // we only have one row - so can't properly test sorting
  });

  describe('should be able to filter by', () => {
    it('text', () => {
      cy.get('[aria-rowcount="1"]').should('exist');
      cy.get('[aria-label="Filter by Title"]').find('input').type('invalid');

      cy.get('[aria-rowcount="0"]').should('exist');
    });

    it('date between', () => {
      cy.get('[aria-rowcount="1"]').should('exist');

      cy.get('[aria-label="Start Date date filter to"]')
        .parent()
        .find('button')
        .click();

      cy.get('.MuiPickersDay-day[tabindex="0"]').first().click();

      cy.contains('OK').click();

      const date = new Date();
      date.setDate(1);

      cy.get('[aria-label="Start Date date filter to"]').should(
        'have.value',
        date.toISOString().slice(0, 10)
      );

      cy.get('[aria-rowcount="1"]').should('exist');

      cy.get('[aria-label="Start Date date filter from"]').type('2000-04-04');

      cy.get('[aria-rowcount="0"]').should('exist');
    });

    it('multiple columns', () => {
      cy.get('[aria-label="Filter by Beamline').find('input').type('8');

      cy.get('[aria-rowcount="1"]').should('exist');

      cy.get('[aria-label="Filter by Title"]').find('input').type('invalid');

      cy.get('[aria-rowcount="0"]').should('exist');
    });
  });

  describe('should be able to view details', () => {
    it('when no other row is showing details', () => {
      cy.get('[aria-label="Show details"]').first().click();

      cy.contains(
        'Title: Including spend increase ability music skill former. Agreement director concern once technology sometimes someone staff.'
      ).should('be.visible');
      cy.get('[aria-label="Hide details"]').should('exist');
    });

    // TODO: Since we only have one investigation, we cannot test
    // showing details when another row is showing details at the moment.

    it('and view visit users, samples and publications', () => {
      // We need to wait for counts to finish, otherwise cypress
      // might interact with the details panel too quickly and
      // it re-renders during the test.
      cy.contains('[aria-rowindex="1"] [aria-colindex="4"]', '2').should(
        'exist'
      );

      cy.get('[aria-label="Show details"]').first().click();

      cy.get('[aria-controls="visit-samples-panel"]').click();
      cy.get('#visit-samples-panel').should('not.have.attr', 'hidden');
      cy.contains('Sample: SAMPLE 1').should('be.visible');

      cy.get('[aria-controls="visit-users-panel"]').click();
      cy.get('#visit-users-panel').should('not.have.attr', 'hidden');
      cy.contains('Investigator: Robert499').should('be.visible');

      cy.get('[aria-controls="visit-publications-panel"]').click();
      cy.get('#visit-publications-panel').should('not.have.attr', 'hidden');
      cy.contains(
        'Reference: Democrat sea gas road police. Citizen relationship southern affect. Thousand national especially. In edge far education.'
      );
    });

    it('and then not view details anymore', () => {
      cy.get('[aria-label="Show details"]').first().click();

      cy.get('[aria-label="Hide details"]').first().click();

      cy.contains(
        'Title: Including spend increase ability music skill former. Agreement director concern once technology sometimes someone staff.'
      ).should('not.be.visible');
      cy.get('[aria-label="Hide details"]').should('not.exist');
    });
  });
});