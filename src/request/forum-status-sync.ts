import type { Message, ThreadChannel } from 'discord.js';

export type ForumRequestStatus = 'requested' | 'processing' | 'available' | 'failed' | 'denied';

export interface ForumSyncConfig {
  forumChannelId: string;
  webhookId: string;
  movieTagId: string;
  seriesTagId: string;
  requestedTagId: string;
  processingTagId: string;
  availableTagId: string;
  failedTagId: string;
  deniedTagId: string;
}

function env(name: string): string {
  return process.env[name]?.trim() || '';
}

export function getForumSyncConfig(): ForumSyncConfig | undefined {
  const config: ForumSyncConfig = {
    forumChannelId: env('MEDIA_REQUESTS_FORUM_ID'),
    webhookId: env('MEDIA_REQUESTS_WEBHOOK_ID'),
    movieTagId: env('MEDIA_TAG_MOVIE'),
    seriesTagId: env('MEDIA_TAG_SERIES'),
    requestedTagId: env('MEDIA_TAG_REQUESTED'),
    processingTagId: env('MEDIA_TAG_PROCESSING'),
    availableTagId: env('MEDIA_TAG_AVAILABLE'),
    failedTagId: env('MEDIA_TAG_FAILED'),
    deniedTagId: env('MEDIA_TAG_DENIED'),
  };

  // Forum synchronization is opt-in and remains disabled unless every
  // required identifier is explicitly configured.
  return Object.values(config).every(Boolean) ? config : undefined;
}

export function normalizeForumRequestStatus(value: string): ForumRequestStatus | undefined {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');

  if (['requested', 'pending', 'pending approval', 'new request'].includes(normalized)) {
    return 'requested';
  }
  if (['processing', 'approved', 'in progress', 'processing request'].includes(normalized)) {
    return 'processing';
  }
  if (['available', 'request available'].includes(normalized)) return 'available';
  if (['failed', 'error'].includes(normalized)) return 'failed';
  if (['denied', 'declined', 'rejected'].includes(normalized)) return 'denied';
  return undefined;
}

export function statusFromForumMessage(message: Message): ForumRequestStatus | undefined {
  // Only the structured status field emitted by the configured integration is
  // considered. Free-form Discord message text is never treated as an action.
  for (const embed of message.embeds) {
    const field = embed.fields.find(item => item.name.trim().toLowerCase() === 'status');
    if (!field) continue;
    const status = normalizeForumRequestStatus(field.value);
    if (status) return status;
  }
  return undefined;
}

function statusTag(config: ForumSyncConfig, status: ForumRequestStatus): string {
  switch (status) {
    case 'requested': return config.requestedTagId;
    case 'processing': return config.processingTagId;
    case 'available': return config.availableTagId;
    case 'failed': return config.failedTagId;
    case 'denied': return config.deniedTagId;
  }
}

function configuredStatusTags(config: ForumSyncConfig): readonly string[] {
  return [
    config.requestedTagId,
    config.processingTagId,
    config.availableTagId,
    config.failedTagId,
    config.deniedTagId,
  ];
}

export function currentForumStatus(
  currentTags: readonly string[],
  config: ForumSyncConfig,
): ForumRequestStatus | undefined {
  const matches: ForumRequestStatus[] = [];
  if (currentTags.includes(config.requestedTagId)) matches.push('requested');
  if (currentTags.includes(config.processingTagId)) matches.push('processing');
  if (currentTags.includes(config.availableTagId)) matches.push('available');
  if (currentTags.includes(config.failedTagId)) matches.push('failed');
  if (currentTags.includes(config.deniedTagId)) matches.push('denied');
  return matches.length === 1 ? matches[0] : undefined;
}

export function hasExactlyOneMediaTag(
  currentTags: readonly string[],
  config: ForumSyncConfig,
): boolean {
  return Number(currentTags.includes(config.movieTagId))
    + Number(currentTags.includes(config.seriesTagId)) === 1;
}

export function isTerminalForumRequestStatus(status: ForumRequestStatus): boolean {
  return status === 'available' || status === 'failed' || status === 'denied';
}

export function isAllowedForumStatusTransition(
  current: ForumRequestStatus,
  next: ForumRequestStatus,
): boolean {
  if (current === next) return true;
  if (isTerminalForumRequestStatus(current)) return false;

  if (current === 'requested') {
    return ['processing', 'available', 'failed', 'denied'].includes(next);
  }

  return current === 'processing' && ['available', 'failed', 'denied'].includes(next);
}

export function desiredForumTags(
  currentTags: readonly string[],
  status: ForumRequestStatus,
  config: ForumSyncConfig,
): string[] {
  const mediaTag = currentTags.includes(config.seriesTagId)
    ? config.seriesTagId
    : config.movieTagId;
  return [mediaTag, statusTag(config, status)];
}

export function isManagedForumThread(
  currentTags: readonly string[],
  config: ForumSyncConfig,
): boolean {
  if (!hasExactlyOneMediaTag(currentTags, config)) return false;

  const statusTags = configuredStatusTags(config)
    .filter(tag => currentTags.includes(tag));
  return statusTags.length === 1;
}

async function closeTerminalThread(
  thread: ThreadChannel,
  status: ForumRequestStatus,
): Promise<void> {
  if (!isTerminalForumRequestStatus(status)) return;

  // Lock first so a completed request cannot receive new user replies during
  // the small window before Discord removes it from the active Forum view.
  if (!thread.locked) {
    await thread.setLocked(true, `Media request completed: ${status}`);
  }
  if (!thread.archived) {
    await thread.setArchived(true, `Media request completed: ${status}`);
  }
}

async function syncThread(
  thread: ThreadChannel,
  status: ForumRequestStatus,
  config: ForumSyncConfig,
): Promise<void> {
  if (thread.archived || thread.locked) return;
  if (!isManagedForumThread(thread.appliedTags, config)) return;

  const current = currentForumStatus(thread.appliedTags, config);
  if (!current || !isAllowedForumStatusTransition(current, status)) return;

  const tags = desiredForumTags(thread.appliedTags, status, config);
  await thread.setAppliedTags(tags, `Media request status: ${status}`);
  await closeTerminalThread(thread, status);
}

export async function handleRequestForumMessage(message: Message): Promise<boolean> {
  const config = getForumSyncConfig();
  if (!config) return false;

  // The Forum automation is intentionally narrow: only the configured webhook
  // in the configured Forum can drive state, and only already-managed threads
  // with an unambiguous media/status tag set are eligible.
  if (message.webhookId !== config.webhookId) return false;
  if (!message.channel.isThread()) return false;
  if (message.channel.parentId !== config.forumChannelId) return false;
  if (message.channel.archived || message.channel.locked) return false;
  if (!isManagedForumThread(message.channel.appliedTags, config)) return false;

  const status = statusFromForumMessage(message);
  if (!status) return false;

  const current = currentForumStatus(message.channel.appliedTags, config);
  if (!current || !isAllowedForumStatusTransition(current, status)) return false;

  await syncThread(message.channel, status, config);
  return true;
}
