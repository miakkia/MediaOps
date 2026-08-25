import { randomUUID } from 'node:crypto';

import type {
  RequestSearchResult,
} from '../providers/request-provider.js';

const DEFAULT_TTL_MS = 15 * 60 * 1000;

interface StoredRequestSelection {
  token: string;
  discordUserId: string;
  item: RequestSearchResult;
  expiresAt: number;
}

const selections = new Map<string, StoredRequestSelection>();

export function storeRequestSelection(
  discordUserId: string,
  item: RequestSearchResult,
  ttlMs = DEFAULT_TTL_MS,
): string {
  cleanupExpiredRequestSelections();

  const token = randomUUID();

  selections.set(token, {
    token,
    discordUserId,
    item: {
      ...item,
    },
    expiresAt: Date.now() + ttlMs,
  });

  return token;
}

export function getRequestSelection(
  token: string,
  discordUserId: string,
): RequestSearchResult | undefined {
  const stored = selections.get(token);

  if (!stored) {
    return undefined;
  }

  if (stored.expiresAt <= Date.now()) {
    selections.delete(token);
    return undefined;
  }

  if (stored.discordUserId !== discordUserId) {
    return undefined;
  }

  return {
    ...stored.item,
  };
}

export function consumeRequestSelection(
  token: string,
  discordUserId: string,
): RequestSearchResult | undefined {
  const item = getRequestSelection(token, discordUserId);

  if (!item) {
    return undefined;
  }

  selections.delete(token);
  return item;
}

export function cleanupExpiredRequestSelections(): number {
  const now = Date.now();
  let removed = 0;

  for (const [token, selection] of selections) {
    if (selection.expiresAt <= now) {
      selections.delete(token);
      removed += 1;
    }
  }

  return removed;
}

export function clearRequestSelectionsForTests(): void {
  selections.clear();
}
