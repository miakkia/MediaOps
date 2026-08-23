# Media Request Forum

MediaOps can maintain a Discord Forum as a searchable request history when Ombi notifications are delivered through the companion Ombi Discord Router.

This feature is optional. MediaOps continues to support normal `/request` operation when Forum synchronization is not configured.

## User-visible workflow

A request is represented by one Forum post per media item. The post keeps its history while its tags reflect the current request state.

Typical lifecycle:

```text
Movie or Series + Requested
        -> Movie or Series + Processing
        -> Movie or Series + Available / Failed / Denied
        -> completed post is locked and removed from the active Forum view
```

Terminal posts remain part of Discord history and can still be found through Forum/search features according to Discord behavior and server permissions.

## Required Forum tags

Create one tag for each media type:

- `Movie`
- `Series`

Create one tag for each supported request state:

- `Requested`
- `Processing`
- `Available`
- `Failed`
- `Denied`

The visible tag names and colors are administrator choices. MediaOps uses Discord tag IDs, not display names.

## Configuration

Forum synchronization is enabled only when all of these values are configured:

```env
MEDIA_REQUESTS_FORUM_ID=
MEDIA_REQUESTS_WEBHOOK_ID=
MEDIA_TAG_REQUESTED=
MEDIA_TAG_PROCESSING=
MEDIA_TAG_AVAILABLE=
MEDIA_TAG_FAILED=
MEDIA_TAG_DENIED=
MEDIA_TAG_MOVIE=
MEDIA_TAG_SERIES=
```

`MEDIA_REQUESTS_WEBHOOK_ID` is the Discord webhook ID only. Do not put a webhook URL or webhook token in MediaOps.

The companion router owns the webhook credential and creates/posts Forum messages. MediaOps only needs the non-secret webhook ID so it can identify the expected integration source.

## Discord bot requirements

When Forum synchronization is enabled, the Discord application must have the gateway capability required to receive the structured webhook message data used by the integration. Enable only the intents required by the configured MediaOps features.

The bot also needs permission in the configured Forum to view the channel and manage the request threads/tags it is expected to maintain. Avoid server-wide Administrator permission when narrower channel/role permissions are sufficient.

## Safety behavior

Forum automation is intentionally scoped to the configured integration and configured Forum. MediaOps does not treat normal Discord message text as an instruction to change request state.

Configuration is fail-closed: incomplete Forum configuration disables synchronization rather than falling back to broad behavior.

Request state is monotonic. Completed states are terminal and are not automatically rewritten by later Forum messages.

These safeguards are part of the application boundary, but administrators should still apply Discord least-privilege permissions and protect bot/webhook credentials.

## Operational notes

- `Requested` and `Processing` posts remain active.
- `Available`, `Failed`, and `Denied` are terminal states.
- Terminal posts are locked before they are removed from the active Forum view.
- Existing Forum history is preserved; MediaOps does not delete completed request posts.
- The router and MediaOps should use the same Forum and tag IDs.
- Rotating/recreating a Discord webhook changes its webhook ID; update `MEDIA_REQUESTS_WEBHOOK_ID` when that happens.

## Companion Ombi Discord Router

The router is a small adapter for Ombi notifications that can create a Forum post and continue posting lifecycle updates into the same Discord thread. It should keep its webhook URL/token in runtime configuration only.

The router is intentionally separate from the main MediaOps Discord bot so the webhook secret does not need to be stored in MediaOps itself.

See also:

- [`DISCORD_FEATURES.md`](DISCORD_FEATURES.md)
- [`SECURITY_MODEL.md`](SECURITY_MODEL.md)
- [`UNRAID.md`](UNRAID.md)
- root [`.env.example`](../.env.example)
