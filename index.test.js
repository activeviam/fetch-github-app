/* eslint-env jest */
/* eslint-disable no-console, no-magic-numbers, no-process-env */

'use strict';

const envalid = require('envalid');

const fetchGithubApp = require('.');

let config = {};

beforeAll(() => {
  // Envalid logs an error and exit the process when the env is invalid.
  // Instead, we want it to just throw an error so that jest can display it.
  // That's why we temporarily hack the original console.error.
  const originalConsoleErrorBehaviour = console.error;
  console.error = err => {
    throw new Error(err);
  };
  try {
    const {
      APP_ID: appId,
      APP_PEM_BASE64_ENCODED: appPrivateKey,
      INSTALLATION_ID: installationId,
      USER_AGENT: userAgent,
    } = envalid.cleanEnv(process.env, {
      APP_ID: envalid.num(),
      // Using base64 encoding in order not to deal with cumbersome EOL escaping.
      APP_PEM_BASE64_ENCODED: envalid.makeValidator(str =>
        Buffer.from(str, 'base64').toString('utf8')
      )(),
      INSTALLATION_ID: envalid.num(),
      USER_AGENT: envalid.str(),
    });
    config = {appId, appPrivateKey, installationId, userAgent};
  } finally {
    console.error = originalConsoleErrorBehaviour;
  }
});

test('works as expected', () =>
  fetchGithubApp(config).then(githubApp => {
    expect(typeof githubApp.installationAccessToken).toBe('string');

    return githubApp.fetch('installation/repositories').then(body => {
      expect(body.repositories).toBeInstanceOf(Array);
    });
  }));
