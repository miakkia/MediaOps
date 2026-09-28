# MediaOps Discord Router

The **MediaOps Discord Router** is the optional companion service that routes Ombi and Seerr provider webhooks into managed Discord Forum threads. Historical addon, image, container and appdata identifiers remain unchanged for upgrade compatibility.

## Endpoints

```text
POST /ombi   -> Ombi adapter -> Discord Forum lifecycle
POST /seerr  -> Seerr adapter -> Discord Forum lifecycle
GET  /health -> private monitoring
```

The router maintains request/thread correlation in `/data/media-threads.json`, advances lifecycle tags, ignores duplicate/backward events and can recover from deleted Discord threads.

## Security baseline

The packaged deployment is designed to remain private and least-privileged: unprivileged UID/GID `1000:1000`, read-only root filesystem, writable `/data` only, `cap-drop=ALL`, `no-new-privileges`, memory/PID limits, provider request-size limiting and optional shared-secret authentication.

**Do not expose port 8080 directly to the Internet.** Authentication is defense-in-depth and does not replace Docker/LAN isolation.

Provider webhook authentication uses the header `X-MediaOps-Webhook-Token` by default. The secret is compared in constant time and is never expected in a URL/query string.

```env
ROUTER_AUTH_HEADER=X-MediaOps-Webhook-Token
ROUTER_MAX_BODY_BYTES=262144
SEERR_WEBHOOK_AUTH=off
SEERR_WEBHOOK_TOKEN=
OMBI_WEBHOOK_AUTH=off
OMBI_WEBHOOK_TOKEN=
```

Each provider supports three migration modes: `off` preserves existing behavior, `optional` validates a supplied token while allowing requests without one, and `required` fails closed unless the configured token is present.

### Seerr recommended migration

1. Generate a long random secret locally.
2. Set `SEERR_WEBHOOK_TOKEN` to that secret in the router container.
3. Keep `SEERR_WEBHOOK_AUTH=optional` during the migration test.
4. In Seerr's webhook notification configuration, add custom header `X-MediaOps-Webhook-Token` with the same secret.
5. Run Seerr's webhook test and confirm the Discord Forum test post is created.
6. Set `SEERR_WEBHOOK_AUTH=required`, restart the router and test again.
7. Keep the secret masked and out of Git, screenshots and logs.

### Ombi recommended migration

Keep Ombi and the router on the same private user-defined Docker network. Do **not** add a token as a query parameter to the Ombi webhook URL because URLs may be written to access logs. Leave `OMBI_WEBHOOK_AUTH=off` unless Ombi or a deliberately configured trusted ingress can add the authentication header. If such an ingress is used, migrate through `optional` and then `required` exactly as with Seerr.

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

The Discord webhook URL, Discord bot token and provider webhook tokens are secrets. Never commit a populated `.env` file.

## Networking

When Ombi or Seerr reaches the router by Docker hostname, the provider and router **must share at least one user-defined Docker network**. Docker DNS resolves container/service names only on networks shared by both containers.

For a dedicated network:

```bash
docker network create mediaops-backend
```

If the provider already uses a private application network such as `arr-net`, attach the router to that existing network instead of creating unnecessary exposure. The router may remain attached to its existing private network as well.

Example Compose attachment to an existing external network:

```yaml
services:
  ombi-discord-router:
    networks:
      - arr-net

networks:
  arr-net:
    external: true
```

Once both containers share the network, use the router service/container hostname directly:

```text
Ombi:  http://ombi-discord-router:8080/ombi
Seerr: http://ombi-discord-router:8080/seerr
```

If they do not share a Docker network, hostname-based webhook delivery can fail with a DNS error such as `getaddrinfo ENOTFOUND ombi-discord-router`.

When all webhook senders reach the router only through shared Docker networks, **do not publish port 8080 to the host/LAN unless another trusted service actually requires it**. Docker-internal traffic does not require a `ports:` mapping. This keeps the router reachable by the intended containers without unnecessarily increasing the network attack surface.

If the provider is on another trusted host, publish/bind the router only as required, use a private LAN address, and firewall access so only the provider or trusted management network can reach it. Never expose port 8080 directly to the Internet.

## Persistent data

The router stores only its small request/thread index under `/data`. The mounted host directory must be writable by UID/GID `1000:1000`. Do not fix permissions by switching the container to root, privileged mode, or world-writable `777` permissions.

## Published image

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
ghcr.io/miakkia/mediaops-ombi-discord-router:sha-<commit>
```

`latest` follows `main`; hardened/development branches publish `dev`; release tags publish semantic-version tags.

## Provider behavior

Ombi may emit `RequestApproved` and `NewRequest` in different orders with auto-approval. `RequestDeleted` clears active correlation while preserving Discord history. Seerr payloads are normalized into the same lifecycle while keeping request identity separate from media/TMDB identity. Provider test notifications create diagnostic Forum posts when `MEDIA_TAG_TEST` is configured.

The router reports provider lifecycle events; it does not independently prove media exists on the media server. MediaOps can separately verify library availability for its own final notifications.

## Ombi missed-webhook reconciliation

Ombi deployments can optionally enable a read-only reconciliation loop that periodically reads `GET /api/v1/Request/movie` and `GET /api/v1/Request/tv`. Webhooks remain the real-time path; reconciliation is only a recovery path for requests that were created directly in Ombi or whose webhook was missed.

```env
OMBI_RECONCILE_ENABLED=true
OMBI_RECONCILE_URL=http://ombi:3579
OMBI_RECONCILE_API_KEY=
OMBI_RECONCILE_INTERVAL_SECONDS=900
OMBI_RECONCILE_LOOKBACK_HOURS=168
```

The feature is disabled by default. The API key is sent only in Ombi's `ApiKey` request header and is never placed in a URL or intentionally logged. Keep the Ombi URL on a private Docker/LAN network.

When reconciliation is enabled, configure `DISCORD_BOT_TOKEN` in the **Router container itself**. Environment variables from the main MediaOps container are not shared automatically. The Router uses this token to verify whether an indexed Forum thread still exists and to manage its tags. Keep it masked and grant only the Discord permissions required for the configured Forum.

When an indexed thread ID is present, reconciliation asks Discord whether that channel still exists. A confirmed Discord `Unknown Channel` response allows the Router to remove the stale correlation and recreate the Forum thread. Authentication failures, rate limits, network errors and other ambiguous responses fail closed and do **not** trigger recreation.

If Ombi's request-list response has no usable poster, reconciliation can query Ombi's movie/TV information endpoint using the existing Ombi API key. Artwork/overview discovered this way can refresh the existing webhook-owned Forum starter message in place. The poster URL is then persisted in the Router index so unchanged metadata is not rewritten every reconciliation cycle.

Duplicate prevention is fail-safe inside the packaged Router: webhook handling and reconciliation share one serialized lifecycle lock, the persistent request/thread index is checked before creation, and the packaged image intentionally runs one Gunicorn worker. A webhook and reconciliation pass therefore cannot concurrently create two Forum threads for the same tracked request.

Only requests with a parseable `requestedDate` inside the configured lookback window are considered. Unknown/legacy request shapes are skipped rather than risking an unbounded historical import. TV reconciliation treats Ombi child requests as the request identity while retaining the parent show's title/provider identity.

For broader boundaries and deployment guidance, see `docs/REQUEST_FORUM.md`, `docs/UNRAID.md`, and `docs/SECURITY_MODEL.md`.
