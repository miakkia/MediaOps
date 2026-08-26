# Unraid Deployment

MediaOps is designed to run cleanly on Unraid without copying the source repository to the server. Unraid pulls prebuilt images from GHCR and stores only application-owned runtime data in appdata.

## MediaOps image

Stable/default image:

```text
ghcr.io/miakkia/mediaops:latest
```

Development channel:

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

`MEDIAOPS_DATA_DIR` is an environment variable, not a Path.

## MediaOps variables

| Name | Key | Default / value | Notes |
| --- | --- | --- | --- |
| Bot Display Name | `MEDIAOPS_BOT_NAME` | `MediaOps Bot` | Public-facing name used in panels/messages; does not rename the Discord application |
| Media Server Display Name | `MEDIAOPS_SERVER_NAME` | `My Media Server` | Friendly server/community name used in panels and Watch Party events |
| Media Provider | `MEDIA_PROVIDER` | `emby` | Current supported provider |
| Discord Token | `DISCORD_TOKEN` | empty | Secret |
| Discord Client ID | `DISCORD_CLIENT_ID` | empty | Discord application ID |
| Discord Guild ID | `DISCORD_GUILD_ID` | empty | Discord server/guild ID |
| Emby URL | `EMBY_URL` | empty | URL reachable from the container |
| Emby API Key | `EMBY_API_KEY` | empty | Secret |
| Request Provider | `REQUEST_PROVIDER` | `none` | Use `ombi` to enable request workflows |
| Ombi URL | `OMBI_URL` | empty | Required when request provider is Ombi |
| Ombi API Key | `OMBI_API_KEY` | empty | Secret |
| Ombi Auto Approve | `OMBI_AUTO_APPROVE` | `false` | Optional request approval behavior |
| Watch Party URL | `WATCHPARTY_URL` | empty | Base/public URL for Watch Party |
| MediaOps Locale | `MEDIAOPS_LOCALE` | `en` | Automated message language; supported: `en`, `fr` |
| MediaOps Timezone | `MEDIAOPS_TIMEZONE` | `America/Toronto` | IANA timezone |
| MediaOps Data Directory | `MEDIAOPS_DATA_DIR` | `/data` | Advanced; leave at `/data` |

### Existing customized installations

A Force Update preserves existing Unraid environment variables. If an older installation did not previously define the new branding variables, add them before or after updating if you want to retain custom public names.

Example:

```text
MEDIAOPS_BOT_NAME=Cinema Helper
MEDIAOPS_SERVER_NAME=Example Cinema
```

If omitted, MediaOps uses the safe public defaults `MediaOps Bot` and `My Media Server`.

## Register or update Discord slash commands

After the first installation, or after an update that changes Discord commands, synchronize the guild command definitions directly from the running MediaOps container:

```bash
docker exec MediaOps npm run deploy-commands
```

If your container has a custom name, replace `MediaOps` with that name, for example:

```bash
docker exec MediaOps-dev npm run deploy-commands
```

The published image runs the compiled `dist/deploy-commands.js`, so this command does **not** require `tsx`, TypeScript, Git, the source repository, or Node.js installed separately on the Unraid host. It uses the Discord token, client ID, and guild ID already configured in the container.

Expected success output begins with:

```text
Successfully registered ... Discord commands
```

If Discord returns `401 Unauthorized`, verify or rotate the configured `DISCORD_TOKEN`. Never paste the token into Discord, GitHub issues, screenshots, or support logs.

### Optional Media Request Forum variables

The Forum integration is optional. Configure every field below to enable it; leaving the set incomplete keeps synchronization disabled.

| Name | Key | Default | Notes |
| --- | --- | --- | --- |
| Media Requests Forum ID | `MEDIA_REQUESTS_FORUM_ID` | empty | Discord Forum channel ID |
| Media Requests Webhook ID | `MEDIA_REQUESTS_WEBHOOK_ID` | empty | Allowed webhook ID only; not the URL/token |
| Requested Tag ID | `MEDIA_TAG_REQUESTED` | empty | Status tag |
| Processing Tag ID | `MEDIA_TAG_PROCESSING` | empty | Status tag |
| Available Tag ID | `MEDIA_TAG_AVAILABLE` | empty | Terminal status tag |
| Failed Tag ID | `MEDIA_TAG_FAILED` | empty | Terminal status tag |
| Denied Tag ID | `MEDIA_TAG_DENIED` | empty | Terminal status tag |
| Movie Tag ID | `MEDIA_TAG_MOVIE` | empty | Media type tag |
| Series Tag ID | `MEDIA_TAG_SERIES` | empty | Media type tag |

When this feature is enabled, configure the matching Forum/tags in Discord and enable only the Discord gateway intent and channel permissions required for the integration. Do not give the bot Administrator permission when narrower Forum permissions are sufficient.

See [`REQUEST_FORUM.md`](REQUEST_FORUM.md) for the full workflow and security notes.

## Companion Ombi Discord Router

The request Forum uses a separate companion container so the Discord webhook URL/token does not need to be stored in MediaOps.

Published images:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
```

The repository includes `templates/ombi-discord-router.xml`, a version-2 Unraid template for this companion.

### Router network

Create one user-defined Docker network and attach Ombi plus the router to it:

```bash
docker network create mediaops-backend
```

In Unraid, set Ombi and the router to `Custom: mediaops-backend`. Ombi can then use the stable webhook destination:

```text
http://ombi-discord-router:8080/ombi
```

Do not use a container IP address; Docker may assign a different address after recreation or updates.

### Router appdata

| Field | Value |
| --- | --- |
| Name | `Router Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/ombi-discord-router/data` |
| Access Mode | Read/Write |

The persistent file `/data/media-threads.json` correlates media identities to Discord Forum thread IDs. Keep the appdata mapping when changing image versions.

### Router variables

| Name | Key | Default | Notes |
| --- | --- | --- | --- |
| Timezone | `TZ` | `America/Toronto` | IANA timezone for logs |
| Media Requests Webhook | `MEDIA_REQUESTS_WEBHOOK` | empty | **Secret** full Discord Forum webhook URL |
| Webhook Display Name | `MEDIA_REQUESTS_WEBHOOK_NAME` | `Media Request Herald` | Visible webhook sender name |
| Requested Status Tag ID | `MEDIA_TAG_REQUESTED` | empty | Newly submitted request |
| Processing Status Tag ID | `MEDIA_TAG_PROCESSING` | empty | Approved/in processing |
| Available Status Tag ID | `MEDIA_TAG_AVAILABLE` | empty | Terminal available state |
| Failed Status Tag ID | `MEDIA_TAG_FAILED` | empty | Terminal failed state |
| Denied Status Tag ID | `MEDIA_TAG_DENIED` | empty | Terminal denied state |
| Movie Media Tag ID | `MEDIA_TAG_MOVIE` | empty | Movie media type |
| Series Media Tag ID | `MEDIA_TAG_SERIES` | empty | TV-series media type |
| Router Data Directory | `ROUTER_DATA_DIR` | `/data` | Leave at `/data` |

The router template deliberately keeps the webhook masked and leaves all deployment-specific Discord IDs empty.

### Router security defaults

The template applies:

```text
--user 1000:1000
--read-only
--tmpfs /tmp
--cap-drop ALL
--security-opt no-new-privileges:true
--memory 256m
--pids-limit 64
```

The router publishes no host port. Keep `/ombi` private to the Docker/LAN trust boundary.

### Router health validation

From the router container:

```bash
docker exec ombi-discord-router \
  python -c 'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8080/health").read().decode())'
```

From Ombi:

```bash
curl -X POST http://ombi-discord-router:8080/ombi
```

The exact payload comes from Ombi notifications; the endpoint is not intended for public exposure.
