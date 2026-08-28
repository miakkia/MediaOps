# Docker Deployment

MediaOps is distributed through GitHub Container Registry (GHCR). The container runs compiled Node.js and does not require the source repository on the deployment host.

## V1 deployment boundary

MediaOps v1 is **self-hosted and single-tenant**. Before deploying the container, create a Discord application/bot owned by the operator who owns this MediaOps instance.

Do not use the public MediaOps Community demo bot for an unrelated deployment, and do not reuse one v1 MediaOps instance as a universal bot across unrelated guilds with different Emby/Ombi/Watch Party backends.

Follow [`DISCORD_BOT_SETUP.md`](DISCORD_BOT_SETUP.md) first.

## Image channels

Stable/default image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development image:

```text
ghcr.io/miakkia/mediaops:dev
```

Tagged releases publish semantic-version and commit-SHA tags.

## Runtime architecture

```text
Your Discord guild
      |
Your Discord bot
      |
MediaOps container
  |       |       |
Emby     Ombi   Watch Party
```

The production image uses a multi-stage Node.js build. TypeScript is compiled during build; runtime starts with `node dist/index.js`. The compiled command deployment utility is also included in `dist`.

The runtime process uses a dedicated non-root `mediaops` user.

## Required configuration

| Variable | Required | Description |
| --- | --- | --- |
| `MEDIAOPS_BOT_NAME` | Optional | Public-facing MediaOps name; defaults to `MediaOps Bot` |
| `MEDIAOPS_SERVER_NAME` | Optional | Friendly media/community name |
| `MEDIA_PROVIDER` | Yes | Current supported value: `emby` |
| `DISCORD_TOKEN` | Yes | Token for **your own** Discord bot; secret |
| `DISCORD_CLIENT_ID` | Yes | Application ID for **your own** Discord application |
| `DISCORD_GUILD_ID` | Yes | Discord server ID for this deployment's guild-scoped commands |
| `EMBY_URL` | Yes | Emby URL reachable from the container |
| `EMBY_API_KEY` | Yes | Emby API key; secret |
| `REQUEST_PROVIDER` | Optional | `none` or `ombi` |
| `OMBI_URL` | Required for Ombi | Ombi URL reachable from MediaOps |
| `OMBI_API_KEY` | Required for Ombi | Ombi API key; secret |
| `WATCHPARTY_URL` | Required for Watch Party | Public/base Watch Party URL |
| `MEDIAOPS_LOCALE` | Recommended | `en` or `fr` |
| `MEDIAOPS_TIMEZONE` | Recommended | IANA timezone, e.g. `America/Toronto` |
| `MEDIAOPS_DATA_DIR` | Recommended | `/data` in Docker |

Provider configuration is global to the v1 container. It is not isolated per Discord guild.

## Persistent data

Mount persistent storage at `/data` and set:

```text
MEDIAOPS_DATA_DIR=/data
```

MediaOps does not require direct Movies/Series/Downloads mounts.

## Compose / Portainer example

```yaml
services:
  mediaops:
    image: ghcr.io/miakkia/mediaops:latest
    container_name: MediaOps
    restart: unless-stopped
    environment:
      MEDIAOPS_BOT_NAME: "MediaOps Bot"
      MEDIAOPS_SERVER_NAME: "My Media Server"
      MEDIA_PROVIDER: "emby"
      DISCORD_TOKEN: "REPLACE_ME"
      DISCORD_CLIENT_ID: "REPLACE_ME"
      DISCORD_GUILD_ID: "REPLACE_ME"
      EMBY_URL: "http://YOUR-EMBY-HOST:8096"
      EMBY_API_KEY: "REPLACE_ME"
      REQUEST_PROVIDER: "ombi"
      OMBI_URL: "http://YOUR-OMBI-HOST:3579"
      OMBI_API_KEY: "REPLACE_ME"
      OMBI_AUTO_APPROVE: "false"
      WATCHPARTY_URL: "https://watch.example.com"
      MEDIAOPS_LOCALE: "en"
      MEDIAOPS_TIMEZONE: "America/Toronto"
      MEDIAOPS_DATA_DIR: "/data"
    volumes:
      - ./mediaops-data:/data
```

Do not publish real secrets in Compose files that are committed to source control.

No inbound MediaOps application port is currently required.

## Register Discord slash commands

After the container connects successfully:

```bash
docker exec MediaOps npm run deploy-commands
```

The runtime executes compiled `dist/deploy-commands.js`. No `tsx`, TypeScript, Git, source checkout, or host Node.js installation is required.

A successful v1 registration reports all 15 guild commands.

Run it again after releases that change command definitions or permissions.

## Recommended Discord restriction

After installing your bot into the intended guild, operators who do not want the exact bot identity installed elsewhere should follow `DISCORD_BOT_SETUP.md` and disable public installation where appropriate (`Public Bot` off, Install Link none, User Install off, Guild Install retained).

This is especially important in v1 because backend credentials are global to the container.

## Updating

```bash
docker pull ghcr.io/miakkia/mediaops:latest
```

Recreate/restart using the same `/data` mapping and environment values. Runtime state survives image replacement.

If commands changed:

```bash
docker exec MediaOps npm run deploy-commands
```

## Optional Ombi Discord Router

The companion router is independently deployable:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

It uses its own Discord Forum webhook/tag configuration and its own persistent `/data/media-threads.json`. See [`REQUEST_FORUM.md`](REQUEST_FORUM.md) and [`../addons/ombi-discord-router/README.md`](../addons/ombi-discord-router/README.md).

The router is intentionally independent from the main MediaOps container. It may run on the same Docker host as Ombi or on another trusted LAN Docker/NAS host.

For same-host deployments, prefer a private shared Docker network and `http://ombi-discord-router:8080/ombi` without publishing port 8080.

For separate trusted LAN hosts, publish router port 8080 only as required on the LAN and configure Ombi with `http://ROUTER_LAN_IP:8080/ombi`. Confirm `GET /health` works from the Ombi host before troubleshooting Discord delivery.

The hardened router example runs as UID/GID `1000:1000`. Its host directory bound to `/data` must therefore be writable by `1000:1000`. A NAS/Portainer bind such as `/volume1/docker/ombi-discord-router/data:/data` is valid only when that host `data` directory has suitable ownership/permissions. Keep `ROUTER_DATA_DIR=/data`; do not put the NAS host path in that environment variable.

If Ombi reaches `/ombi` but the router returns HTTP 502 and logs `Permission denied: '/data/media-threads.tmp'`, network delivery is already working. Fix the bind-mount ownership/permissions instead of weakening the container. On Portainer/NAS systems without SSH, a temporary root utility container can mount the directory, apply ownership `1000:1000` and mode `750`, and then be removed. Avoid `777`, privileged router execution, or exposing `/ombi` to the Internet.

## Security notes

- Use an operator-owned Discord bot/token for each v1 deployment.
- Do not expose a demo/operator bot as a universal bot for unrelated guilds.
- Do not run MediaOps in privileged mode.
- Do not mount the Docker socket.
- Do not mount media-library shares unless a documented future feature requires them.
- Keep Discord tokens, provider API keys, webhook credentials, and passwords out of logs/screenshots/support posts.
- Rotate any exposed credential immediately.
- Prefer bridge networking unless a documented integration requires another mode.

See `SECURITY.md` and [`SECURITY_MODEL.md`](SECURITY_MODEL.md).

## Watch Party lifecycle

MediaOps keeps scheduled Watch Party state in persistent storage and refreshes lifecycle state automatically. Current behavior includes upcoming discovery, ready-window transition, one T-15 reminder, automatic room creation, organizer cancellation after activation, tracked message cleanup, runtime-aware expiry, and a 4.5-hour fallback when runtime cannot be read.
