import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { RequestMediaType, RequestStatus } from '../providers/request-provider.js';

const DATA_DIRECTORY = process.env.MEDIAOPS_DATA_DIR?.trim() || './data';
const STORE_PATH = join(DATA_DIRECTORY, 'requests.json');
const TEMP_STORE_PATH = `${STORE_PATH}.tmp`;

let mutationQueue: Promise<void> = Promise.resolve();

export interface TrackedRequest {
  providerRequestId: string;
  providerId: string;
  mediaType: RequestMediaType;
  title: string;
  year: number | undefined;
  discordUserId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  availableNotifiedAt: string | undefined;
}

async function readAll(): Promise<TrackedRequest[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as TrackedRequest[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(items: TrackedRequest[]): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(TEMP_STORE_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
  await rename(TEMP_STORE_PATH, STORE_PATH);
}

function runMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function saveTrackedRequest(request: TrackedRequest): Promise<void> {
  await runMutation(async () => {
    const items = await readAll();
    const index = items.findIndex(item => item.providerRequestId === request.providerRequestId);
    if (index >= 0) items[index] = request;
    else items.push(request);
    await writeAll(items);
  });
}

export async function listTrackedRequests(): Promise<TrackedRequest[]> {
  await mutationQueue;
  return readAll();
}

export async function updateTrackedRequest(
  providerRequestId: string,
  patch: Partial<TrackedRequest>,
): Promise<TrackedRequest | undefined> {
  return runMutation(async () => {
    const items = await readAll();
    const index = items.findIndex(item => item.providerRequestId === providerRequestId);
    if (index < 0) return undefined;

    const current = items[index];
    if (!current) return undefined;

    const updated: TrackedRequest = {
      ...current,
      ...patch,
    };

    items[index] = updated;
    await writeAll(items);
    return updated;
  });
}
