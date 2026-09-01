# MediaOps

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a selected media server, request provider, and optional Watch Party service so members can discover media, submit requests, track request state, and organize Watch Parties from Discord.

## Current supported integrations

| Capability | Supported integrations |
| --- | --- |
| Media provider | **Emby**, **Jellyfin** |
| Request provider | **Ombi**, **Seerr** |
| Watch Party | Emby Watch Party by Oratorian |
| Request Forum history | MediaOps Discord Router (Ombi + Seerr) |
| Deployment | Docker/GHCR, Portainer/Compose, Unraid |

Plex and Jellyfin SyncPlay orchestration remain future work.

## Provider model

MediaOps is provider-aware. Select one media provider and one request provider per deployment:

```env
MEDIA_PROVIDER=emby
REQUEST_PROVIDER=ombi
```

or, for example:

```env
MEDIA_PROVIDER=jellyfin
REQUEST_PROVIDER=seerr
```

Only the selected provider is initialized. Credentials for unselected providers are not required.

### Emby

```env
MEDIA_PROVIDER=emby
EMBY_URL=http://emby:8096
EMBY_API_KEY=REPLACE_ME
```

### Jellyfin

```env
MEDIA_PROVIDER=jellyfin
JELLYFIN_URL=http://jellyfin:8096
JELLYFIN_API_KEY=REPLACE_ME
```

The Jellyfin adapter supports system information, movie search, series search, latest additions, random movie selection, exact movie lookup, posters, and Watch Party event artwork retrieval where the shared workflow uses media artwork.

### Ombi

```env
REQUEST_PROVIDER=ombi
OMBI_URL=http://ombi:3579
OMBI_API_KEY=REPLACE_ME
```

MediaOps does **not** force Ombi approval. Ombi's own user/role policy controls auto-approval and approval behavior.

### Seerr

```env
REQUEST_PROVIDER=seerr
SEERR_URL=http://seerr:5055
SEERR_API_KEY=REPLACE_ME
```

MediaOps supports Seerr search, movie requests, series requests, request identifiers/status tracking, and provider-owned approval policy. MediaOps does not call Seerr's elevated approval endpoint to override Seerr policy.

## Discord commands

The same commands work against the selected providers:

- `/movie` — search movies with Rich Media Cards
- `/tv` — search TV/series with Rich Media Cards
- `/latest` — recently added media
- `/request` — search and request through the selected request provider
- `/health` — MediaOps/build/media-provider/request-provider diagnostics
- Watch Party commands — scheduling, RSVP, launch, random movie selection, lifecycle management

Provider selection is a deployment concern; members do not need separate `/emby`, `/jellyfin`, `/ombi`, or `/seerr` commands.

## Rich Media Cards

`/movie`, `/tv`, `/latest`, `/request`, and random Watch Party flows use compact cards with title/year/overview and artwork when available. Provider credentials are never embedded into Discord image URLs.

## Request availability tracking

MediaOps keeps its own tracked request state and treats the selected media server as the final authority for actual library availability. A provider reporting `Available` does not by itself prove that the title is present in Emby/Jellyfin.

This is intentionally separate from third-party native Discord notifications. Operators who require authoritative final availability notifications should avoid letting a request provider independently announce `Available` without a media-server verification step.

## MediaOps Discord Router

The companion router is a messenger/routing component for Discord Forum workflows. It does not decide whether a request is valid or whether media is truly available.

Current provider routes:

```text
POST /ombi   -> Ombi adapter
POST /seerr  -> Seerr adapter
                 |
                 v
        normalized router event
                 |
                 v
          Discord Forum post
```

It can create a Forum post, persist the request/thread association, append lifecycle updates to the same thread, and update Movie/Series plus Requested/Processing/Available/Failed/Denied tags.

For tag updates, the router may use the MediaOps Discord bot token with the minimum Discord permissions required by the target Forum. Keep that token secret and inject it at runtime; never commit it.

The router remains distributed under the historical image name for upgrade compatibility:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

The component is being generalized as **MediaOps Discord Router**; existing Ombi deployments remain supported.

Persistent router state lives at `/data/media-threads.json`. On NAS/Portainer bind mounts, the mapped host directory must already be writable by the configured non-root container user. Do not solve permission problems with `777` or privileged mode.

See [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) and [`addons/ombi-discord-router/README.md`](addons/ombi-discord-router/README.md).

## Docker / Portainer quick start

Stable image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development image:

```text
ghcr.io/miakkia/mediaops:dev
```

Example using Jellyfin + Seerr:

```yaml
services:
  mediaops:
    image: ghcr.io/miakkia/mediaops:latest
    container_name: MediaOps
    restart: unless-stopped
    environment:
      DISCORD_TOKEN: REPLACE_ME
      DISCORD_CLIENT_ID: REPLACE_ME
      DISCORD_GUILD_ID: REPLACE_ME

      MEDIA_PROVIDER: jellyfin
      JELLYFIN_URL: http://jellyfin:8096
      JELLYFIN_API_KEY: REPLACE_ME

      REQUEST_PROVIDER: seerr
      SEERR_URL: http://seerr:5055
      SEERR_API_KEY: REPLACE_ME

      MEDIAOPS_LOCALE: en
      MEDIAOPS_TIMEZONE: America/Toronto
      MEDIAOPS_DATA_DIR: /data
    volumes:
      - ./mediaops-data:/data
```

For Emby + Ombi, select those providers and supply only `EMBY_*` and `OMBI_*` credentials instead.

No privileged mode, Docker socket, media-library filesystem mount, or inbound MediaOps application port is required for current core bot features.

## Unraid

The Community Apps template exposes provider selection and provider-specific configuration. Existing Emby/Ombi installations remain a supported configuration; adding Jellyfin/Seerr support does not require existing operators to migrate providers.

Files:

- [`templates/mediaops.xml`](templates/mediaops.xml)
- [`templates/ombi-discord-router.xml`](templates/ombi-discord-router.xml)
- [`docs/UNRAID.md`](docs/UNRAID.md)

## Security posture

- one self-hosted MediaOps deployment uses an operator-owned Discord bot;
- least privilege and minimum attack surface are preferred;
- unselected provider credentials are not required;
- API keys/tokens are sent in provider headers where supported, never query strings for the new Jellyfin/Seerr clients;
- redirects are rejected by provider clients where credential forwarding would be unsafe;
- external provider responses are validated before use;
- no Docker socket or privileged mode is required;
- persistent state is limited to explicitly mounted data directories;
- secrets must not be committed, logged, or posted in screenshots/support material.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Documentation

- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) — media/request provider architecture
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker/GHCR deployment
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid deployment
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) — Discord UX
- [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) — Discord Forum router workflow
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) — current limitations
- [`CHANGELOG.md`](CHANGELOG.md) — release history

## License

MediaOps is distributed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE).
