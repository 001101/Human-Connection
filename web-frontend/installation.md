# Web Installation

{% hint style="warning" %}
This documentation should be split into a **local** and a **docker** installation variant. Also maybe there should be a main docker installation guide for the whole system at once!?
{% endhint %}

## Clone Repository

The Frontend Repository can be found on github.  
[https://github.com/Human-Connection/Nitro-Web](https://github.com/Human-Connection/Nitro-Web)

```bash
git@github.com:Human-Connection/Nitro-Web.git
```

## Install Dependencies

{% hint style="info" %}
Make sure you are running on Node 10: `node --version`
{% endhint %}

{% tabs %}
{% tab title="Yarn" %}
```bash
cd styleguide && yarn install && cd ..
yarn install
```
{% endtab %}

{% tab title="NPM" %}
```bash
cd styleguide && npm install && cd ..
npm install
```
{% endtab %}
{% endtabs %}

## Development

To start developing you need to start the server with the dev command. This will give you "hot reload" which updates the browser content \(mostly\) without reloading the whole page.

{% tabs %}
{% tab title="Yarn" %}
```bash
yarn dev
```
{% endtab %}

{% tab title="NPM" %}
```bash
npm run dev
```
{% endtab %}
{% endtabs %}

This will start the UI under [http://localhost:3000](http://localhost:3000)

For development environments, we created three users with different profiles and privileges.

Login to the app with one the following credentials:

* email: user@example.org
* email: moderator@example.org
* email: admin@example.org

password: 1234 \(same for all profiles\)

![You should see this under http://localhost:3000](../.gitbook/assets/screenshot.png)

