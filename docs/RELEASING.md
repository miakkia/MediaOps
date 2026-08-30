# MediaOps Release Model

MediaOps uses a simple Semantic Versioning release model while keeping `main` available as the rolling stable branch.

## Version policy

Versions use `MAJOR.MINOR.PATCH`.

- **MAJOR** — reserved for intentionally incompatible/breaking platform changes.
- **MINOR** — a meaningful new MediaOps capability or integration, such as a new request provider, media provider, or major Watch Party feature set.
- **PATCH** — fixes, hardening, reliability improvements, or small refinements that do not represent a new major feature block.

Minor versions do not need to be consecutive. For example, MediaOps may move from `v1.0.0` directly to `v1.2.0` when that numbering is intentionally chosen for the next major feature milestone.

Examples:

- `v1.0.0` — first stable public baseline;
- `v1.0.1` — fixes/refinements to the v1.0 baseline;
- `v1.2.0` — next major feature milestone;
- `v1.2.1` — fixes/refinements to v1.2;
- `v1.3.0` — another major feature milestone.

## Branch and image channels

MediaOps deliberately separates rolling builds from immutable releases.

| Source | Build channel | GHCR tags |
| --- | --- | --- |
| `feat/**`, `fix/**`, `chore/**`, `harden/**` | `dev` | `dev`, SHA |
| `main` | `latest` | `latest`, SHA |
| tag `vX.Y.Z` | `release` | `release`, `X.Y.Z`, `X.Y`, SHA |

A release-tag build does **not** move the `latest` tag. `latest` is controlled only by `main`. This prevents creating or re-running an older release tag from accidentally rolling the normal `latest` channel backward.

`release` is the most recently published official release. `X.Y.Z` is immutable by release policy and is the preferred tag for exact reproducibility. `X.Y` follows the newest patch in that minor release line.

## Release safety gates

Every release tag passes the normal CI gates before anything is published:

1. `package.json` and both package versions recorded in `package-lock.json` must match;
2. tag `vX.Y.Z` must exactly match package version `X.Y.Z`;
3. dependencies install with `npm ci`;
4. production dependency audit passes at the configured severity gate;
5. TypeScript typecheck passes;
6. automated tests pass;
7. application build passes;
8. Ombi Discord Router syntax validation and container build pass;
9. MediaOps and router images are published to GHCR;
10. only after successful image publication is the GitHub Release created.

If any gate fails, the GitHub Release is not published.

## Preparing a release

Before creating `vX.Y.Z`:

1. choose the release version;
2. update `package.json` and `package-lock.json` to the same version;
3. move completed changelog entries from `Unreleased` into a dated `## [X.Y.Z] - YYYY-MM-DD` section;
4. run/review CI through a normal pull request;
5. merge the release-preparation PR into `main`;
6. create the Git tag `vX.Y.Z` on the exact approved `main` commit and push it.

The tag push triggers the release workflow automatically. Do not create a GitHub Release first and then try to make the code match it afterward.

## Runtime identification

`/health` reports three separate pieces of information:

- **Version** — the package semantic version;
- **Channel** — `dev`, `latest`, or `release` according to the build source;
- **SHA** — the exact Git commit used to build the running image.

For an official release image, the release workflow guarantees that the Git tag and package version match. The SHA remains available for exact build identification.

## Release immutability

Published version tags should never be moved or reused. If a released version needs a fix, create the next patch version instead of replacing the existing tag. For example, fix `v1.2.0` with `v1.2.1`; do not retag a different commit as `v1.2.0`.
