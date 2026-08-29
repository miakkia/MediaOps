# MediaOps

[![CI](https://github.com/miakkia/MediaOps/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/miakkia/MediaOps/actions/workflows/docker-publish.yml)
[![License](https://img.shields.io/github/license/miakkia/MediaOps)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](package.json)
[![GHCR](https://img.shields.io/badge/GHCR-mediaops-2496ED?logo=docker&logoColor=white)](https://github.com/miakkia/MediaOps/pkgs/container/mediaops)
[![Discord](https://img.shields.io/badge/Discord-MediaOps-5865F2?logo=discord&logoColor=white)](https://discord.gg/39EG2Y6fhA)
[![Emby](https://img.shields.io/badge/Media-Emby-52B54B)](https://emby.media/)
[![Ombi](https://img.shields.io/badge/Requests-Ombi-4C8BF5)](https://ombi.io/)
[![Watch Party](https://img.shields.io/badge/Watch%20Party-Emby%20Watch%20Party-8A2BE2)](https://github.com/Oratorian/emby-watchparty)

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a media server, request provider, and Watch Party service so members can discover media, submit requests, coordinate Watch Parties, and receive useful status updates without memorizing a large command set.

> **Release status:** first public release candidate. Emby is the supported media provider, Ombi is the supported request provider, and Emby Watch Party is the supported Watch Party integration for this release.

## MediaOps in action

MediaOps keeps the day-to-day media workflow inside Discord: search what is already in your library, request missing content, track request status, and organize synchronized Watch Parties.

### Search the Emby library

Use `/movie` or `/tv` to quickly find matching titles already available in your media library.

![MediaOps movie search](Images/movie%20command.jpg)

### Request missing media through Ombi

Use `/request` to search Ombi, choose the exact movie or series, and submit the request without leaving Discord.

![MediaOps movie request workflow](Images/Request%20movie%20Feature.jpg)

### Keep request history in a Discord Forum

The optional MediaOps Ombi Discord Router can maintain persistent request threads and lifecycle tags such as Requested, Processing, Available, Failed, and Denied.

![MediaOps request forum lifecycle](Images/forum%20request%20feature.jpg)

### Schedule and launch Watch Parties

MediaOps can schedule Watch Parties, collect RSVPs, send reminders, open the synchronized viewing room automatically, and provide direct join links.

![MediaOps Watch Party](Images/Watchparty%20feature.jpg)

MediaOps integrates with the open-source [Emby Watch Party project by Oratorian](https://github.com/Oratorian/emby-watchparty) for synchronized playback. MediaOps handles the Discord-side scheduling and lifecycle orchestration; Emby Watch Party provides the synchronized viewing experience.

### Publish a simple command guide for members

Administrators can publish a bilingual command panel so members can discover the main MediaOps features without memorizing slash commands.

![MediaOps Discord command guide](Images/Discord%20Bot%20Commands.jpg)

## Important: Discord deployment model for v1

MediaOps v1 is **self-hosted and single-tenant**.

Each operator:

1. creates their own Discord application/bot;
2. installs that bot into their own Discord server;
3. runs their own MediaOps container;
4. configures that container with their own Emby/Ombi/Watch Party credentials.

```text
Your Discord server
        |
        v
Your Discord application / bot
        |
        v
Your MediaOps container
   |        |        |
   v        v        v
 Emby      Ombi   Watch Party
```

The public **MediaOps Community demo bot is not a universal hosted bot** for other servers. The current provider configuration is global to one MediaOps container, not isolated per Discord guild. Do not invite a v1 MediaOps bot instance into unrelated guilds that require different backend credentials.

See **[`docs/DISCORD_BOT_SETUP.md`](docs/DISCORD_BOT_SETUP.md)** for the complete Discord Developer Portal setup, intents, permissions, installation restrictions, and command deployment procedure.

A hosted official universal/multi-tenant bot is retained only as a **Future / Maybe** concept. It is not committed or scheduled. If it is ever pursued, it will require a separate security-first architecture with per-guild isolation and secure private-backend connectivity rather than extending the current global v1 configuration directly.

## What MediaOps provides

- Emby movie and TV-series search;
- recently added media discovery;
- Ombi movie/TV request submission with requester attribution and optional auto-approval;
- persistent request tracking and one-time Discord DM notification when requested media becomes available;
- optional Discord Forum request history through the companion Ombi Discord Router;
- Watch Party scheduling, RSVP, T-15 reminder, automatic room creation, direct join links, organizer cancellation, lifecycle cleanup, and restart-safe persistent state;
- library-wide random movie selection and guided scheduling;
- `/mediaops-setup` and `/watchparty-setup` persistent self-service guides;
- administrator diagnostics through `/ping`, `/health`, and `/mediaops-admin-setup`;
- configurable public branding through `MEDIAOPS_BOT_NAME` and `MEDIAOPS_SERVER_NAME`;
- privacy-safe public/demo deployments through `MEDIAOPS_DEMO_MODE`;
- EN/FR internationalization foundation;
- Docker/GHCR distribution with a non-root runtime and persistent `/data` storage;
- Portainer/Compose and Unraid deployment paths;
- optional Ombi Discord Router image/template.

## Supported integrations for the first public release

| Capability | Supported integration |
| --- | --- |
| Discord model | Operator-owned bot / one self-hosted MediaOps deployment |
| Media provider | Emby |
| Request provider | Ombi |
| Watch Party | [Emby Watch Party by Oratorian](https://github.com/Oratorian/emby-watchparty) |
| Discord request history | Optional Discord Forum + MediaOps Ombi Discord Router |
| Deployment | Docker, Portainer/Compose, Unraid |

See [`docs/RELEASE_SCOPE_V1.md`](docs/RELEASE_SCOPE_V1.md) and [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).

## Discord commands

MediaOps currently registers **15 guild-scoped commands**.

| Command | Purpose |
| --- | --- |
| `/movie` | Search the movie library |
| `/tv` | Search the TV-series library |
| `/latest` | Show recently added media |
| `/request` | Search Ombi and submit a movie or TV request |
| `/watchparty` | Open the configured Watch Party service |
| `/watchparty-start` | Validate a Watch Party code and provide a join action |
| `/watchparty-status` | Check a Watch Party session |
| `/watchparty-schedule` | Schedule a Watch Party |
| `/watchpartyrandom` | Pick, reroll, choose, and schedule a random movie |
| `/watchparty-upcoming` | Show upcoming and active scheduled Watch Parties |
| `/watchparty-setup` | Admin: publish the bilingual Watch Party panel |
| `/mediaops-setup` | Admin: publish the user-facing command guide |
| `/mediaops-admin-setup` | Admin: publish the diagnostics guide |
| `/ping` | Admin: confirm that MediaOps is online |
| `/health` | Admin: show MediaOps/build/provider diagnostics |

`/ping`, `/health`, `/mediaops-setup`, `/mediaops-admin-setup`, and `/watchparty-setup` require Discord **Manage Server** permission for the invoking member by default. Diagnostic replies are ephemeral.

See [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md).

## Request workflow

With Ombi configured:

```text
/request
  -> search Ombi
  -> choose result
  -> confirm exact title/year
  -> create request as mapped Ombi user
  -> pending or auto-approved according to OMBI_AUTO_APPROVE
  -> persist request tracking
  -> notify requester when media becomes available
```

`OMBI_AUTO_APPROVE=false` leaves requests pending for an Ombi administrator. `OMBI_AUTO_APPROVE=true` asks Ombi to approve the newly created request automatically.

### Optional Discord Forum history

The companion Ombi Discord Router can maintain persistent request history in a Discord Forum with Movie/Series and Requested/Processing/Available/Failed/Denied tags.

The router is independently deployable and keeps its own `/data/media-threads.json` state. See [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) and [`addons/ombi-discord-router/README.md`](addons/ombi-discord-router/README.md).

## Watch Party lifecycle

MediaOps integrates with [Oratorian/emby-watchparty](https://github.com/Oratorian/emby-watchparty) as the supported Watch Party provider for v1.

```text
scheduled
  -> ready 30 minutes before start
  -> automatic room creation at scheduled time
  -> active
  -> expiry at scheduled time + Emby runtime + 45 minutes
```

If runtime information cannot be read, MediaOps uses a **4.5-hour safety fallback**. The organizer can cancel a tracked Watch Party even after its room has opened, and tracked scheduling/reminder/open-room messages are cleaned up by the lifecycle scheduler.

## Docker / Portainer quick start

Stable image:

```text
ghcr.io/miakkia/mediaops:latest
```

Optional router:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

Before creating the stack, create **your own Discord bot** using [`docs/DISCORD_BOT_SETUP.md`](docs/DISCORD_BOT_SETUP.md).

Example:

```yaml
services:
  mediaops:
    image: ghcr.io/miakkia/mediaops:latest
    container_name: MediaOps
    restart: unless-stopped
    environment:
      MEDIAOPS_BOT_NAME: MediaOps Bot
      MEDIAOPS_SERVER_NAME: My Media Server
      MEDIAOPS_DEMO_MODE: "false"
      MEDIA_PROVIDER: emby
      DISCORD_TOKEN: REPLACE_ME
      DISCORD_CLIENT_ID: REPLACE_ME
      DISCORD_GUILD_ID: REPLACE_ME
      EMBY_URL: http://YOUR-EMBY-HOST:8096
      EMBY_API_KEY: REPLACE_ME
      REQUEST_PROVIDER: ombi
      OMBI_URL: http://YOUR-OMBI-HOST:3579
      OMBI_API_KEY: REPLACE_ME
      OMBI_AUTO_APPROVE: "false"
      WATCHPARTY_URL: https://watch.example.com
      MEDIAOPS_LOCALE: en
      MEDIAOPS_TIMEZONE: America/Toronto
      MEDIAOPS_DATA_DIR: /data
    volumes:
      - ./mediaops-data:/data
```

`MEDIAOPS_DEMO_MODE=false` is the normal self-hosted behavior. For a public/demo deployment where Watch Party controls should remain visible without publishing the configured Watch Party URL into Discord, set it to `true`. See [`docs/DEMO_MODE.md`](docs/DEMO_MODE.md).

No privileged mode, Docker socket, media-library filesystem mount, or inbound MediaOps application port is required for current features.

### Register slash commands

After the container is running:

```bash
docker exec MediaOps npm run deploy-commands
```

The published runtime contains the compiled command deployment utility. `tsx`, Git, TypeScript, and a source checkout are not required on the host.

## Security posture

- Create and own your Discord bot/token for your v1 deployment.
- Do not expose the project Community demo bot for unrelated guilds.
- Do not reuse one v1 instance across unrelated customers with different backends.
- Do not commit Discord tokens, provider API keys, webhook credentials, or passwords.
- No privileged container mode.
- No Docker socket.
- No media-library mounts required.
- Watch Party creation should use a dedicated non-admin Emby account.
- The runtime uses a dedicated non-root user.
- Optional router webhook credentials remain isolated from the MediaOps bot token.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Unraid

The repository includes:

- [`templates/mediaops.xml`](templates/mediaops.xml)
- [`templates/ombi-discord-router.xml`](templates/ombi-discord-router.xml)
- [`ca_profile.xml`](ca_profile.xml)
- [`docs/UNRAID.md`](docs/UNRAID.md)

Before Community Apps submission, the templates must pass the current Unraid **Validate** and **Scan** workflow.

## Documentation

- [`docs/DISCORD_BOT_SETUP.md`](docs/DISCORD_BOT_SETUP.md) — create and secure your v1 Discord bot
- [`docs/DEMO_MODE.md`](docs/DEMO_MODE.md) — privacy-safe public/demo deployments
- [`docs/RELEASE_SCOPE_V1.md`](docs/RELEASE_SCOPE_V1.md) — release boundaries
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) — acceptance checklist
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) — current limitations
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) — Discord UX and capabilities
- [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) — optional Forum workflow
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker/GHCR deployment
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid deployment
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — future work including richer media discovery and multi-tenant architecture
- [`CHANGELOG.md`](CHANGELOG.md)

## License

MediaOps is distributed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE).
