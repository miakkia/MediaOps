import 'dotenv/config';

import type {
  MediaProvider,
} from './media-provider.js';

import {
  EmbyMediaProvider,
} from './emby/emby-provider.js';

import {
  JellyfinMediaProvider,
} from './jellyfin/jellyfin-provider.js';

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

  case 'jellyfin':
    return new JellyfinMediaProvider();

  default:
    throw new Error(
      `Unsupported MEDIA_PROVIDER: ${rawProvider}`,
    );
}
}
export const mediaProvider =
  createMediaProvider();