import type { Message, ThreadChannel } from 'discord.js';

export type ForumRequestStatus = 'requested' | 'processing' | 'available' | 'failed' | 'denied';

interface ForumSyncConfig {
  forumChannelId: string;
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
    movieTagId: env('MEDIA_TAG_MOVIE'),
    seriesTagId: env('MEDIA_TAG_SERIES'),
    requestedTagId: env('MEDIA_TAG_REQUESTED'),
    processingTagId: env('MEDIA_TAG_PROCESSING'),
    availableTagId: env('MEDIA_TAG_AVAILABLE'),
    failedTagId: env('MEDIA_TAG_FAILED'),
    deniedTagId: env('MEDIA_TAG_DENIED'),
  };

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

export function isTerminalForumRequestStatus(status: ForumRequestStatus): boolean {
  return status === 'available' || status === 'failed' || status === 'denied';
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

async function syncThread(
  thread: ThreadChannel,
  status: ForumRequestStatus,
  config: ForumSyncConfig,
): Promise<void> {
  const tags = desiredForumTags(thread.appliedTags, status, config);
  await thread.setAppliedTags(tags, `Media request status: ${status}`);

  if (isTerminalForumRequestStatus(status) && !thread.archived) {
    await thread.setArchived(true, `Media request completed: ${status}`);
  }
}

export async function handleRequestForumMessage(message: Message): Promise<boolean> {
  const config = getForumSyncConfig();
  if (!config) return false;

  if (!message.webhookId || !message.channel.isThread()) return false;
  if (message.channel.parentId !== config.forumChannelId) return false;

  const status = statusFromForumMessage(message);
  if (!status) return false;

  await syncThread(message.channel, status, config);
  return true;
}
