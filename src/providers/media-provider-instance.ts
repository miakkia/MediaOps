import 'dotenv/config';

import type {
  MediaProvider,
} from './media-provider.js';

import {
  EmbyMediaProvider,
} from './emby/emby-provider.js';

const rawProvider =
  process.env.MEDIA_PROVIDER
    ?.trim()
    .toLowerCase() ||
  'emby';

function createMediaProvider():
  MediaProvider {
  switch (rawProvider) {
    case 'emby':
      return new EmbyMediaProvider();

    default:
      throw new Error(
        `Unsupported MEDIA_PROVIDER: ${rawProvider}`,
      );
  }
}

export const mediaProvider =
  createMediaProvider();