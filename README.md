# MediaOps

MediaOps is an open-source Discord companion for self-hosted media communities. It connects Discord to a media server and provides media discovery, Watch Party coordination, scheduling, RSVP, and community-facing controls without requiring users to learn a large command set.

> **Project status:** active development. Emby is the current supported media provider. The `MediaProvider` abstraction is implemented, with Jellyfin and Plex planned as future adapters.

## What MediaOps does today

MediaOps currently provides:

- Discord bot health and media-server connectivity checks;
- movie and TV-series search;
- recently added movie and series discovery;
- library-wide random movie selection;
- title matching using display title, original title, and sort title where available;
- Watch Party links and code validation;
- scheduled Watch Party announcements;
- Going / Not Going RSVP controls;
- organizer-only cancellation;
- guided scheduling with Discord modals;
- a bilingual EN/FR public Watch Party setup panel;
- persistent Watch Party runtime state;
- a provider-independent media interface with Emby as the first adapter;
- a production Docker build published through GitHub Container Registry (GHCR);
- validated deployment on Unraid without copying the source repository to the server.

## Current Discord commands

| Command | Purpose |
| --- | --- |
| `/ping` | Confirm that MediaOps is online |
| `/health` | Check MediaOps and media-server connectivity |
| `/movie` | Search the movie library |
| `/tv` | Search the TV-series library |
| `/latest` | Show recently added media |
| `/watchparty` | Open the configured Watch Party service |
| `/watchparty-start` | Validate a Watch Party code and provide a join action |
| `/watchparty-status` | Check a Watch Party session |
| `/watchparty-schedule` | Schedule a Watch Party |
| `/watchpartyrandom` | Pick, reroll, choose, and schedule a random movie |
| `/watchparty-setup` | Publish the bilingual self-service Watch Party panel |

See [`docs/DISCORD_FEATURES.md`](docs/DISCORD_FEATURES.md) for detailed interaction flows.

## Architecture

MediaOps is a TypeScript/Node.js Discord application using `discord.js`. Provider-specific media logic is isolated behind a common `MediaProvider` interface.

```text
Discord / Watch Party workflows
            |
            v
       MediaProvider
            |
       Emby adapter
            |
         Emby API
```

The application layer no longer depends directly on Emby-specific functions. Future Jellyfin and Plex adapters are intended to implement the same media contract without rewriting normal Discord workflows.

Watch Party integrations remain a separate concern because media-library access and synchronized playback are not necessarily provided by the same API or service.

See [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) and [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md).

## Docker and GHCR

MediaOps uses a multi-stage Docker build and publishes images to GHCR.

Stable/default image after this branch is merged:

```text
ghcr.io/miakkia/mediaops:latest
```

Development builds from `feat/docker-media-provider` use:

```text
ghcr.io/miakkia/mediaops:dev
```

Tagged releases such as `v1.0.0` publish corresponding version tags in GHCR. The container runs compiled JavaScript as a dedicated non-root user, requires no source checkout on the deployment host, currently exposes no inbound ports, and stores persistent state under `/data`.

See:

- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker/GHCR deployment and configuration
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid installation and update procedure
- [`templates/mediaops.xml`](templates/mediaops.xml) — Unraid Docker template
- [`ca_profile.xml`](ca_profile.xml) — Community Apps repository profile

## Quick Unraid configuration

Recommended settings:

```text
Repository: ghcr.io/miakkia/mediaops:latest
Network:    bridge
Privileged: off
Appdata:    /mnt/user/appdata/mediaops -> /data
```

Required configuration currently includes:

```env
MEDIA_PROVIDER=emby
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
EMBY_URL=
EMBY_API_KEY=
WATCHPARTY_URL=
MEDIAOPS_DATA_DIR=/data
```

The included Unraid template predefines these fields so installation is a fill-in-the-required-values workflow rather than manual container construction.

Never commit or publish real Discord tokens or media-server API keys.

## Security posture

MediaOps is designed to require narrow API access rather than broad host access.

Key principles:

- no secrets committed to Git;
- no media-library filesystem mounts required for normal provider access;
- no privileged container mode;
- no Docker socket access;
- provider responses and Discord interaction input are validated;
- provider requests use bounded timeouts;
- runtime state is kept outside source control;
- the Docker runtime uses a dedicated non-root user.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

## Local development

Install dependencies and run the development process:

```bash
npm install
npm run dev
```

Useful validation/build commands:

```bash
npm run typecheck
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
- [`docs/ARCHITECTURE_PRINCIPLES.md`](docs/ARCHITECTURE_PRINCIPLES.md) — architectural rules
- [`docs/PROVIDER_MODEL.md`](docs/PROVIDER_MODEL.md) — implemented provider boundary and future adapters
- [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) — trust boundaries and security goals
- [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md) — engineering conventions
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker and GHCR deployment
- [`docs/UNRAID.md`](docs/UNRAID.md) — Unraid deployment
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned work and distribution goals
- [`CHANGELOG.md`](CHANGELOG.md) — notable project changes

## Community Apps direction

The repository now includes the metadata expected by the current Unraid Community Apps starter format: a root `ca_profile.xml`, one Docker template under `templates/`, a raw-hosted icon, project/readme links, an OSI-approved GPLv3 license, and a GHCR image intended for public pulls. Community Apps submission still requires running Unraid's Validate and Scan flow before publication.

## License

MediaOps is distributed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE) for the full terms.
