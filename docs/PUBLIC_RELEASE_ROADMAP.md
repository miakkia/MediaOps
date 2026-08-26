# Public release roadmap

## Milestone A — close current Watch Party work

Goal: establish the currently validated Watch Party lifecycle as part of `main`.

- Final branch review.
- CI green.
- Merge to `main`.
- Verify development image built from merged commit.

## Milestone B — release hardening

Goal: make the existing feature set safe and reproducible for somebody who is not the maintainer.

- Review historical release-hardening work and port only still-relevant changes.
- Audit secrets, configuration examples, Docker permissions, persistent paths and logs.
- Normalize release/version metadata.
- Confirm GHCR publication policy for bot and companion router.
- Confirm Unraid templates and Compose examples use public images and safe defaults.

## Milestone C — documentation and clean install

Goal: prove that the repository itself is enough to deploy MediaOps.

- Consolidate installation instructions.
- Document Discord application/server setup.
- Document Emby, Ombi and router setup.
- Document Watch Party service requirements.
- Perform a clean-host installation from public images.
- Run the acceptance test in `RELEASE_READINESS.md`.

## Milestone D — first public development release

Goal: publish a usable baseline without pretending every planned integration is finished.

Suggested scope:

- Emby media lookup.
- Ombi requests and request Forum lifecycle.
- Watch Party scheduling, RSVP, reminders, automatic room opening and cancellation cleanup.
- Docker/Unraid deployment documentation.

Jellyfin, Plex and additional providers remain post-release development work.

## Milestone E — incremental public development

After the baseline release, add integrations and UX improvements in small branches with tests and release notes. Preserve the public baseline rather than holding the first release until every long-term feature exists.
