# Unraid Deployment

MediaOps is designed to run on Unraid without copying the source repository to the server. Unraid pulls prebuilt images from GHCR and stores application-owned runtime data in appdata.

## MediaOps image

Stable/default image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development image:

```text
ghcr.io/miakkia/mediaops:dev
```

## Recommended MediaOps container settings

- **Name:** `MediaOps`
- **Repository:** `ghcr.io/miakkia/mediaops:latest`
- **Network Type:** `Bridge`
- **Privileged:** `Off`
- **WebUI:** none currently
- **Ports:** none currently required

## Persistent MediaOps appdata

Use one Path entry:

| Field | Value |
| --- | --- |
| Name | `MediaOps Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/mediaops` |
| Access Mode | Read/Write |

Set `MEDIAOPS_DATA_DIR=/data`; this is an environment variable, not a Path.

## MediaOps variables

| Name | Key | Default / value | Notes |
| --- | --- | --- | --- |
| Bot Display Name | `MEDIAOPS_BOT_NAME` | `MediaOps Bot` | Public-facing panel/message name; does not rename the Discord application |
| Media Server Display Name | `MEDIAOPS_SERVER_NAME` | `My Media Server` | Friendly server/community name |
| Media Provider | `MEDIA_PROVIDER` | `emby` | Current supported provider |
| Discord Token | `DISCORD_TOKEN` | empty | Secret |
| Discord Client ID | `DISCORD_CLIENT_ID` | empty | Discord application ID |
| Discord Guild ID | `DISCORD_GUILD_ID` | empty | Discord server/guild ID |
| Emby URL | `EMBY_URL` | empty | URL reachable from the container |
| Emby API Key | `EMBY_API_KEY` | empty | Secret |
| Request Provider | `REQUEST_PROVIDER` | `none` | Use `ombi` to enable request workflows |
| Ombi URL | `OMBI_URL` | empty | Required for Ombi requests |
| Ombi API Key | `OMBI_API_KEY` | empty | Secret |
| Ombi Auto Approve | `OMBI_AUTO_APPROVE` | `false` | Optional request approval behavior |
| Watch Party URL | `WATCHPARTY_URL` | empty | Public/base Watch Party URL |
| MediaOps Locale | `MEDIAOPS_LOCALE` | `en` | Automated message language; `en` or `fr` |
| MediaOps Timezone | `MEDIAOPS_TIMEZONE` | `America/Toronto` | IANA timezone |
| MediaOps Data Directory | `MEDIAOPS_DATA_DIR` | `/data` | Leave at `/data` for the template |

Additional Watch Party host credentials and optional Forum settings are exposed by the template and documented in `.env.example`.

### Existing customized installations

A Force Update preserves existing Unraid environment variables. Older customized installations should explicitly set the branding variables if they want to retain custom public names:

```text
MEDIAOPS_BOT_NAME=Cinema Helper
MEDIAOPS_SERVER_NAME=Example Cinema
```

If omitted, MediaOps uses `MediaOps Bot` and `My Media Server`.

## Optional Media Request Forum

The Forum integration is optional. Configure the complete identifier set to enable it; incomplete configuration remains fail-closed.

Required identifiers include `MEDIA_REQUESTS_FORUM_ID`, `MEDIA_REQUESTS_WEBHOOK_ID`, the Requested/Processing/Available/Failed/Denied status tag IDs, and the Movie/Series media tag IDs.

Grant only the Discord permissions and gateway intents required by enabled features. Do not give the bot Administrator permission when narrower permissions are sufficient.

See [`REQUEST_FORUM.md`](REQUEST_FORUM.md).

## Companion Ombi Discord Router

The optional request Forum uses a separate companion container so the Discord webhook URL/token does not need to be stored in MediaOps.

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
```

Create a user-defined Docker network and attach Ombi plus the router:

```bash
docker network create mediaops-backend
```

Ombi can then use the stable webhook destination:

```text
http://ombi-discord-router:8080/ombi
```

Do not use a container IP address.

### Router appdata

| Field | Value |
| --- | --- |
| Name | `Router Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/ombi-discord-router/data` |
| Access Mode | Read/Write |

`/data/media-threads.json` correlates media identities to Discord Forum thread IDs. Preserve this mapping during updates.

### Router security defaults

The template applies a non-root user, read-only root filesystem, `/tmp` tmpfs, dropped Linux capabilities, `no-new-privileges`, a 256 MB memory limit, and a 64 PID limit. The router publishes no host port; keep `/ombi` private to the Docker/LAN trust boundary.

### Router health validation

```bash
docker exec ombi-discord-router \
  python -c 'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8080/health").read().decode())'
```

From Ombi when both containers share `mediaops-backend`:

```bash
docker exec ombi sh -lc '
getent hosts ombi-discord-router
curl -sS --max-time 5 http://ombi-discord-router:8080/health
'
```

## First start

Before starting MediaOps, stop any other instance using the same Discord bot token.

A successful startup resembles:

```text
MediaOps Bot connected as <bot tag>
Loaded 15 Discord commands: ...
Watch Party lifecycle scheduler started.
Runtime-aware Watch Party expiry scheduler started.
```

Register the guild slash commands directly from the running container:

```bash
docker exec MediaOps npm run deploy-commands
```

Replace `MediaOps` with the actual container name when customized. The published runtime executes compiled `dist/deploy-commands.js`; `tsx`, TypeScript, Git, and a source checkout are not required.

A successful deployment reports all 15 registered commands.

## Recommended Discord setup

Use the administrator-only setup commands in the channels where you want their persistent guides:

- `/mediaops-setup` — user-facing media command guide;
- `/watchparty-setup` — Watch Party self-service panel;
- `/mediaops-admin-setup` — private diagnostics guide.

A practical layout is one public media/help channel, one Watch Party channel, and one private admin/moderator channel. Channel names are not hard-coded.

`/ping`, `/health`, `/mediaops-setup`, `/watchparty-setup`, and `/mediaops-admin-setup` require **Manage Server** by default. `/ping` and `/health` reply ephemerally.

## Acceptance test

For a clean public-release validation, test at minimum:

1. container startup and persistent `/data`;
2. `npm run deploy-commands` from inside the running container;
3. `/health` as a server manager;
4. `/mediaops-setup` and `/watchparty-setup`;
5. `/movie`, `/tv`, and `/latest`;
6. `/request` when Ombi is enabled;
7. one Ombi -> router -> Forum lifecycle when Forum synchronization is enabled;
8. `/watchpartyrandom` and one manually scheduled Watch Party;
9. RSVP and T-15 reminder;
10. automatic room opening and direct join link;
11. organizer cancellation after opening;
12. tracked Discord message cleanup;
13. `/watchparty-upcoming` and `/watchparty-status`.

The release acceptance test should be performed from the public documentation and published image rather than from a development checkout.

## Updating

For MediaOps:

1. pull/Force Update `ghcr.io/miakkia/mediaops:latest`;
2. keep appdata and environment variables;
3. restart/recreate if required;
4. run `docker exec MediaOps npm run deploy-commands` when command definitions changed;
5. verify logs and `/health`.

For the router, preserve `/data`, the Docker network, and runtime variables, then validate `/health` and one lifecycle notification after material updates.

## Community Apps

The repository contains:

- `ca_profile.xml`;
- `templates/mediaops.xml`;
- `templates/ombi-discord-router.xml`;
- `assets/mediaops-icon.png`;
- GPLv3 licensing;
- project/documentation links;
- public GHCR image paths.

Before Community Apps submission, run the current Unraid **Validate** and **Scan** workflow and resolve every reported issue. The public release should also be installed once from the templates as a clean user would install it.

## Security posture

MediaOps and its router are intentionally narrow integration services:

- no privileged mode;
- no Docker socket;
- no Movies/Series/Downloads mounts;
- no unnecessary host ports;
- secrets supplied only at runtime;
- persistent access limited to application-owned appdata;
- optional Forum automation scoped to its configured Forum and integration source;
- least-privilege Discord permissions and intents;
- router webhook credential isolated from the MediaOps bot token.

See `SECURITY.md` and [`SECURITY_MODEL.md`](SECURITY_MODEL.md).

## Watch Party lifecycle notes

The lifecycle scheduler refreshes state every minute, sends one reminder approximately 15 minutes before start, persists reminder delivery state across restarts, automatically opens the room at start time, and ignores terminal sessions for future reminders.

Active expiry uses the Emby movie runtime plus a 45-minute grace period. If runtime information is unavailable, the safety fallback is **4.5 hours**. Organizer cancellation remains available after room activation. Cancellation state is immediate, while Discord message cleanup may occur on the following scheduler pass.
