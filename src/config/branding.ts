export interface MediaOpsBranding {
  botName: string;
  serverName: string;
}

export const DEFAULT_MEDIAOPS_BOT_NAME = 'MediaOps Bot';
export const DEFAULT_MEDIAOPS_SERVER_NAME = 'My Media Server';

export function getMediaOpsBranding(env: NodeJS.ProcessEnv = process.env): MediaOpsBranding {
  return {
    botName: env.MEDIAOPS_BOT_NAME?.trim() || DEFAULT_MEDIAOPS_BOT_NAME,
    serverName: env.MEDIAOPS_SERVER_NAME?.trim() || DEFAULT_MEDIAOPS_SERVER_NAME,
  };
}
