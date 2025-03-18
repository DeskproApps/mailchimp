Mailchimp App Setup
===

# Installation

To install Mailchimp, choose between OAuth2 or API Key. Find instructions for each below.

With either option, once you've logged in to your [Mailchimp account](https://mailchimp.com), click on your avatar on the screen and head over to the "Account & Billing" page.

[![](/docs/assets/setup/mailchimp-setup-01.png)](/docs/assets/setup/mailchimp-setup-01.png)

To configure who can see and use the Mailchimp app, head to the "Permissions" tab and select those users and/or groups
you'd like to have access.

When you're happy, click "Install".

## OAuth2

Click on the "Extras" tab and then navigate to "Registered Apps".

[![](/docs/assets/setup/mailchimp-setup-06.png)](/docs/assets/setup/mailchimp-setup-06.png)

Click on the "Register An App" button.

[![](/docs/assets/setup/mailchimp-setup-07.png)](/docs/assets/setup/mailchimp-setup-07.png)

Fill in the required fields, and for the "redirect URI", copy the "callback URL" from the settings tab in the app drawer and paste it in. Then click "Create".

[![](/docs/assets/setup/mailchimp-setup-08.png)](/docs/assets/setup/mailchimp-setup-08.png)

Once created, you will be presented with your "client ID" and "client secret". **It's important that you keep your client secret safe, as it won't be shown again.**

[![](/docs/assets/setup/mailchimp-setup-09.png)](/docs/assets/setup/mailchimp-setup-09.png)

Check the URL you are on to get the "domain", which should be a country code followed by a number. In this example, it is "us11":

[![](/docs/assets/setup/mailchimp-setup-10.png)](/docs/assets/setup/mailchimp-setup-10.png)


## API Key

Click on the "Extras" tab and then navigate to "API Keys".

[![](/docs/assets/setup/mailchimp-setup-02.png)](/docs/assets/setup/mailchimp-setup-02.png)

Click on the "Create A Key" button.

[![](/docs/assets/setup/mailchimp-setup-03.png)](/docs/assets/setup/mailchimp-setup-03.png)

Copy the API key for a later step. It's **important that you keep your secret API token safe**.

[![](/docs/assets/setup/mailchimp-setup-04.png)](/docs/assets/setup/mailchimp-setup-04.png)

Ok, head back to Deskpro and click on the "Settings" tab in the Mailchimp app.

[![](/docs/assets/setup/mailchimp-setup-05.png)](/docs/assets/setup/mailchimp-setup-05.png)

Your API key will look something like this:

`7c8a402742aa45ddbec16aaa029a79c1-us20`

Enter the API key as follows:

* **Domain** - Enter the last portion of the API key, in this case it will be `us20`
* **API Key** - Enter the entire API key here, `7c8a402742aa45ddbec16aaa029a79c1-us20`