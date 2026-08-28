# Public release roadmap

MediaOps has completed the main v1 feature, hardening, clean-install, and presentation work. The project is now in the final publication stage for the first public self-hosted release.

## Completed — v1 feature baseline

The current v1 baseline includes:

- Emby movie/TV search and recently-added discovery;
- Ombi request submission and persistent request tracking;
- optional Discord Forum request lifecycle through the companion Ombi Discord Router;
- Watch Party scheduling, RSVP, T-15 reminders, automatic room opening, direct join links, cancellation, cleanup, and restart-safe state;
- library-wide random movie selection and guided scheduling;
- 15 guild-scoped Discord commands and persistent setup/help panels;
- EN/FR foundations;
- Docker/GHCR, Portainer/Compose, and Unraid deployment paths.

## Completed — release hardening

- Self-hosted/single-tenant v1 deployment model documented.
- Operator-owned Discord application/bot model documented.
- Production containers run non-root and require no privileged mode, Docker socket, media-library mounts, or inbound MediaOps application port.
- Runtime command registration works from the published container.
- Main MediaOps and companion router images publish through CI.
- Persistent state paths and update/recreation behavior are documented.
- Watch Party scheduling uses `MEDIAOPS_TIMEZONE` rather than the container process timezone.
- Initial RSVP announcements can notify the channel with `@here` when the bot has the required mention permission.

## Completed — clean-install validation

A clean deployment on a separate host validated the operator-owned Discord bot workflow, command registration, Emby/Ombi connectivity, request creation, setup panels, optional router/Forum integration, Watch Party scheduling, timezone handling, and the current `:latest` image.

The final merged v1 baseline passed automated typecheck, application tests, dependency audit, production build, router compile/build, and container publication. See [`RELEASE_READINESS.md`](RELEASE_READINESS.md) for the detailed release gate.

## Current — public presentation and publication

Before the v1.0.0 tag/public announcement:

1. finish the final documentation consistency pass;
2. keep screenshots sanitized and representative of real v1 behavior;
3. perform the final repository secret/privacy review, including history where practical;
4. make the repository public when ready;
5. verify public README/icon/template/raw links and public GHCR pullability;
6. run the current Unraid Community Apps Validate and Scan workflow and resolve reported issues;
7. add/verify the public support path used by the Unraid templates;
8. tag and publish v1.0.0 only after those public-facing checks are green.

## Post-v1 development

After the baseline release, development should continue in small reviewed branches with tests and release notes. Planned directions include:

- richer interactive `/movie` and `/tv` media details;
- Jellyfin support;
- Plex support;
- additional request providers;
- broader internationalization;
- additional Watch Party administration and UX polish;
- optional multi-tenant/universal-bot architecture only after explicit tenant isolation and secure private-backend connectivity are designed and reviewed.

The self-hosted edition remains a first-class deployment model.
