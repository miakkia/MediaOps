# Unraid Deployment

MediaOps is designed to run on Unraid without copying the source repository to the server. Unraid pulls prebuilt images from GHCR and stores application-owned runtime data in appdata.

## V1 Discord bot model

MediaOps v1 is **self-hosted and single-tenant**. Before installing the container, create your own Discord application/bot using [`DISCORD_BOT_SETUP.md`](DISCORD_BOT_SETUP.md).

The public MediaOps Community demo bot is not a universal bot for other operators. Do not reuse one v1 MediaOps instance across unrelated Discord guilds with different Emby/Ombi/Watch Party backends because provider configuration is global to the container.

## MediaOps image

Stable/default image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development image:

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

| Field | Value |
| --- | --- |
| Name | `MediaOps Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/mediaops` |
| Access Mode | Read/Write |

Set `MEDIAOPS_DATA_DIR=/data`.

## Core variables

| Name | Key | Default / value | Notes |
| --- | --- | --- | --- |
| Bot Display Name | `MEDIAOPS_BOT_NAME` | `MediaOps Bot` | Public-facing name; does not rename the Discord application |
| Media Server Display Name | `MEDIAOPS_SERVER_NAME` | `My Media Server` | Friendly server/community name |
| Media Provider | `MEDIA_PROVIDER` | `emby` | Current supported provider |
| Discord Token | `DISCORD_TOKEN` | empty | Secret for **your own** Discord bot |
| Discord Client ID | `DISCORD_CLIENT_ID` | empty | Application ID for **your own** Discord app |
| Discord Guild ID | `DISCORD_GUILD_ID` | empty | Discord server ID for this deployment |
| Emby URL | `EMBY_URL` | empty | URL reachable from the container |
| Emby API Key | `EMBY_API_KEY` | empty | Secret |
| Request Provider | `REQUEST_PROVIDER` | `none` | Use `ombi` to enable requests |
| Ombi URL | `OMBI_URL` | empty | Required for Ombi requests |
| Ombi API Key | `OMBI_API_KEY` | empty | Secret |
| Ombi Auto Approve | `OMBI_AUTO_APPROVE` | `false` | Request approval behavior |
| Watch Party URL | `WATCHPARTY_URL` | empty | Public/base Watch Party URL |
| MediaOps Locale | `MEDIAOPS_LOCALE` | `en` | `en` or `fr` |
| MediaOps Timezone | `MEDIAOPS_TIMEZONE` | `America/Toronto` | IANA timezone |
| MediaOps Data Directory | `MEDIAOPS_DATA_DIR` | `/data` | Leave at `/data` |

Additional Watch Party host credentials and optional Forum settings are exposed by the template and documented in `.env.example`.

### Existing customized installations

A Force Update preserves existing Unraid environment variables. Older customized installations can retain their names with:

```text
MEDIAOPS_BOT_NAME=Cinema Helper
MEDIAOPS_SERVER_NAME=Example Cinema
```

## Discord setup before first start

Follow [`DISCORD_BOT_SETUP.md`](DISCORD_BOT_SETUP.md) to:

1. create your Discord application and bot;
2. enable the required gateway intents;
3. grant least-privilege bot permissions (not Administrator);
4. install the bot into the intended guild;
5. copy the application ID, bot token, and server ID;
6. optionally disable public installation after the bot is installed.

For normal v1 self-hosting, use an operator-owned bot identity for this MediaOps deployment.

## Optional Media Request Forum

The Forum integration is optional. Configure the complete identifier set to enable it; incomplete configuration remains fail-closed.

Required identifiers include `MEDIA_REQUESTS_FORUM_ID`, `MEDIA_REQUESTS_WEBHOOK_ID`, Requested/Processing/Available/Failed/Denied tag IDs, and Movie/Series tag IDs.

See [`REQUEST_FORUM.md`](REQUEST_FORUM.md).

## Companion Ombi Discord Router

The optional Forum workflow uses a separate companion container:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
```

Create a user-defined Docker network and attach Ombi plus the router:

```bash
docker network create mediaops-backend
```

Ombi can then use:

```text
http://ombi-discord-router:8080/ombi
```

Do not use a changing container IP address.

### Router appdata

| Field | Value |
| --- | --- |
| Name | `Router Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/ombi-discord-router/data` |
| Access Mode | Read/Write |

The router's `/data/media-threads.json` belongs to that router instance and Discord Forum destination. Separate demo/production router instances should use separate appdata and separate webhook/tag configuration.

### Router security defaults

The template applies a non-root user, read-only root filesystem, `/tmp` tmpfs, dropped Linux capabilities, `no-new-privileges`, a 256 MB memory limit, and a 64 PID limit. The router publishes no host port; keep `/ombi` private to the Docker/LAN trust boundary.

### Router health validation

```bash
docker exec ombi-discord-router \
  python -c 'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8080/health").read().decode())'
```

## First start

Before starting MediaOps, stop any other instance using the same Discord bot token.

Expected startup:

```text
MediaOps Bot connected as <bot tag>
Loaded 15 Discord commands: ...
Watch Party lifecycle scheduler started.
Runtime-aware Watch Party expiry scheduler started.
```

Register guild commands directly from the running container:

```bash
docker exec MediaOps npm run deploy-commands
```

The runtime executes compiled `dist/deploy-commands.js`; `tsx`, TypeScript, Git, and a source checkout are not required.

## Recommended Discord setup panels

- `/mediaops-setup` — user-facing media guide;
- `/watchparty-setup` — Watch Party self-service panel;
- `/mediaops-admin-setup` — private diagnostics guide.

`/ping`, `/health`, `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` require **Manage Server** for the invoking human member by default. `Manage Server` is not a required bot permission.

## Acceptance test

For a clean public-release validation, test at minimum:

1. create/secure a new operator-owned Discord bot from the public guide;
2. container startup and persistent `/data`;
3. `npm run deploy-commands` from inside the running container;
4. `/health` as a server manager;
5. `/mediaops-setup` and `/watchparty-setup`;
6. `/movie`, `/tv`, and `/latest`;
7. `/request` when Ombi is enabled;
8. one Ombi -> router -> Forum lifecycle when Forum synchronization is enabled;
9. `/watchpartyrandom` and one manually scheduled Watch Party;
10. RSVP and T-15 reminder;
11. automatic room opening and direct join link;
12. organizer cancellation after opening;
13. tracked Discord message cleanup;
14. `/watchparty-upcoming` and `/watchparty-status`;
15. container recreation/restart with persistent state retained.

## Updating

For MediaOps:

1. pull/Force Update `ghcr.io/miakkia/mediaops:latest`;
2. keep appdata and environment variables;
3. restart/recreate if required;
4. run `docker exec MediaOps npm run deploy-commands` when command definitions changed;
5. verify logs and `/health`.

For the router, preserve `/data`, network, webhook/tag configuration, then validate `/health` and a lifecycle notification after material updates.

## Community Apps

The repository contains `ca_profile.xml`, main/companion templates, icon, GPLv3 licensing, project/documentation links, and public GHCR image paths.

Before Community Apps submission:

- verify the Unraid template links users to `DISCORD_BOT_SETUP.md`;
- install once as a clean self-hosted operator;
- run the current **Validate** and **Scan** workflows;
- resolve every reported issue;
- verify secret fields are masked where supported.

## Security posture

- operator-owned Discord bot/token per v1 deployment;
- no public universal demo bot for unrelated guilds;
- no privileged mode;
- no Docker socket;
- no Movies/Series/Downloads mounts;
- no unnecessary host ports;
- secrets supplied only at runtime;
- persistent access limited to application-owned appdata;
- optional Forum automation scoped to configured Forum/integration source;
- least-privilege Discord permissions/intents;
- router webhook credential isolated from the MediaOps bot token.

See `SECURITY.md` and [`SECURITY_MODEL.md`](SECURITY_MODEL.md).

## Watch Party lifecycle notes

The lifecycle scheduler refreshes state every minute, sends one reminder approximately 15 minutes before start, persists reminder state across restarts, automatically opens the room at start time, and ignores terminal sessions for future reminders.

Active expiry uses Emby runtime plus a 45-minute grace period. If runtime information is unavailable, the fallback is **4.5 hours**. Organizer cancellation remains available after activation. Discord message cleanup may occur on the following scheduler pass.
