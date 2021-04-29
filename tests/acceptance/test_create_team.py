from sentry.models import Team
from sentry.testutils import AcceptanceTestCase


class CreateTeamTest(AcceptanceTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("foo@example.com")
        self.org = self.create_organization(name="Rowdy Tiger", owner=None)
        self.team = self.create_team(organization=self.org, name="Mariachi Band")
        self.project = self.create_project(organization=self.org, teams=[self.team], name="Bengal")
        self.create_member(user=self.user, organization=self.org, role="owner", teams=[self.team])
        self.login_as(self.user)
        self.path = f"/settings/{self.org.slug}/teams/"

    def test_create(self):
        self.browser.get(self.path)
        self.browser.wait_until_test_id("team-list")

        # Open the modal
        self.browser.click('button[aria-label="Create Team"]')
        self.browser.wait_until(".modal-content")
        self.browser.element('input[id="slug"]').send_keys("new-team")
        self.browser.click('.modal-content button[aria-label="Create Team"]')

        # Wait for modal to go away.
        self.browser.wait_until_not(".modal-content")

        # New team should be in dom
        assert self.browser.find_element_by_xpath("//span[contains(text(), 'new-team')]")
        assert Team.objects.filter(slug="new-team", organization=self.org).exists()
