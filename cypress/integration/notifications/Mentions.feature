Feature: Notification for a mention
  As a user
  I want to be notified if sb. mentions me in a post or comment
  In order join conversations about or related to me

  Background:
    Given we have a selection of categories
    And we have the following user accounts:
      | name              | slug              | email             | password |
      | Wolle aus Hamburg | wolle-aus-hamburg | wolle@example.org | 1234     |
      | Matt Rider        | matt-rider        | matt@example.org  | 4321     |

  Scenario: Mention another user, re-login as this user and see notifications
    Given I log in as "Wolle aus Hamburg"
    And I start to write a new post with the title "Hey Matt" beginning with:
      """
      Big shout to our fellow contributor
      """
    And mention "@matt-rider" in the text
    And I select a category
    And I choose "en" as the language for the post
    And I click on "Save"
    And I log in as "Matt Rider"
    And see 1 unread notifications in the top menu
    And open the notification menu and click on the first item
    Then I get to the post page of ".../hey-matt"
    And the unread counter is removed
    And the notification menu button links to the all notifications page    

