import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps'

/* global cy  */

let lastPostTitle

const savePostTitle = $post => {
  return $post
    .first()
    .find('.ds-heading')
    .first()
    .invoke('text')
    .then(title => {
      lastPostTitle = title
    })
}
const invokeReportOnElement = selector => {
  cy.get(selector)
    .first()
    .find('.content-menu-trigger')
    .first()
    .click()

  return savePostTitle(cy.get(selector)).then(() => {
    cy.get('.popover .ds-menu-item-link')
      .contains('Report')
      .click()
  })
}

Given('I am logged in as {string}', userType => {
  cy.loginAs(userType)
})

Given('I previously reported a post', () => {
  invokeReportOnElement('.post-card')
})

Given('I am viewing a post', () => {
  cy.visit('/')
  cy.get('.post-card:nth(2)')
    .click()
    .wait(200)
  cy.location('pathname').should('contain', '/post')
})

When('I report the current post', () => {
  invokeReportOnElement('.post-card').then(() => {
    cy.get('button')
      .contains('Send')
      .click()
  })
})

When('I click on a Post menu and select the report option', () => {
  invokeReportOnElement('.post-card')
})

When('I click on send in the confirmation dialog', () => {
  cy.get('button')
    .contains('Send')
    .click()
})

Then('I get a success message', () => {
  cy.get('.iziToast-message').contains('Thanks')
})

Then('I see my reported post', () => {
  cy.get('table').then(() => {
    cy.get('tbody tr:first-child()').contains(lastPostTitle.slice(0, 20))
  })
})
