export interface BuildInfo {
  version: string;
  channel: string;
  commit: string;
}

function normalizeCommit(
  value: string | undefined,
): string {
  const commit =
    value?.trim();

  if (!commit) {
    return 'local';
  }

  return commit.slice(
    0,
    8,
  );
}

export const buildInfo: BuildInfo = {
  version:
    process.env.MEDIAOPS_VERSION?.trim() ||
    'development',

  channel:
    process.env.MEDIAOPS_BUILD_CHANNEL?.trim() ||
    'local',

  commit:
    normalizeCommit(
      process.env.MEDIAOPS_BUILD_SHA,
    ),
};
