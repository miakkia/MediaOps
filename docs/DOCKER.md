# Docker Deployment

MediaOps is distributed as a container image through GitHub Container Registry (GHCR). The container runs the compiled Node.js application and does not require the MediaOps source repository to be copied to the host.

## Image channels

Stable/default image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development/hardening branches:

```text
ghcr.io/miakkia/mediaops:dev
```

Tagged releases such as `v1.0.0` publish matching semantic-version tags in GHCR in addition to a commit-SHA tag.

## Architecture

```text
Git push / release tag
   -> GitHub Actions
      -> Docker build
         -> GHCR
            -> Docker / Unraid pulls image
               -> MediaOps connects outbound to Discord, Emby and Watch Party
```

The production image uses a multi-stage Node.js build. TypeScript is compiled during the build stage; the runtime container starts the compiled application with `node dist/index.js`. Development-only tooling such as `tsx` and TypeScript is not required at runtime. The compiled command deployment utility is also included in `dist`, so slash commands can be synchronized directly from the running container.

The runtime process uses a dedicated non-root `mediaops` user.

## Required configuration

| Variable | Required | Description |
| --- | --- | --- |
| `MEDIAOPS_BOT_NAME` | Optional | Public-facing MediaOps bot name. Defaults to `MediaOps Bot`. |
| `MEDIAOPS_SERVER_NAME` | Optional | Friendly media-server/community name. Defaults to `My Media Server`. |
| `MEDIA_PROVIDER` | Yes | Media provider selector. Current supported value: `emby`. |
| `DISCORD_TOKEN` | Yes | Discord bot token. Treat as a secret. |
| `DISCORD_CLIENT_ID` | Yes | Discord application/client ID. |
| `DISCORD_GUILD_ID` | Yes for guild command deployment | Discord guild/server ID. |
| `EMBY_URL` | Yes | Base URL MediaOps can use to reach Emby. |
| `EMBY_API_KEY` | Yes | Emby API key. Treat as a secret. |
| `WATCHPARTY_URL` | Yes for current Watch Party features | Base URL of the configured Watch Party application. |
| `MEDIAOPS_LOCALE` | Recommended | Default language for automated messages. Supported values: `en`, `fr`. |
| `MEDIAOPS_DATA_DIR` | Recommended | Runtime data directory. Docker deployments should use `/data`. |

Do not commit real values to Git. `.env.example` contains placeholders only.

## Persistent data

Mount a persistent host directory at `/data` and set:

```text
MEDIAOPS_DATA_DIR=/data
```

MediaOps does **not** require direct mounts of Movies, Series or Downloads. Media-library access is performed through the configured provider API.

## Docker CLI example

```bash
docker run -d \
  --name mediaops \
  --restart unless-stopped \
  --network bridge \
  -e MEDIAOPS_BOT_NAME='MediaOps Bot' \
  -e MEDIAOPS_SERVER_NAME='My Media Server' \
  -e MEDIA_PROVIDER=emby \
  -e DISCORD_TOKEN='REPLACE_ME' \
  -e DISCORD_CLIENT_ID='REPLACE_ME' \
  -e DISCORD_GUILD_ID='REPLACE_ME' \
  -e EMBY_URL='http://192.168.1.100:8096' \
  -e EMBY_API_KEY='REPLACE_ME' \
  -e WATCHPARTY_URL='https://watch.example.com' \
  -e MEDIAOPS_LOCALE='en' \
  -e MEDIAOPS_DATA_DIR='/data' \
  -v /path/to/mediaops-data:/data:rw \
  ghcr.io/miakkia/mediaops:latest
```

No inbound application port is currently required.

## Registering or updating Discord slash commands

MediaOps uses guild-scoped Discord commands. Run command deployment after the initial installation and again whenever an update adds, removes, renames, or changes command permissions/options.

From the running container:

```bash
docker exec mediaops npm run deploy-commands
```

The runtime script executes the already compiled `dist/deploy-commands.js`; it does not require `tsx`, TypeScript, the source repository, or a separate Node.js installation on the host. It reuses `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID` from the container environment.

A successful deployment reports the number and names of registered commands. A Discord `401 Unauthorized` indicates that the configured bot token is invalid or stale and should be corrected/rotated rather than posted in logs or support messages.

Repository developers can alternatively run the TypeScript source directly with:

```bash
npm run deploy-commands:dev
```

## Updating

```bash
docker pull ghcr.io/miakkia/mediaops:latest
```

Then recreate/restart the container using the same persistent `/data` mapping and environment configuration. Runtime state survives image replacement because it lives outside the image.

If the release changes Discord command definitions, run `docker exec mediaops npm run deploy-commands` after the updated container is running.

## Security notes

- Do not run MediaOps in privileged mode.
- Do not mount the Docker socket.
- Do not mount media-library shares unless a future documented feature explicitly requires them.
- Keep `DISCORD_TOKEN` and `EMBY_API_KEY` out of logs, screenshots and support posts.
- If either secret is exposed, rotate it immediately.
- Prefer bridge networking unless a future provider integration documents another requirement.

See `SECURITY.md` and `docs/SECURITY_MODEL.md` for the broader security model.

## Watch Party lifecycle

MediaOps maintains scheduled Watch Party state in persistent storage and refreshes lifecycle state automatically while the bot is running.

Current behavior includes:

- upcoming Watch Party discovery through `/watchparty-upcoming`;
- automatic transition into the ready window before the scheduled time;
- expiration handling for scheduled sessions that never start;
- one persistent reminder approximately 15 minutes before start;
- reminder deduplication across scheduler cycles and application restarts;
- automatic rollback to `auto_cancelled` when the initial Discord announcement cannot be posted.

Automated reminder language is controlled by `MEDIAOPS_LOCALE`. Discord timestamps remain client-rendered so date, time and relative-time formatting follow each Discord user's own locale.
