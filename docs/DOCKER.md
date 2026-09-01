# Docker Deployment

MediaOps is distributed through GitHub Container Registry (GHCR). The runtime is self-hosted, single-tenant, and uses an operator-owned Discord bot.

## Images

Stable:

```text
ghcr.io/miakkia/mediaops:latest
```

Development:

```text
ghcr.io/miakkia/mediaops:dev
```

Optional Discord Router (historical image name retained for compatibility):

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

## Provider selection

MediaOps supports two media providers and two request providers:

```text
MEDIA_PROVIDER=emby | jellyfin
REQUEST_PROVIDER=ombi | seerr
```

Only the selected provider is initialized, so credentials for unselected providers are not required.

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

### Ombi

```env
REQUEST_PROVIDER=ombi
OMBI_URL=http://ombi:3579
OMBI_API_KEY=REPLACE_ME
```

Ombi approval remains controlled by Ombi's own user/role policy. `OMBI_AUTO_APPROVE` is no longer part of the current MediaOps configuration.

### Seerr

```env
REQUEST_PROVIDER=seerr
SEERR_URL=http://seerr:5055
SEERR_API_KEY=REPLACE_ME
```

Seerr approval remains controlled by Seerr's user policy. MediaOps does not force explicit approval.

## Example: Jellyfin + Seerr

```yaml
services:
  mediaops:
    image: ghcr.io/miakkia/mediaops:latest
    container_name: MediaOps
    restart: unless-stopped
    environment:
      MEDIAOPS_BOT_NAME: "MediaOps Bot"
      MEDIAOPS_SERVER_NAME: "My Media Server"
      DISCORD_TOKEN: "REPLACE_ME"
      DISCORD_CLIENT_ID: "REPLACE_ME"
      DISCORD_GUILD_ID: "REPLACE_ME"

      MEDIA_PROVIDER: "jellyfin"
      JELLYFIN_URL: "http://jellyfin:8096"
      JELLYFIN_API_KEY: "REPLACE_ME"

      REQUEST_PROVIDER: "seerr"
      SEERR_URL: "http://seerr:5055"
      SEERR_API_KEY: "REPLACE_ME"

      MEDIAOPS_LOCALE: "en"
      MEDIAOPS_TIMEZONE: "America/Toronto"
      MEDIAOPS_DATA_DIR: "/data"
    volumes:
      - ./mediaops-data:/data
```

For existing Emby + Ombi deployments, keep `MEDIA_PROVIDER=emby` and `REQUEST_PROVIDER=ombi` and retain the existing Emby/Ombi URL/key values. No Jellyfin/Seerr credentials are required.

## Persistent data

Mount persistent MediaOps state at `/data`:

```text
MEDIAOPS_DATA_DIR=/data
```

MediaOps does not require Movies/Series/Downloads filesystem mounts for the current provider API workflows.

## Register slash commands

```bash
docker exec MediaOps npm run deploy-commands
```

The runtime contains the compiled command deployment utility; host Node.js, Git, TypeScript, and source checkout are not required.

## Updating

```bash
docker pull ghcr.io/miakkia/mediaops:latest
```

Recreate the container using the same persistent `/data` mapping and environment values. If command definitions changed, run `npm run deploy-commands` again inside the container.

## MediaOps Discord Router

The router accepts provider webhook adapters at:

```text
POST /ombi
POST /seerr
```

It is a messenger/routing component. It does not validate whether provider state is truthful.

The router can create Discord Forum posts, persist provider/media/request-to-thread associations, append updates to the same thread, and update lifecycle tags.

A hardened deployment should remain non-root, read-only except for `/data`, `cap_drop: ALL`, and `no-new-privileges`.

Example persistence mapping on a NAS/Portainer host:

```yaml
volumes:
  - /volume1/Docker/MediaOps-Discord-Router/data:/data
```

Create the host directory first and ensure it is writable by the configured router UID/GID. A bind mount replaces the image's internal `/data` ownership, so Dockerfile ownership cannot correct an unwritable host directory.

Do not use `777`, privileged mode, or root execution as a permission workaround.

For dynamic Forum tag updates, the router can receive `DISCORD_BOT_TOKEN` at runtime. This secret is separate from the Discord Forum webhook URL and must never be committed or logged.

Prefer a private Docker network between Seerr/Ombi and the router. Do not publish router port 8080 publicly when the provider can reach it privately.

## Security notes

- keep Discord tokens and provider API keys out of Compose files committed to source control;
- do not run MediaOps or the router privileged;
- do not mount the Docker socket;
- prefer private Docker/LAN networking for provider APIs;
- expose only services that have a concrete need to be public;
- rotate any credential exposed in screenshots, logs, or support material.

See [`SECURITY.md`](../SECURITY.md) and [`SECURITY_MODEL.md`](SECURITY_MODEL.md).
