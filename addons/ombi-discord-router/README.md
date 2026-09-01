# MediaOps Discord Router

The **MediaOps Discord Router** is the optional companion service that routes request-provider webhooks into managed Discord Forum threads. It currently supports **Ombi** and **Seerr** through provider-specific adapters.

The component originally shipped as **Ombi Discord Router**. Existing installations do not need to rename or recreate anything: the historical addon path, GHCR image, Compose service/container name, Unraid template filename, and default appdata path remain intentionally unchanged for upgrade compatibility.

## What it does

```text
POST /ombi   -> Ombi adapter
POST /seerr  -> Seerr adapter
                 |
                 v
        normalized lifecycle
                 |
                 v
          Discord Forum thread
```

The router can create one Forum thread per request lifecycle, preserve the thread association in `/data/media-threads.json`, append forward lifecycle updates, maintain Movie/Series and Requested/Processing/Available/Failed/Denied tags, ignore duplicate or backward events, recover from missing Discord threads, and expose `/health` for private monitoring.

The router is a messenger. It reports request-provider lifecycle events; it does not independently prove that media is present on the media server. MediaOps can separately verify actual library availability before sending its own final availability notification.

## Compatibility identifiers

These historical identifiers remain supported and intentionally unchanged:

```text
Addon path:       addons/ombi-discord-router/
Image:            ghcr.io/miakkia/mediaops-ombi-discord-router
Compose service:  ombi-discord-router
Container name:   ombi-discord-router
Unraid template:  templates/ombi-discord-router.xml
Default appdata:  /mnt/user/appdata/ombi-discord-router/data
```

New documentation and UI text should call the component **MediaOps Discord Router**. The historical identifiers are compatibility details, not a limitation to Ombi.

## Published image

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
ghcr.io/miakkia/mediaops-ombi-discord-router:sha-<commit>
```

`latest` follows `main`; development branches publish `dev`; release tags publish matching semantic-version tags.

## Requirements

- Ombi and/or Seerr with webhook notifications enabled;
- one Discord Forum channel and Forum webhook;
- Forum tags for Movie, Series, Requested, Processing, Available, Failed, and Denied;
- optional Test tag for provider webhook diagnostics;
- persistent `/data` storage writable by UID/GID `1000:1000` with the hardened deployment examples;
- private network reachability from the request provider to the router.

Dynamic Forum tag updates can use the runtime `DISCORD_BOT_TOKEN` setting. Keep it masked and grant only the Discord permissions required for the target Forum.

## Core configuration

```env
TZ=America/Toronto
MEDIA_REQUESTS_WEBHOOK=
MEDIA_REQUESTS_WEBHOOK_NAME=Media Request Herald
DISCORD_BOT_TOKEN=
MEDIA_TAG_REQUESTED=
MEDIA_TAG_PROCESSING=
MEDIA_TAG_AVAILABLE=
MEDIA_TAG_FAILED=
MEDIA_TAG_DENIED=
MEDIA_TAG_MOVIE=
MEDIA_TAG_SERIES=
MEDIA_TAG_TEST=
ROUTER_DATA_DIR=/data
ROUTER_DATA_HOST_DIR=./data
MEDIAOPS_NETWORK=mediaops-backend
```

Never commit a populated `.env` file or publish Discord credentials in logs, screenshots, or support posts.

## Persistent data and permissions

The router stores only its request/thread index under `/data`. Keep `ROUTER_DATA_DIR=/data`; host paths belong in the volume mapping.

A compatible host mapping is:

```yaml
volumes:
  - /path/on/host/ombi-discord-router/data:/data
```

The historical directory name does not need to be changed.

With the hardened UID/GID `1000:1000` runtime, the mounted directory must be writable by that identity. Do not solve permission problems with `777`, root execution, or privileged mode.

## Networking

Prefer a user-defined Docker network when the request provider and router share a host:

```bash
docker network create mediaops-backend
```

With the compatibility container name, webhook destinations are:

```text
Ombi:  http://ombi-discord-router:8080/ombi
Seerr: http://ombi-discord-router:8080/seerr
```

If the provider is on another trusted LAN host, use the router's private LAN address instead. Do not port-forward router port 8080 from the Internet; `/ombi`, `/seerr`, and `/health` are intended for a private Docker/LAN trust boundary.

## Compose deployment

```bash
cp .env.example .env
# edit .env with your values

docker compose -f compose.example.yaml pull
docker compose -f compose.example.yaml up -d
```

The example keeps non-root execution, a read-only root filesystem, dropped Linux capabilities, `no-new-privileges`, PID/memory limits, and a dedicated persistent `/data` mount.

## Unraid

The generic Unraid v2 template remains at:

```text
templates/ombi-discord-router.xml
```

The template is displayed as **MediaOps Discord Router** while retaining the historical GHCR image and `/mnt/user/appdata/ombi-discord-router/data` default so existing installations do not need migration.

Existing users may keep a container visibly named **Ombi Discord Router** or `ombi-discord-router`. That name does not restrict the router to Ombi. If a container is manually renamed, any provider webhook URL that addresses it by Docker DNS name must be updated accordingly.

## Provider behavior

### Ombi

Ombi may deliver `RequestApproved` and `NewRequest` in different orders, especially with auto-approval. The router does not fabricate a missing earlier state. `RequestDeleted` clears active correlation while keeping Discord history so a later re-request can start a fresh lifecycle.

Ombi's built-in webhook test creates an **Ombi Webhook Test** post when the Test tag is configured.

### Seerr

Seerr payloads are normalized through `/seerr` into the same shared Forum lifecycle. Seerr's request identity is kept separate from the media/TMDB identity so lifecycle updates correlate correctly.

A Seerr webhook test creates a **Seerr Webhook Test** post when the Test tag is configured.

Provider-native Discord notifications remain independent from MediaOps. If MediaOps is being used as the authority for media-server-verified availability, overlapping provider-native availability notifications can be disabled to avoid contradictory announcements.

## Security notes

Keep the router private, non-root, read-only, capability-dropped, and without privileged mode. Treat provider payloads and Discord responses as untrusted integration data. Do not broaden network exposure merely to simplify provider routing.

For the complete Forum workflow and security boundaries, see [`../../docs/REQUEST_FORUM.md`](../../docs/REQUEST_FORUM.md), [`../../docs/UNRAID.md`](../../docs/UNRAID.md), and [`../../docs/SECURITY_MODEL.md`](../../docs/SECURITY_MODEL.md).
