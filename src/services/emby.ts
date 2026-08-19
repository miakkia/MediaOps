import 'dotenv/config';

const embyUrl = process.env.EMBY_URL;
const embyApiKey = process.env.EMBY_API_KEY;

if (!embyUrl || !embyApiKey) {
  throw new Error('EMBY_URL and EMBY_API_KEY are required.');
}

const config = {
  url: embyUrl,
  apiKey: embyApiKey,
};

export async function getEmbySystemInfo(): Promise<unknown> {
  const response = await fetch(`${config.url}/System/Info`, {
    headers: {
      'X-Emby-Token': config.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Emby API request failed with status ${response.status}`,
    );
  }

  return response.json();
}