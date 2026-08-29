export function isMediaOpsDemoMode(): boolean {
  return (
    process.env.MEDIAOPS_DEMO_MODE
      ?.trim()
      .toLowerCase() === 'true'
  );
}
