function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
    case 'yes':
    case 'on':
      return true;
    case 'false':
    case '0':
    case 'no':
    case 'off':
      return false;
    default:
      throw new Error(`Invalid boolean value: ${value}`);
  }
}

export function getOmbiAutoApprove(): boolean {
  return parseBoolean(
    process.env.OMBI_AUTO_APPROVE,
    false,
  );
}

export const ombiConfig = {
  get autoApprove(): boolean {
    return getOmbiAutoApprove();
  },
};
