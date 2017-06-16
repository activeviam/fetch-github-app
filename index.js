'use strict';

const assert = require('assert');

const jwt = require('jwt-simple');
const fetchJson = require('node-fetch-json');

const githubApiRootUrl = 'https://api.github.com';

const getGithubApiUrl = path =>
  path.startsWith(githubApiRootUrl) ? path : `${githubApiRootUrl}/${path}`;

const getApiRequestHeaders = ({
  appJwt,
  installationAccessToken,
  userAgent,
}) => ({
  // Temporary header during the GitHub Apps beta period.
  // See https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/about-authentication-options-for-github-apps/.
  Accept: 'application/vnd.github.machine-man-preview+json',
  Authorization: appJwt
    ? `Bearer ${appJwt}`
    : `token ${installationAccessToken}`,
  'User-Agent': userAgent,
});

const signJwt = ({appId, appPrivateKey}) => {
  // eslint-disable-next-line no-magic-numbers
  const timestamp = Math.round(new Date().getTime() / 1000);
  // The JWT can be shortlived as we only use it to retrieve an access token.
  const timeToLiveInSecond = 10;

  return jwt.encode(
    {
      exp: timestamp + timeToLiveInSecond,
      iat: timestamp,
      iss: appId,
    },
    appPrivateKey,
    // That's the algorithm required by GitHub.
    'RS256'
  );
};

// To access the GitHub API, a GitHub App first have to get an installation token.
// See https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/about-authentication-options-for-github-apps/#authenticating-as-a-github-app.
const fetchInstallationAccessToken = ({
  appId,
  appPrivateKey,
  installationId,
  userAgent,
}) =>
  fetchJson(getGithubApiUrl(`installations/${installationId}/access_tokens`), {
    headers: getApiRequestHeaders({
      appJwt: signJwt({appId, appPrivateKey}),
      userAgent,
    }),
    method: 'POST',
  }).then(body => {
    if (!body.token) {
      throw new Error(`Missing token in body: ${JSON.stringify(body)}`);
    }

    return body.token;
  });

const fetchGithubApp = config => {
  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV !== 'production') {
    ['appId', 'appPrivateKey', 'installationId', 'userAgent'].forEach(key => {
      assert.ok(config[key], `Missing configuration value for "${key}".`);
    });
  }

  return fetchInstallationAccessToken(config).then(installationAccessToken => {
    const fetch = (path, request = {}) =>
      fetchJson(
        getGithubApiUrl(path),
        Object.assign(
          {
            headers: Object.assign(
              getApiRequestHeaders({
                installationAccessToken,
                userAgent: config.userAgent,
              }),
              request.headers || {}
            ),
          },
          request
        )
      );

    return {fetch, installationAccessToken};
  });
};

module.exports = fetchGithubApp;
