# Unraid Deployment

MediaOps runs on Unraid from prebuilt GHCR images and stores application-owned runtime data in appdata.

## Images

Stable/default:

```text
ghcr.io/miakkia/mediaops:latest
```

Development:

```text
ghcr.io/miakkia/mediaops:dev
```

Recommended basics:

- Network Type: Bridge
- Privileged: Off
- Docker socket: not mounted
- Movies/Series/Downloads shares: not mounted for current provider API workflows
- MediaOps host ports: none required for current core features
- Persistent data: `/mnt/user/appdata/mediaops` -> `/data`

## Provider selection

The current Unraid template supports:

```text
MEDIA_PROVIDER=emby | jellyfin
REQUEST_PROVIDER=ombi | seerr
```

Only configure credentials for the providers you select.

### Existing Emby + Ombi installations

Existing installations remain supported:

```env
MEDIA_PROVIDER=emby
EMBY_URL=http://YOUR-EMBY-HOST:8096
EMBY_API_KEY=REPLACE_ME

REQUEST_PROVIDER=ombi
OMBI_URL=http://YOUR-OMBI-HOST:3579
OMBI_API_KEY=REPLACE_ME
```

`OMBI_AUTO_APPROVE` is no longer used by current MediaOps. Ombi's own user/role policy controls approval. An older installation that had `OMBI_AUTO_APPROVE=false` can safely remove that variable when updating.

### Jellyfin + Seerr

```env
MEDIA_PROVIDER=jellyfin
JELLYFIN_URL=http://YOUR-JELLYFIN-HOST:8096
JELLYFIN_API_KEY=REPLACE_ME

REQUEST_PROVIDER=seerr
SEERR_URL=http://YOUR-SEERR-HOST:5055
SEERR_API_KEY=REPLACE_ME
```

When Jellyfin/Seerr are selected, Emby/Ombi credentials are not required.

## Discord setup

Each self-hosted MediaOps deployment uses its operator-owned Discord application/bot. Configure:

```text
DISCORD_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
```

Use least-privilege Discord permissions rather than Administrator.

Register guild commands after startup:

```bash
docker exec MediaOps npm run deploy-commands
```

## Persistent data

Main MediaOps state:

| Container path | Recommended Unraid host path |
| --- | --- |
| `/data` | `/mnt/user/appdata/mediaops` |

Set `MEDIAOPS_DATA_DIR=/data`.

## MediaOps Discord Router

The companion router retains its historical image name for compatibility:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

It now accepts both provider webhook routes:

```text
POST /ombi
POST /seerr
```

The router is a messenger/routing addon. It can create a Discord Forum post, persist the provider/media/request-to-thread association, append lifecycle updates to the same thread, and update Forum lifecycle tags.

Recommended router appdata:

```text
/mnt/user/appdata/mediaops-discord-router/data -> /data
```

Keep the mapped directory writable by the configured non-root router UID/GID. Do not use `777`, privileged mode, or root execution as a workaround.

For dynamic Forum tag changes, inject `DISCORD_BOT_TOKEN` at runtime and grant only the Discord permissions required for the target Forum/thread.

Prefer a private user-defined Docker network between Ombi/Seerr and the router. No public router port is required when the request provider can address the router by container name.

## Updating from latest

1. Force Update/pull `ghcr.io/miakkia/mediaops:latest`.
2. Preserve `/data` and your environment variables.
3. Keep your selected provider values.
4. Run `/health` after restart.
5. Test `/movie`, `/tv`, `/latest`, and `/request`.
6. If using the Router, verify one provider webhook lifecycle and confirm same-thread status/tag changes.

Adding Jellyfin/Seerr support does **not** require an existing Emby/Ombi operator to migrate providers.

## Upgrade acceptance checks

For Emby + Ombi:

- `/health` reports Emby and Ombi online;
- `/movie`, `/tv`, `/latest` still return expected library results;
- `/request` creates an Ombi request under Ombi's configured approval policy;
- Watch Party behavior remains operational when configured.

For Jellyfin + Seerr:

- `/health` reports Jellyfin and Seerr online;
- movie/series search and artwork work;
- request search/create works;
- Router `/seerr` events reach the Discord Forum when enabled.

## Security posture

- non-root runtime;
- no privileged mode;
- no Docker socket;
- no direct media-library mounts for current API workflows;
- no unnecessary host ports;
- secrets supplied only at runtime;
- private Docker/LAN provider communication preferred;
- appdata access limited to application-owned state.

See [`SECURITY_MODEL.md`](SECURITY_MODEL.md) and the repository [`SECURITY.md`](../SECURITY.md).
