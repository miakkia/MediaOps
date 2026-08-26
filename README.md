# MediaOps

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a media server, request provider, and Watch Party service so members can discover media, submit requests, coordinate Watch Parties, and receive useful status updates without memorizing a large command set.

> **Release status:** first public release candidate. Emby is the supported media provider, Ombi is the supported request provider, and Emby Watch Party is the supported Watch Party integration for this release. Jellyfin, Plex, and additional provider adapters are planned after the initial public release.

## What MediaOps provides

- Emby movie and TV-series search;
- recently added media discovery;
- Ombi movie/TV request submission with requester attribution and optional auto-approval;
- persistent request tracking and one-time Discord DM notification when requested media becomes available;
- optional Discord Forum request history through the companion Ombi Discord Router;
- Watch Party scheduling, RSVP, T-15 reminder, automatic room creation, direct join links, organizer cancellation, lifecycle cleanup, and restart-safe persistent state;
- library-wide random movie selection and guided scheduling;
- `/mediaops-setup` and `/watchparty-setup` persistent self-service guides so members do not need to discover every slash command manually;
- administrator diagnostics through `/ping`, `/health`, and `/mediaops-admin-setup`;
- configurable public branding through `MEDIAOPS_BOT_NAME` and `MEDIAOPS_SERVER_NAME`;
- EN/FR internationalization foundation and bilingual public Watch Party guidance;
- Docker/GHCR distribution with a non-root runtime and persistent `/data` storage;
- Unraid templates and Community Apps metadata for the main bot and optional router.

## Supported integrations for the first public release

| Capability | Supported integration |
| --- | --- |
| Media provider | Emby |
| Request provider | Ombi |
| Watch Party | Emby Watch Party |
| Discord request history | Optional Discord Forum + MediaOps Ombi Discord Router |
| Deployment | Docker, Portainer/Compose, Unraid |

See [`docs/RELEASE_SCOPE_V1.md`](docs/RELEASE_SCOPE_V1.md) and [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) before deployment.

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
| `/watchparty-setup` | Admin: publish the bilingual Watch Party self-service panel |
| `/mediaops-setup` | Admin: publish the user-facing MediaOps command guide |
| `/mediaops-admin-setup` | Admin: publish the diagnostics guide |
| `/ping` | Admin: confirm that MediaOps is online |
| `/health` | Admin: show MediaOps/build/provider diagnostics |

`/ping`, `/health`, `/mediaops-setup`, `/mediaops-admin-setup`, and `/watchparty-setup` require Discord **Manage Server** permission by default. Diagnostic replies are ephemeral.

See [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) for detailed interaction flows.

## Architecture

MediaOps is a TypeScript/Node.js Discord application using `discord.js`. Provider-specific media and request logic is isolated behind common interfaces.

```text
Discord
  |
  +--> MediaProvider --> Emby adapter --> Emby API
  |
  +--> RequestProvider --> Ombi adapter --> Ombi API
  |
  +--> Watch Party service --> Emby Watch Party API
```

Watch Party integration remains separate from media-library access because synchronized playback and library discovery are not necessarily provided by the same service.

See [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) and [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md).

## Request workflow

With Ombi configured, `/request` searches for a movie or TV series and presents requestable results through Discord buttons.

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

`OMBI_AUTO_APPROVE=false` leaves requests pending for an Ombi administrator. `OMBI_AUTO_APPROVE=true` asks Ombi to approve the newly created request automatically. Request attribution remains independent of approval behavior.

### Optional request Forum

A Discord Forum can be used as persistent searchable request history when the companion Ombi Discord Router is enabled. One Forum post represents one media item; the Movie/Series tag remains while the request-state tag moves through Requested, Processing, Available, Failed, or Denied.

Completed posts are retained rather than deleted. MediaOps locks terminal posts and removes them from the active Forum view according to Discord thread behavior.

See [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) and [`addons/ombi-discord-router/README.md`](addons/ombi-discord-router/README.md).

## Watch Party lifecycle

Scheduled Watch Parties use persistent state under `/data`.

```text
scheduled
  -> ready 30 minutes before start
  -> automatic room creation at scheduled time
  -> active
  -> expiry at scheduled time + Emby runtime + 45 minutes
```

If Emby runtime information cannot be read, MediaOps uses a **4.5-hour safety fallback**. The organizer can cancel a tracked Watch Party, including after its room has opened. MediaOps tracks the scheduled announcement, reminder, and open-room announcement so lifecycle cleanup can remove those messages when appropriate.

Direct room links use:

```text
https://watch.example.com/party/ABCDE
```

## Docker / Portainer quick start

Stable image:

```text
ghcr.io/miakkia/mediaops:latest
```

Optional router:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

Minimum deployment pattern:

```yaml
services:
  mediaops:
    image: ghcr.io/miakkia/mediaops:latest
    container_name: MediaOps
    restart: unless-stopped
    environment:
      MEDIAOPS_BOT_NAME: MediaOps Bot
      MEDIAOPS_SERVER_NAME: My Media Server
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

Additional Watch Party host credentials and optional Forum integration settings are documented in [`docs/DOCKER.md`](docs/DOCKER.md), [`docs/UNRAID.md`](docs/UNRAID.md), and `.env.example`.

No privileged mode, Docker socket, media-library filesystem mount, or inbound MediaOps application port is required for current features.

### Register Discord commands

After the container is running, and again after an update that changes command definitions:

```bash
docker exec MediaOps npm run deploy-commands
```

The published runtime image contains the compiled command deployment utility. It reuses `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID` from the container environment; `tsx`, Git, TypeScript, and a source checkout are not required on the host.

A successful deployment reports the 15 registered command names.

## Unraid

The repository includes:

- [`templates/mediaops.xml`](templates/mediaops.xml) — main Unraid Docker template;
- [`templates/ombi-discord-router.xml`](templates/ombi-discord-router.xml) — optional companion template;
- [`ca_profile.xml`](ca_profile.xml) — Community Apps repository profile;
- [`docs/UNRAID.md`](docs/UNRAID.md) — installation/update/validation procedure.

Before Community Apps submission, the templates must pass the current Unraid **Validate** and **Scan** workflow.

## Persistent data

MediaOps stores application-owned runtime state under `MEDIAOPS_DATA_DIR`, normally `/data` in Docker/Unraid. Important files currently include:

```text
/data/watchparties.json
/data/requests.json
```

The companion router stores its own correlation state under `/data/media-threads.json`.

Keep these directories on persistent storage when updating or recreating containers.

## Security posture

MediaOps is designed around narrow API access rather than broad host access:

- no secrets committed to Git;
- no media-library filesystem mounts required;
- no privileged container mode;
- no Docker socket access;
- provider requests use bounded timeouts and validated responses;
- request selections are user-bound and time-limited;
- optional Forum automation is configuration-scoped and fail-closed;
- Watch Party creation uses a dedicated non-admin Emby account;
- the main Docker runtime uses a dedicated non-root user;
- router webhook credentials remain isolated from the MediaOps bot token;
- CI performs dependency audit, TypeScript typecheck, automated tests, builds, and container validation before publication.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Development validation

```bash
npm install
npm audit --omit=dev --audit-level=high
npm run typecheck
npm test
npm run build
```

For source-tree development, command registration can be run with:

```bash
npm run deploy-commands:dev
```

Production/container deployment uses `npm run deploy-commands` instead.

## Documentation

- [`docs/RELEASE_SCOPE_V1.md`](docs/RELEASE_SCOPE_V1.md) — first public release boundaries
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) — release acceptance checklist
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) — current limitations
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) — Discord capabilities and UX
- [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) — optional request Forum integration
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker/GHCR deployment
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid deployment
- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) — provider boundaries
- [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) — trust boundaries and security goals
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned work
- [`CHANGELOG.md`](CHANGELOG.md) — notable changes

## License

MediaOps is distributed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE).
