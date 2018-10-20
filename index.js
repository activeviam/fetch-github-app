'use strict';

const assert = require('assert');

const jwt = require('jwt-simple');
const fetchJson = require('fetch-json');

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
  fetchJson.post(getGithubApiUrl(`installations/${installationId}/access_tokens`), {}, {
    headers: getApiRequestHeaders({
      appJwt: signJwt({appId, appPrivateKey}),
      userAgent,
    }),
  }).then(body => {
    if (!body.token) {
      throw new Error(`Missing token in body: ${JSON.stringify(body)}`);
    }

    return body.token;
  });

const fetchGithubApp = config => {
  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV !== 'production') {
    assert(typeof config.appId === 'number', 'appId should be a number');
    assert(
      /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/m.test(
        config.appPrivateKey
      ),
      'appPrivateKey should be a valid RSA private key'
    );
    assert(
      typeof config.installationId === 'number',
      'installationId should be a number'
    );
    assert(
      typeof config.userAgent === 'string',
      'userAgent should be a string'
    );
  }

  return fetchInstallationAccessToken(config).then(installationAccessToken => {
    const fetch = (path, request = {}) =>
      fetchJson.request(
        request.method,
        getGithubApiUrl(path),
        request.body,
        Object.assign({}, request, {
          headers: Object.assign(
            getApiRequestHeaders({
              installationAccessToken,
              userAgent: config.userAgent,
            }),
            request.headers || {}
          ),
        })
      );

    return {fetch, installationAccessToken};
  });
};

module.exports = fetchGithubApp;
