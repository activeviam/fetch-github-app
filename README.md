[![npm version](https://img.shields.io/npm/v/fetch-github-app.svg)](https://npmjs.org/package/fetch-github-app)
[![build status](https://img.shields.io/circleci/project/github/activeviam/fetch-github-app.svg)](https://circleci.com/gh/activeviam/fetch-github-app)

# Goal

This package is made to simplify calls to the GitHub API as a [GitHub App](https://developer.github.com/apps/). It [authenticates as a GitHub App](https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/about-authentication-options-for-github-apps/#authenticating-as-a-github-app) and then gives you a wrapper around [Fetch](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) so that you can interact with the GitHub API easily.

# Usage

 1. Add this package to your dependencies: `npm install --save fetch-github-app`
 2. Use it like this:
   ```javascript
   const fetchGithubApp = require('fetch-github-app');

   const config = {
     // Can be found in the "GitHub Apps" section of your developer or organization settings.
     appId: 1337,
     // See https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/registering-github-apps/#generating-a-private-key.
     appPrivateKey: '-----BEGIN RSA PRIVATE KEY----- ...',
     // Can be found in the "Installed GitHub Apps" section of your developer or organization settings,
     // or in the payload of WebHook requests sent by GitHub to your App.
     installationId: 42,
     // See https://developer.github.com/v3/#user-agent-required.
     userAgent: 'your-username-or-org-name'
    };

   fetchGithubApp(config).then(githubApp => {
    // You can retrieve the installation access token if you need to use it directly.
    console.log(githubApp.installationAccessToken);

    // And you can call the GitHub API (notice that you do not have to prefix your paths by https://api.github.com/).
    return githubApp.fetch('installation/repositories').then(body => {
      console.log(body.repositories);
    });
   });
   ```

# Testing

To test the package on your machine:
 1. `npm install`
 2. Create a `.env` file respecting the [dotenv guidelines](https://github.com/motdotla/dotenv) and add the environment variables mentioned by `index.test.js`.
 3. `npm test`
