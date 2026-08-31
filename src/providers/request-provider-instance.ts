import type {
  RequestProvider,
} from './request-provider.js';

import {
  createOmbiClientFromEnvironment,
} from './ombi/ombi-client.js';

import {
  ombiConfig,
} from './ombi/ombi-config.js';

import {
  OmbiRequestProvider,
} from './ombi/ombi-request-provider.js';

import {
  SeerrRequestProvider,
} from './seerr/seerr-request-provider.js';

const configuredProvider =
  process.env.REQUEST_PROVIDER
    ?.trim()
    .toLowerCase();

export const requestProviderName =
  configuredProvider ||
  'none';

function createConfiguredRequestProvider():
RequestProvider | undefined {
  if (
    !configuredProvider ||
    configuredProvider === 'none'
  ) {
    return undefined;
  }

  switch (
    configuredProvider
  ) {
    case 'ombi':
      return new OmbiRequestProvider(
        createOmbiClientFromEnvironment(),
        {
          autoApprove:
            ombiConfig.autoApprove,
        },
      );

    case 'seerr':
      return new SeerrRequestProvider();

    default:
      throw new Error(
        `Unsupported REQUEST_PROVIDER: ${configuredProvider}`,
      );
  }
}

export let requestProvider:
RequestProvider | undefined =
  createConfiguredRequestProvider();

export function setRequestProvider(
  provider:
  RequestProvider | undefined,
): void {
  requestProvider =
    provider;
}

export function requireRequestProvider():
RequestProvider {
  if (!requestProvider) {
    throw new Error(
      'No RequestProvider is configured.',
    );
  }

  return requestProvider;
}