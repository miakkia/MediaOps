# Ombi Discord Router addon

This optional companion service adapts Ombi request notifications into a Discord Forum workflow that MediaOps can maintain as a searchable request history.

The router is intentionally separate from the main MediaOps bot. It owns the Discord webhook credential, while MediaOps only needs the webhook's non-secret ID plus the Forum/tag IDs used for status synchronization.

## What it does

For supported Ombi movie and TV request notifications, the router:

- creates one Discord Forum post per active media request lifecycle;
- applies one media-type tag and one request-status tag when the post is created;
- stores the Discord thread ID in a small persistent JSON index;
- posts only meaningful forward lifecycle changes into the existing thread;
- ignores duplicate same-state notifications and stale/backward transitions;
- keeps terminal request states terminal within the same Ombi request lifecycle;
- removes active correlation when Ombi reports `RequestDeleted` while leaving Discord history intact;
- recognizes a new Ombi request ID for the same provider item as a new request lifecycle;
- recovers from a deleted/missing Discord Forum thread by removing the stale correlation and recreating the thread from the current event;
- exposes `/health` for container monitoring;
- emits sanitized technical event logs without titles, requester names, provider IDs, request IDs, or webhook credentials;
- avoids logging the Discord webhook URL/token when Discord returns an error.

MediaOps then performs the privileged Discord-side lifecycle management, including status-tag synchronization and closing/locking terminal request posts.

## Published image

GitHub Actions publishes the companion image separately from MediaOps:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
ghcr.io/miakkia/mediaops-ombi-discord-router:sha-<commit>
```

`latest` follows `main`; development branches publish `dev`; repository release tags publish matching semantic-version tags.

## Requirements

- Ombi with webhook notifications enabled;
- one Discord Forum channel;
- a Discord webhook created for that Forum;
- Forum tags for `Movie`, `Series`, `Requested`, `Processing`, `Available`, `Failed`, and `Denied`;
- optional Forum tag for webhook diagnostics, such as `Test`;
- persistent storage for `/data`;
- a user-defined Docker network shared by Ombi and the router.

The visible tag names are administrator choices. Configuration uses Discord IDs.

## Configuration

Copy `.env.example` to `.env` and fill in your own values. Never commit the real `.env` file.

```env
TZ=America/Toronto
MEDIA_REQUESTS_WEBHOOK=
MEDIA_REQUESTS_WEBHOOK_NAME=Media Request Herald
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

`MEDIA_REQUESTS_WEBHOOK` is a secret because the Discord webhook URL contains its credential. Do not paste it into issues, screenshots, logs, examples, or MediaOps configuration.

MediaOps itself should receive only the webhook **ID** through `MEDIA_REQUESTS_WEBHOOK_ID`, not this secret URL.

## Docker network

Use a user-defined Docker network so Ombi can reach the router by container name instead of a changing container IP.

Example:

```bash
docker network create mediaops-backend
```

Connect Ombi to the same network, then configure Ombi's webhook destination as:

```text
http://ombi-discord-router:8080/ombi
```

`compose.example.yaml` expects the network to already exist and defaults to `mediaops-backend`. Set `MEDIAOPS_NETWORK` if you use a different external network name.

## Compose deployment

```bash
cp .env.example .env
# edit .env with your values

docker compose -f compose.example.yaml pull
docker compose -f compose.example.yaml up -d
```

The example Compose file uses the published GHCR image and deliberately keeps least-privilege defaults: non-root execution, read-only root filesystem, dropped Linux capabilities, `no-new-privileges`, PID/memory limits, and a dedicated persistent `/data` mount.

For development or reproducible local testing, the same image can still be built directly from this directory:

```bash
docker build -t local/ombi-discord-router:test .
```

## Unraid

A generic Unraid v2 template is included at:

```text
templates/ombi-discord-router.xml
```

The template points to the published GHCR image, masks the webhook credential, predefines `/data`, includes all required Forum tag variables, and applies the same hardened runtime options used during validation.

Before installing the router template, create an external Docker network such as `mediaops-backend` and attach Ombi to it. Keep the router name `ombi-discord-router` or update the Ombi webhook URL if you choose a different container name.

## Health check

Expected response from `GET /health`:

```json
{
  "status": "ok",
  "version": "1.9",
  "mode": "discord-forum",
  "index": "/data/media-threads.json"
}
```

The packaged service does not publish port `8080` to the host by default. Check `/health` from inside the container or from another container on the shared Docker network.

## Ombi notification behavior

The router accepts `POST /ombi` JSON notifications from Ombi. Movie and TV request lifecycle messages are correlated using provider/request identity and recorded in `/data/media-threads.json`.

A normal lifecycle is represented as one Forum post with meaningful forward updates:

```text
Requested -> Processing -> Available
```

`Failed` and `Denied` are also terminal states supported by MediaOps.

Ombi may emit multiple notifications for one logical state change, and those notifications can arrive in a surprising order. The router therefore treats lifecycle delivery as idempotent:

- a notification that resolves to the same status already stored is ignored;
- a notification that would move the stored request backward is ignored;
- a terminal request cannot be rewritten by later non-terminal events from the same request lifecycle;
- request/provider metadata may still be refreshed silently when a duplicate or stale event contains useful identifiers;
- if the same provider item later arrives with a different Ombi request ID, the router treats it as a new request lifecycle and creates a fresh Forum thread;
- if the stored Discord thread no longer exists and Discord returns `Unknown Channel`, the stale correlation is removed and the current lifecycle is recreated instead of remaining stuck on a dead thread ID.

This prevents sequences such as `RequestApproved -> NewRequest -> RequestApproved` from producing three near-identical Forum messages or regressing a request from Processing back to Requested, while still allowing a previously Available, Failed, Denied, or deleted item to be requested again later.

### Request deletion and re-requesting

`RequestDeleted` does not delete Discord history. Instead, the router removes the active `/data/media-threads.json` correlation for that request. A later request for the same media can therefore create a new Forum thread without being mistaken for a duplicate of the deleted request.

The same lifecycle separation applies when a previous request reached `Available`, `Failed`, or `Denied`: a later Ombi request with a new request ID starts a fresh active lifecycle while the old Discord thread remains historical.

### Ombi administrator requests

Ombi's notification behavior depends on who creates the request. In particular, Ombi does not emit the normal `NewRequest` notification for a request created by an Ombi **Admin** account because the administrator is considered to already know that the request was made. API, Power User, and normal-user requests can emit the normal request notification flow.

This is an Ombi-side behavior, not a router permission decision. The router cannot create a `Requested` Forum post for an event it never receives. A later notification such as `RequestApproved`, `RequestAvailable`, `Failed`, or `Denied` can still create the Forum post if no earlier post exists.

Administrators who require every request to appear in the Forum from its first state should avoid relying on Ombi Admin-origin `NewRequest` notifications as the sole source of truth. A future MediaOps-side request/API synchronization path may cover that case without weakening the router trust boundary.

### Ombi webhook test

When `MEDIA_TAG_TEST` is configured, Ombi's built-in **Send test** action creates a dedicated `Ombi Webhook Test` Forum post carrying only the configured Test tag. It is not written to `media-threads.json` and is not treated as a Movie/Series lifecycle entry.

## Operational logging

The router logs a narrow technical summary for each accepted Ombi event, for example:

```text
OMBI EVENT: notificationType=RequestApproved type=Movie result=created
OMBI EVENT: notificationType=NewRequest type=Movie result=ignored reason=duplicate-status
OMBI EVENT: notificationType=RequestDeleted type=Movie result=removed reason=request-deleted
```

These lines are intentionally limited to notification type, media type, result, and a bounded reason. They do not include titles, requester identities, request/provider IDs, overview text, or webhook credentials.

## Security notes

Treat Ombi payloads and Discord responses as untrusted integration data. Keep the service private to the Docker/LAN network and do not expose `/ombi` publicly unless you add an appropriate authenticated reverse-proxy boundary.

The router never needs the MediaOps Discord bot token. MediaOps never needs the router's webhook token. Keeping those credentials separate reduces the impact of either component being misconfigured or compromised.

The router intentionally sanitizes Discord delivery errors so the webhook URL/token is not included in application logs.

For the MediaOps-side trust boundary and required Discord permissions, see [`../../docs/REQUEST_FORUM.md`](../../docs/REQUEST_FORUM.md) and [`../../docs/SECURITY_MODEL.md`](../../docs/SECURITY_MODEL.md).

## Runtime files

The only persistent application-owned state is the request/thread index:

```text
/data/media-threads.json
```

Do not commit runtime state or a populated `.env` file.
