const DEFAULT_TIMEZONE = 'America/Toronto';

export function getMediaOpsTimezone(): string {
  const configured =
    process.env.MEDIAOPS_TIMEZONE?.trim() ||
    DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: configured,
      },
    ).format(new Date());

    return configured;
  } catch {
    console.warn(
      `Invalid MEDIAOPS_TIMEZONE "${configured}". Falling back to ${DEFAULT_TIMEZONE}.`,
    );

    return DEFAULT_TIMEZONE;
  }
}

function getOffsetMs(
  date: Date,
  timeZone: string,
): number {
  const formatter =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      },
    );

  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter(part => part.type !== 'literal')
        .map(part => [
          part.type,
          part.value,
        ]),
    );

  const asUtc =
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

  return asUtc - date.getTime();
}

export function parseWatchPartyDateTime(
  value: string,
): Date {
  const trimmed =
    value.trim();

  if (
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)
  ) {
    return new Date(trimmed);
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      trimmed,
    );

  if (!match) {
    return new Date(Number.NaN);
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = '00',
  ] = match;

  const wallClockUtc =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

  const timeZone =
    getMediaOpsTimezone();

  const firstGuess =
    new Date(wallClockUtc);
  const firstOffset =
    getOffsetMs(
      firstGuess,
      timeZone,
    );

  const instant =
    new Date(
      wallClockUtc -
        firstOffset,
    );
  const refinedOffset =
    getOffsetMs(
      instant,
      timeZone,
    );

  return new Date(
    wallClockUtc -
      refinedOffset,
  );
}
