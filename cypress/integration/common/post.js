import { When, Then } from "cypress-cucumber-preprocessor/steps";
import locales from '../../../webapp/locales'
import orderBy from 'lodash/orderBy'

const languages = orderBy(locales, 'name')
const narratorAvatar =
  "https://s3.amazonaws.com/uifaces/faces/twitter/nerrsoft/128.jpg";

When("I type in a comment with {int} characters", size => {
  var c="";
  for (var i = 0; i < size; i++) {
    c += "c"
  }
  cy.get(".editor .ProseMirror").type(c);
});

Then("I click on the {string} button", text => {
  cy.get("button")
    .contains(text)
    .click();
});

Then("I click on the reply button", () => {
  cy.get(".reply-button")
    .click();
});

Then("my comment should be successfully created", () => {
  cy.get(".iziToast-message").contains("Comment submitted!");
});

Then("I should see my comment", () => {
  cy.get("div.comment p")
    .should("contain", "Human Connection rocks")
    .get(".user-avatar img")
    .should("have.attr", "src")
    .and("contain", narratorAvatar)
    .get(".user-teaser > .info > .text")
    .should("contain", "today at");
});

Then("I should see the entirety of my comment", () => {
  cy.get("div.comment")
  .should("not.contain", "show more")
});

Then("I should see an abreviated version of my comment", () => {
  cy.get("div.comment")
  .should("contain", "show more")
});

Then("the editor should be cleared", () => {
  cy.get(".ProseMirror p").should("have.class", "is-empty");
});

Then("it should create a mention in the CommentForm", () => {
  cy.get(".ProseMirror a")
    .should('have.class', 'mention')
    .should('contain', '@peter-pan')
})

When("I open the content menu of post {string}", (title)=> {
  cy.contains('.post-card', title)
  .find('.content-menu .base-button')
  .click()
})

When("I click on 'Pin post'", (string)=> {
  cy.get("a.ds-menu-item-link").contains("Pin post")
    .click()
})

Then("there is no button to pin a post", () => {
  cy.get("a.ds-menu-item-link")
    .should('contain', "Report Post") // sanity check
    .should('not.contain', "Pin post")
})

And("the post with title {string} has a ribbon for pinned posts", (title) => {
  cy.get("article.post-card").contains(title)
  .parent()
  .find("div.ribbon.ribbon--pinned")
  .should("contain", "Announcement")
})

Then("I see a toaster with {string}", (title) => {
  cy.get(".iziToast-message").should("contain", title);
})

Then("I should be able to {string} a teaser image", condition => {
  let teaserImageUpload = "onourjourney.png";
  if (condition === 'change') teaserImageUpload = "humanconnection.png";
  cy.fixture(teaserImageUpload).as('postTeaserImage').then(function() {
    cy.get("#postdropzone").upload(
      { fileContent: this.postTeaserImage, fileName: teaserImageUpload, mimeType: "image/png" },
      { subjectType: "drag-n-drop", force: true }
    );
  })
})

Then('confirm crop', () => {
  cy.get('.crop-confirm')
    .click()
})

Then("I add all required fields", () => {
  cy.get('input[name="title"]')
    .type('new post')
    .get(".editor .ProseMirror")
    .type('new post content')
    .get(".base-button")
    .contains("Just for Fun")
    .click()
    .get('.ds-flex-item > .ds-form-item .ds-select ')
    .click()
    .get('.ds-select-option')
    .eq(languages.findIndex(l => l.code === 'en'))
    .click()
})

Then("the post was saved successfully with the {string} teaser image", condition => {
  cy.get(".ds-card-content > .ds-heading")
    .should("contain", condition === 'new' ? 'new post' : 'to be updated')
    .get(".content")
    .should("contain", condition === 'new' ? 'new post content' : 'successfully updated')
    .get('.post-page img')
    .should("have.attr", "src")
    .and("contains", condition === 'new' ? "onourjourney" : "humanconnection")
})

Then("the first image should be removed from the preview", () => {
  cy.fixture("humanconnection.png").as('postTeaserImage').then(function() {
    cy.get("#postdropzone")
      .children()
      .get('img.thumbnail-preview')
      .should('have.length', 1)
      .and('have.attr', 'src')
      .and('contain', this.postTeaserImage)
  })
})

Then('the post was saved successfully without a teaser image', () => {
  cy.get(".ds-card-content > .ds-heading")
    .should("contain", 'new post')
    .get(".content")
    .should("contain", 'new post content')
    .get('.post-page')
    .should('exist')
    .get('.post-page img.ds-card-image')
    .should('not.exist')
})

Then('I should be able to remove it', () => {
  cy.get('.crop-cancel')
    .click()
})