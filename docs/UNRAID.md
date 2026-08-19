# Unraid Deployment

MediaOps is designed to run cleanly on Unraid without copying the source repository to the server. Unraid pulls a prebuilt image from GHCR and stores only MediaOps-owned runtime data in appdata.

## Image

Stable/default image after the Docker branch is merged:

```text
ghcr.io/miakkia/mediaops:latest
```

The development channel remains available as:

```text
ghcr.io/miakkia/mediaops:dev
```

## Recommended container settings

- **Name:** `MediaOps`
- **Repository:** `ghcr.io/miakkia/mediaops:latest`
- **Network Type:** `Bridge`
- **Privileged:** `Off`
- **WebUI:** none currently
- **Ports:** none currently required

## Persistent appdata

Use one Path entry:

| Field | Value |
| --- | --- |
| Name | `MediaOps Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/mediaops` |
| Access Mode | Read/Write |

`MEDIAOPS_DATA_DIR` is an environment variable, not a Path.

## Variables

| Name | Key | Default / value | Notes |
| --- | --- | --- | --- |
| Media Provider | `MEDIA_PROVIDER` | `emby` | Current supported provider |
| Discord Token | `DISCORD_TOKEN` | empty | Secret |
| Discord Client ID | `DISCORD_CLIENT_ID` | empty | Discord application ID |
| Discord Guild ID | `DISCORD_GUILD_ID` | empty | Discord server/guild ID |
| Emby URL | `EMBY_URL` | empty | URL reachable from the container |
| Emby API Key | `EMBY_API_KEY` | empty | Secret |
| Watch Party URL | `WATCHPARTY_URL` | empty | Base/public URL for Watch Party |
| MediaOps Locale | `MEDIAOPS_LOCALE` | `en` | Automated message language; supported: `en`, `fr` |
| MediaOps Data Directory | `MEDIAOPS_DATA_DIR` | `/data` | Advanced; leave at `/data` |

Unraid already provides its own timezone environment value, so the standard template does not define a duplicate `TZ` entry.

## Preconfigured template

The repository includes `templates/mediaops.xml`, a version-2 Unraid template. It predefines the GHCR image, bridge networking, non-privileged mode, appdata mapping and all current MediaOps variables. Sensitive values are left empty and marked masked where supported.

The intended installation flow is:

1. install/select the MediaOps template;
2. enter Discord credentials and IDs;
3. enter the Emby URL and API key;
4. enter the Watch Party URL;
5. choose `MEDIAOPS_LOCALE=en` or `fr`;
6. leave `MEDIA_PROVIDER=emby` and `MEDIAOPS_DATA_DIR=/data` unless documented otherwise;
7. Apply and inspect the container logs.

## First start

Before starting the Unraid container, stop any local development instance using the same Discord bot token.

A successful startup currently looks similar to:

```text
Solitario Butler connected as <bot tag>
Loaded 12 Discord commands: health, latest, movie, ping, tv, watchparty-schedule, watchparty-setup, watchparty-start, watchparty-status, watchparty-upcoming, watchparty, watchpartyrandom
```

Then validate at minimum:

1. `/health`
2. `/movie`
3. `/watchpartyrandom`
4. a scheduled Watch Party flow
5. `/watchparty-upcoming`
6. automatic Watch Party reminder delivery

This deployment path has been validated on Unraid using the GHCR image and persistent appdata mapping.

## Updating MediaOps

When a new stable image is published:

1. pull/Force Update `ghcr.io/miakkia/mediaops:latest`;
2. keep the existing appdata mapping and environment variables;
3. restart/recreate the container if required;
4. verify logs and `/health`.

The `/mnt/user/appdata/mediaops` data persists independently of the image.

## Community Apps metadata

The repository contains:

- `ca_profile.xml` at the repository root;
- `templates/mediaops.xml` as the Docker app template;
- `assets/mediaops-icon.png` as the application/profile icon;
- GPLv3 licensing;
- project and documentation links;
- a public GHCR image path.

Before an actual Community Apps submission, run the current Unraid **Validate** and **Scan** workflow and resolve every reported issue. The template remains marked beta while MediaOps is under active development.

## Security posture

MediaOps should remain a narrow integration service:

- no privileged mode;
- no Docker socket;
- no Movies/Series/Downloads mounts;
- no inbound ports unless a future feature requires one;
- Discord and Emby secrets supplied only at runtime;
- persistent access limited to MediaOps-owned appdata.


## Watch Party lifecycle and reminders

MediaOps runs a background Watch Party lifecycle scheduler after the Discord client connects.

The scheduler currently:

- refreshes scheduled Watch Party lifecycle state every minute;
- exposes upcoming sessions through `/watchparty-upcoming`;
- sends a single reminder approximately 15 minutes before start;
- persists reminder delivery state in appdata to prevent duplicate reminders after container restarts;
- ignores cancelled, auto-cancelled and expired sessions;
- automatically marks a newly created Watch Party `auto_cancelled` if its Discord announcement cannot be posted.

If Discord returns a missing-access error while scheduling, MediaOps reports a channel-permission message to the user instead of leaving the failed session visible as an upcoming Watch Party.
