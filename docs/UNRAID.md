# Unraid Deployment

MediaOps is designed to run cleanly on Unraid without copying the source repository to the server. Unraid pulls the prebuilt image from GHCR and stores only MediaOps-owned runtime data in appdata.

## Current image

```text
ghcr.io/miakkia/mediaops:dev
```

The `dev` tag is the current pre-release channel. A stable release tag will replace it for the public Community Apps release.

## Recommended container settings

- **Name:** `MediaOps`
- **Repository:** `ghcr.io/miakkia/mediaops:dev`
- **Network Type:** `Bridge`
- **Privileged:** `Off`
- **WebUI:** none currently
- **Ports:** none currently required

## Persistent appdata

Create one Path entry:

| Field | Value |
| --- | --- |
| Name | `MediaOps Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/mediaops` |
| Access Mode | Read/Write |

Do not create `MEDIAOPS_DATA_DIR` as a Path. It is an environment variable and must be configured separately as described below.

## Variables

Create the following Variable entries:

| Name | Key | Default / value | Notes |
| --- | --- | --- | --- |
| Media Provider | `MEDIA_PROVIDER` | `emby` | Current supported provider |
| Discord Token | `DISCORD_TOKEN` | empty | Secret; paste your bot token |
| Discord Client ID | `DISCORD_CLIENT_ID` | empty | Discord application ID |
| Discord Guild ID | `DISCORD_GUILD_ID` | empty | Discord server/guild ID |
| Emby URL | `EMBY_URL` | empty | URL reachable from the Unraid host/container |
| Emby API Key | `EMBY_API_KEY` | empty | Secret |
| Watch Party URL | `WATCHPARTY_URL` | empty | Base/public URL for Watch Party |
| MediaOps Data Directory | `MEDIAOPS_DATA_DIR` | `/data` | Must be a Variable, not a Path |

Unraid already provides its own timezone environment value. A duplicate `TZ` variable is not required for the standard template.

## Expected Docker configuration

The important pieces should resolve to the equivalent of:

```text
-e MEDIA_PROVIDER=emby
-e MEDIAOPS_DATA_DIR=/data
-v /mnt/user/appdata/mediaops:/data:rw
```

It must **not** produce a mount such as:

```text
-v /data:MEDIAOPS_DATA_DIR:rw
```

because `MEDIAOPS_DATA_DIR` is not a container path.

## First start

Before starting the Unraid container, stop any local development instance using the same Discord bot token. Only one production instance should normally run for a given bot.

After Apply, open the MediaOps container logs. A successful startup currently looks similar to:

```text
Solitario Butler connected as <bot tag>
Loaded 11 Discord commands: health, latest, movie, ping, tv, watchparty-schedule, watchparty-setup, watchparty-start, watchparty-status, watchparty, watchpartyrandom
```

Then validate at minimum:

1. `/health`
2. `/movie`
3. `/watchpartyrandom`
4. a scheduled Watch Party flow

## Updating MediaOps

When a new image is published:

1. update/pull `ghcr.io/miakkia/mediaops:dev`;
2. recreate or Force Update the container;
3. keep the same appdata mapping and environment variables;
4. verify logs and a basic `/health` command.

The `/mnt/user/appdata/mediaops` data persists independently of the container image.

## Preconfigured template

The repository contains `templates/mediaops.xml`, a version-2 Unraid Docker template with the expected appdata path and variables already defined. It is intended to make installation a fill-in-the-required-values workflow instead of manually constructing the container configuration.

For the eventual Community Apps submission, the template will move from the development image/tag to the stable release channel and will be validated against the current Unraid Community Apps submission process.

## Security posture

MediaOps should remain a narrow integration service:

- no privileged mode;
- no Docker socket;
- no Movies/Series/Downloads mounts;
- no inbound ports unless a future feature requires one;
- Discord and Emby secrets supplied only at runtime;
- persistent access limited to MediaOps-owned appdata.
