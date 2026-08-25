# MediaOps

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a media server, request provider, and Watch Party service so normal users can discover media, submit requests, coordinate Watch Parties, and receive useful status updates without learning a large command set.

> **Project status:** active development / pre-release. Emby is the current supported media provider, Ombi is the current supported request provider, and Emby Watch Party is the current Watch Party integration. The provider abstractions are designed so Jellyfin, Plex, and additional request backends can be added later without rewriting normal Discord workflows.

## What MediaOps does today

MediaOps currently provides:

- rich Discord health diagnostics for MediaOps, Emby, and the configured request provider;
- movie and TV-series search;
- recently added movie and series discovery;
- library-wide random movie selection;
- title matching using display title, original title, and sort title where available;
- Ombi movie and TV request search and submission through `/request`;
- configurable `OMBI_AUTO_APPROVE=true|false` behavior;
- Discord-to-Ombi requester mapping so requests can be attributed to the real Ombi user instead of the API identity;
- secure, short-lived, user-bound request selection tokens with confirmation before submission;
- persistent request tracking under `/data/requests.json`;
- automatic request availability checks and one-time Discord DM notification when requested media becomes available;
- optional Discord Forum request history synchronized through the companion Ombi Discord Router;
- automatic Forum status-tag updates while preserving Movie/Series media type;
- completed Forum requests retained as history while being locked and removed from the active Forum view;
- Watch Party links and code validation;
- authenticated Discord-created Watch Party rooms using a dedicated non-admin Emby account;
- scheduled Watch Party announcements;
- Going / Not Going RSVP controls;
- organizer-only cancellation before a scheduled party starts;
- guided scheduling with Discord modals;
- a bilingual EN/FR public Watch Party setup panel;
- automatic Watch Party room creation at the scheduled start time;
- direct `/party/CODE` join links in Watch Party announcements;
- persistent Watch Party runtime state;
- automatic Watch Party lifecycle refresh, reminder delivery, history retention, and cleanup;
- upcoming Watch Party discovery;
- persistent one-time Watch Party reminders before scheduled start time;
- runtime-aware active Watch Party expiry using the Emby movie runtime plus a 45-minute grace period;
- a six-hour safety fallback when Emby runtime information is unavailable;
- a provider-independent media interface with Emby as the first adapter;
- a provider-independent request interface with Ombi as the first adapter;
- automated dependency audit, TypeScript typecheck, unit tests, and build validation in CI;
- production and development Docker images published through GitHub Container Registry (GHCR);
- validated deployment on Unraid without copying the source repository to the server.

## Current Discord commands

| Command | Purpose |
| --- | --- |
| `/ping` | Confirm that MediaOps is online |
| `/health` | Show MediaOps, build, Emby, and request-provider diagnostics |
| `/movie` | Search the movie library |
| `/tv` | Search the TV-series library |
| `/latest` | Show recently added media |
| `/request` | Search Ombi and submit a movie or TV request |
| `/watchparty` | Open the configured Watch Party service |
| `/watchparty-start` | Validate a Watch Party code and provide a join action |
| `/watchparty-status` | Check a Watch Party session |
| `/watchparty-schedule` | Schedule a Watch Party |
| `/watchpartyrandom` | Pick, reroll, choose, and schedule a random movie |
| `/watchparty-setup` | Publish the bilingual self-service Watch Party panel |
| `/watchparty-upcoming` | Show upcoming and active scheduled Watch Parties |

See [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) for detailed interaction flows.

## Architecture

MediaOps is a TypeScript/Node.js Discord application using `discord.js`. Provider-specific media and request logic are isolated behind common interfaces.

```text
Discord
  |
  +--> MediaProvider --> Emby adapter --> Emby API
  |
  +--> RequestProvider --> Ombi adapter --> Ombi API
  |
  +--> Watch Party service --> Emby Watch Party API
```

The application layer does not need to know provider-specific implementation details for normal media discovery or request workflows. Future Jellyfin, Plex, and additional request-provider adapters are intended to implement the same contracts without rewriting the Discord UX.

Watch Party integrations remain a separate concern because media-library access and synchronized playback are not necessarily provided by the same API or service.

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

`OMBI_AUTO_APPROVE=false` leaves requests pending for an Ombi administrator. `OMBI_AUTO_APPROVE=true` asks Ombi to approve the newly created request automatically. Request attribution and auto-approval are separate behaviors: enabling or disabling auto-approval does not change which Ombi user is recorded as the requester when a Discord-to-Ombi mapping exists.

### Optional request Forum

A Discord Forum can be used as a persistent, searchable request history when the companion Ombi Discord Router is enabled. One Forum post represents one media item; the Movie/Series tag remains while the request-state tag is synchronized through Requested, Processing, Available, Failed, or Denied.

Completed posts are retained rather than deleted. MediaOps locks terminal posts and removes them from the active Forum view according to Discord thread behavior.

The repository includes a ready-to-configure companion service under [`addons/ombi-discord-router/`](addons/ombi-discord-router/). Its examples contain placeholders only; webhook credentials, Forum/tag IDs, and infrastructure addresses are supplied at deployment time.

The companion image is published separately as:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

Development branches publish `:dev` and commit-SHA tags through the same GitHub Actions workflow.

See [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) for setup, permissions, lifecycle, and security behavior.

## Watch Party lifecycle

Scheduled Watch Parties use persistent state under `/data`.

Typical lifecycle:

```text
scheduled
  -> ready 30 minutes before start
  -> automatic room creation at scheduled time
  -> active
  -> expiry at scheduled time + Emby runtime + 45 minutes
```

When the Emby runtime cannot be read, MediaOps uses a six-hour safety expiry instead. MediaOps also keeps scheduled-party history for the configured retention period and periodically removes old terminal records.

Direct Watch Party announcements use the room path format:

```text
https://watch.example.com/party/ABCDE
```

rather than routing users back through the generic Watch Party landing page.

## Docker and GHCR

MediaOps publishes two images to GHCR.

Main bot:

```text
ghcr.io/miakkia/mediaops:latest
ghcr.io/miakkia/mediaops:dev
```

Optional Ombi Discord Router companion:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
ghcr.io/miakkia/mediaops-ombi-discord-router:dev
```

Tagged releases publish matching semantic-version tags for both packages. Feature/fix/chore/hardening branches publish `dev` and commit-SHA tags. The main MediaOps container runs compiled JavaScript as a dedicated non-root user and stores persistent application state under `/data`; the companion router uses its own hardened runtime and `/data/media-threads.json` index.

See:

- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker/GHCR deployment and configuration
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid installation and update procedure
- [`templates/mediaops.xml`](templates/mediaops.xml) — main Unraid Docker template
- [`templates/ombi-discord-router.xml`](templates/ombi-discord-router.xml) — companion router Unraid template
- [`ca_profile.xml`](ca_profile.xml) — Community Apps repository profile

## Quick Unraid configuration

Recommended MediaOps settings:

```text
Repository: ghcr.io/miakkia/mediaops:latest
Network:    bridge
Privileged: off
Appdata:    /mnt/user/appdata/mediaops -> /data
```

For the optional request Forum, install the companion router template, create a user-defined Docker network such as `mediaops-backend`, attach Ombi and the router to it, and configure Ombi to call:

```text
http://ombi-discord-router:8080/ombi
```

Core MediaOps configuration:

```env
MEDIA_PROVIDER=emby
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
EMBY_URL=
EMBY_API_KEY=

REQUEST_PROVIDER=ombi
OMBI_URL=
OMBI_API_KEY=
OMBI_AUTO_APPROVE=false

# Optional Discord Forum request synchronization
MEDIA_REQUESTS_FORUM_ID=
MEDIA_REQUESTS_WEBHOOK_ID=
MEDIA_TAG_REQUESTED=
MEDIA_TAG_PROCESSING=
MEDIA_TAG_AVAILABLE=
MEDIA_TAG_FAILED=
MEDIA_TAG_DENIED=
MEDIA_TAG_MOVIE=
MEDIA_TAG_SERIES=

WATCHPARTY_URL=
WATCHPARTY_INTERNAL_URL=
WATCHPARTY_EMBY_USER=
WATCHPARTY_EMBY_PASSWORD=
WATCHPARTY_RETENTION_DAYS=30

MEDIAOPS_LOCALE=en
MEDIAOPS_TIMEZONE=America/Toronto
MEDIAOPS_DATA_DIR=/data
```

The included Unraid templates predefine these fields so installation is a fill-in-the-required-values workflow rather than manual container construction.

Never commit or publish real Discord tokens, passwords, webhook URLs/tokens, or media/request-provider API keys.

## Persistent data

MediaOps currently stores application-owned runtime state under `MEDIAOPS_DATA_DIR`, normally `/data` in Docker/Unraid.

Important files include:

```text
/data/watchparties.json
/data/requests.json
```

The companion router stores its own correlation state under:

```text
/data/media-threads.json
```

These files should live on persistent appdata storage and should not be baked into container images.

## Security posture

MediaOps is designed to require narrow API access rather than broad host access.

Key principles:

- no secrets committed to Git;
- no media-library filesystem mounts required for normal provider access;
- no privileged container mode;
- no Docker socket access;
- provider responses and Discord interaction input are validated;
- request-selection actions are user-bound and time-limited;
- optional Forum automation is configuration-scoped and fail-closed;
- completed Forum request states are treated as terminal;
- provider requests use bounded timeouts;
- runtime state is kept outside source control;
- Watch Party creation uses a dedicated non-admin Emby account;
- the Docker runtime uses a dedicated non-root user;
- router webhook credentials stay isolated from the MediaOps bot token;
- CI runs a production dependency audit, TypeScript typecheck, automated tests, application build, companion-router syntax validation, and companion image build before publishing validated changes.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Local development

Install dependencies and run the development process:

```bash
npm install
npm run dev
```

Useful validation/build commands:

```bash
npm audit --omit=dev --audit-level=high
npm run typecheck
npm test
npm run build
```

Production containers run the compiled build with:

```bash
npm start
```

Use `.env.example` as a configuration reference. Never commit a real `.env` file.

## Documentation

- [`docs/VISION.md`](docs/VISION.md) — product direction and long-term identity
- [`docs/PRODUCT_SCOPE.md`](docs/PRODUCT_SCOPE.md) — product boundaries
- [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) — current Discord capabilities and UX
- [`docs/REQUEST_FORUM.md`](docs/REQUEST_FORUM.md) — optional Ombi-to-Discord Forum request history
- [`addons/ombi-discord-router/README.md`](addons/ombi-discord-router/README.md) — companion Ombi webhook-to-Forum adapter
- [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md) — architectural rules
- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) — provider boundaries and future adapters
- [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) — trust boundaries and security goals
- [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md) — engineering conventions
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker and GHCR deployment
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid deployment
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned work and distribution goals
- [`CHANGELOG.md`](CHANGELOG.md) — notable project changes

## Community Apps direction

The repository includes the metadata expected by the current Unraid Community Apps starter format: a root `ca_profile.xml`, main and companion Docker templates under `templates/`, raw-hosted icons, project/readme links, an OSI-approved GPLv3 license, and GHCR images intended for public pulls. Community Apps submission still requires running Unraid's Validate and Scan flow before publication.

## License

MediaOps is distributed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE) for the full terms.
