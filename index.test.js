/* eslint-env jest */
/* eslint-disable no-process-env */

'use strict';

const dotenv = require('dotenv');

const fetchGithubApp = require('.');

const config = {};

beforeAll(() => {
  dotenv.config();

  const envToConfigMapping = {
    APP_ID: {format: Number, key: 'appId'},
    // Using base64 encoding in order not to deal with cumbersome EOL escaping.
    APP_PEM_BASE64_ENCODED: {
      format: value => Buffer.from(value, 'base64').toString('utf8'),
      key: 'appPrivateKey',
    },
    INSTALLATION_ID: {format: Number, key: 'installationId'},
    USER_AGENT: {format: String, key: 'userAgent'},
  };

  Object.keys(envToConfigMapping).forEach(envKey => {
    const {key: configKey, format} = envToConfigMapping[envKey];

    if (!process.env.hasOwnProperty(envKey)) {
      throw new Error(`Missing environment variable ${envKey}.`);
    }

    config[configKey] = format(process.env[envKey]);
  });
});

test('works as expected', () =>
  fetchGithubApp(config).then(githubApp => {
    expect(typeof githubApp.installationAccessToken).toBe('string');

    return githubApp.fetch('installation/repositories').then(body => {
      expect(body.repositories).toBeInstanceOf(Array);
    });
  }));
