# Docker Deployment

MediaOps is distributed as a container image through GitHub Container Registry (GHCR). The container runs the compiled Node.js application and does not require the MediaOps source repository to be copied to the host.

## Image channels

Stable/default image after the Docker branch is merged:

```text
ghcr.io/miakkia/mediaops:latest
```

Development image while `feat/docker-media-provider` remains active:

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

The production image uses a multi-stage Node.js build. TypeScript is compiled during the build stage; the runtime container starts the compiled application with `node dist/index.js`. Development-only tooling such as `tsx` and TypeScript is not required at runtime.

The runtime process uses a dedicated non-root `mediaops` user.

## Required configuration

| Variable | Required | Description |
| --- | --- | --- |
| `MEDIA_PROVIDER` | Yes | Media provider selector. Current supported value: `emby`. |
| `DISCORD_TOKEN` | Yes | Discord bot token. Treat as a secret. |
| `DISCORD_CLIENT_ID` | Yes | Discord application/client ID. |
| `DISCORD_GUILD_ID` | Yes for the current command deployment workflow | Discord guild/server ID. |
| `EMBY_URL` | Yes | Base URL MediaOps can use to reach Emby. |
| `EMBY_API_KEY` | Yes | Emby API key. Treat as a secret. |
| `WATCHPARTY_URL` | Yes for current Watch Party features | Base URL of the configured Watch Party application. |
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
  -e MEDIA_PROVIDER=emby \
  -e DISCORD_TOKEN='REPLACE_ME' \
  -e DISCORD_CLIENT_ID='REPLACE_ME' \
  -e DISCORD_GUILD_ID='REPLACE_ME' \
  -e EMBY_URL='http://192.168.1.100:8096' \
  -e EMBY_API_KEY='REPLACE_ME' \
  -e WATCHPARTY_URL='https://watch.example.com' \
  -e MEDIAOPS_DATA_DIR='/data' \
  -v /path/to/mediaops-data:/data:rw \
  ghcr.io/miakkia/mediaops:latest
```

No inbound application port is currently required.

## Updating

```bash
docker pull ghcr.io/miakkia/mediaops:latest
```

Then recreate/restart the container using the same persistent `/data` mapping and environment configuration. Runtime state survives image replacement because it lives outside the image.

## Security notes

- Do not run MediaOps in privileged mode.
- Do not mount the Docker socket.
- Do not mount media-library shares unless a future documented feature explicitly requires them.
- Keep `DISCORD_TOKEN` and `EMBY_API_KEY` out of logs, screenshots and support posts.
- If either secret is exposed, rotate it immediately.
- Prefer bridge networking unless a future provider integration documents another requirement.

See `SECURITY.md` and `docs/SECURITY_MODEL.md` for the broader security model.
