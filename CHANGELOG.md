# Changelog

All notable changes to MediaOps are documented here.

## [Unreleased]

Future changes will be documented here before the next release.

## [1.2.1] - 2026-09-15

### Security maintenance release

MediaOps 1.2.1 packages the September 2026 security maintenance work into a visible patch release so users can understand what changed without reading implementation pull requests.

### Added

- **Jellyfin media provider** selectable with `MEDIA_PROVIDER=jellyfin`.
- **Seerr request provider** selectable with `REQUEST_PROVIDER=seerr`.
- Provider-aware `/health` diagnostics and MediaOps Discord Router `/seerr` webhook adapter.
- Staged provider webhook authentication using a configurable `X-MediaOps-Webhook-Token` header, with independent `off`, `optional`, and `required` policies for Ombi and Seerr.
- 256 KiB default provider webhook body limit to reduce oversized-request abuse.
- Python dependency vulnerability auditing (`pip-audit`) in CI alongside the existing production `npm audit` gate.

### Changed

- MediaOps Docker build/runtime moves from Node 22 to **Node 24 LTS**.
- Router base is pinned to **Python 3.13.15** rather than a floating Python 3.13 tag.
- Router runtime dependencies are refreshed to Flask 3.1.3, Requests 2.34.2, urllib3 2.7+ and Gunicorn 26.2.0.
- Router Docker runtime explicitly uses unprivileged UID/GID `1000:1000`.
- Provider configuration remains lazy/provider-specific; unselected providers do not require credentials.
- Ombi and Seerr approval behavior remains owned by each provider's configured user/role policy.
- The historical Ombi Discord Router is generalized as **MediaOps Discord Router** while retaining the existing GHCR image/path for upgrade compatibility.
- Router state handling continues to use one Gunicorn process with threaded concurrency to protect its small file-backed thread index.

### Security

- Node production dependency audit reported zero known vulnerabilities at the September 2026 maintenance check.
- Provider webhook authentication uses constant-time secret comparison and does not require secrets in URL query strings.
- Seerr deployments can migrate to `SEERR_WEBHOOK_AUTH=required` when the configured webhook path can supply the matching custom authentication header.
- Ombi does not natively provide the custom header required by this router authentication mechanism, so Ombi remains **private-network-first** and should normally keep `OMBI_WEBHOOK_AUTH=off`.
- `/ombi` and `/seerr` remain backward-compatible by default (`off`) so an image update cannot silently break existing provider notifications.
- Router remains non-root/read-only except for explicit persistent `/data`, with dropped capabilities and `no-new-privileges` in hardened examples.
- Discord bot token and webhook/provider secrets are runtime-only and must not be committed or logged.

### Tested

- CI typecheck, build and the existing 100-test application suite passed during the security refresh.
- Production Node dependencies and Router Python dependencies passed their vulnerability audit gates during release preparation.
- The audit gate correctly rejected an invalid Gunicorn version pin; it was corrected to the published 26.2.0 release before release preparation.
- Real Jellyfin + Seerr integration and Seerr webhook → Router → Discord Forum flow were previously exercised on a private Docker/Portainer lab.

### Upgrade notes

- Existing Ombi/Seerr webhooks continue working immediately after the image update because provider authentication defaults to `off`.
- Keep router port 8080 private; authentication is defense-in-depth, not a reason to expose it publicly.
- For Seerr, use a long random token and the configured custom webhook header where supported, test with `SEERR_WEBHOOK_AUTH=optional`, then switch to `required`.
- For Ombi, keep Ombi and the Router on the private Docker network and leave `OMBI_WEBHOOK_AUTH=off` unless a trusted internal ingress deliberately adds the authentication header.
- Existing Emby + Ombi deployments do not need to migrate providers.

### Known scope

- Jellyfin SyncPlay orchestration is not included yet.
- Plex is not included yet.
- The Emby Watch Party integration remains the current Watch Party implementation.
- Existing Emby + Ombi deployments remain supported; migration to Jellyfin/Seerr is optional.

## [1.0.0] - 2026-08-30

First stable public self-hosted MediaOps baseline.

### Highlights

- Discord Rich Media Cards for `/movie`, `/tv`, `/latest`, and `/request`.
- Emby media provider and Ombi request provider.
- Persistent request tracking and Discord availability notifications.
- Optional Discord Forum request history through the companion router.
- Watch Party scheduling, RSVP, reminders, automatic room creation, random movie selection, lifecycle cleanup, and organizer controls.
- EN/FR foundation, Docker/GHCR distribution, Unraid templates, and security-first non-root runtime.

## Development history

Git history and pull requests remain the source of truth for individual implementation commits and reviews.
