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

An optional `Test` tag can be configured on the router for Ombi's built-in webhook **Send test** action. Test posts are diagnostic only and are not treated as media requests.

The visible tag names and colors are administrator choices. MediaOps uses Discord tag IDs, not display names.

## MediaOps configuration

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

## Companion router distribution

The packaged router lives under [`../addons/ombi-discord-router/`](../addons/ombi-discord-router/) and is published separately as:

```text
ghcr.io/miakkia/mediaops-ombi-discord-router:latest
```

Development branches publish `:dev` and commit-SHA tags. Unraid users can use [`../templates/ombi-discord-router.xml`](../templates/ombi-discord-router.xml).

The router's `.env.example` contains placeholders only. Its full Discord webhook URL is a secret runtime value and must not be copied into MediaOps configuration.

Use a user-defined Docker network shared by Ombi and the router. A stable target such as:

```text
http://ombi-discord-router:8080/ombi
```

is preferred over a changing Docker container IP.

## Discord bot requirements

When Forum synchronization is enabled, the Discord application must have the gateway capability required to receive the structured webhook message data used by the integration. Enable only the intents required by the configured MediaOps features.

The bot also needs permission in the configured Forum to view the channel and manage the request threads/tags it is expected to maintain. Avoid server-wide Administrator permission when narrower channel/role permissions are sufficient.

## Safety behavior

Forum automation is intentionally scoped to the configured integration and configured Forum. MediaOps does not treat normal Discord message text as an instruction to change request state.

Configuration is fail-closed: incomplete Forum configuration disables synchronization rather than falling back to broad behavior.

Request state is monotonic. Completed states are terminal and are not automatically rewritten by later Forum messages.

The router follows the same monotonic lifecycle rule before posting updates. Duplicate same-state notifications are ignored, stale/backward notifications are ignored, and terminal requests are not reopened by later non-terminal events. This matters because Ombi can emit multiple notifications for a single logical transition and those notifications are not guaranteed to arrive in lifecycle order.

These safeguards are part of the application boundary, but administrators should still apply Discord least-privilege permissions and protect bot/webhook credentials.

## Ombi notification caveat for Admin-origin requests

Ombi does not emit its normal `NewRequest` notification when the request itself is created by an Ombi **Admin** account. Ombi treats the administrator as already aware of the request. Requests originating from the API, a Power User, or a normal user can follow the normal request-notification path.

This means the Forum cannot show an initial `Requested` state for an Admin-origin request unless Ombi emits another supported lifecycle event afterward. If the first event the router receives is `RequestApproved`, `RequestAvailable`, `Failed`, or `Denied`, the router can create the Forum post directly at that later state.

This is an Ombi-side notification behavior, not a MediaOps or router authorization rule. The router intentionally does not invent missing lifecycle events.

## Operational notes

- `Requested` and `Processing` posts remain active.
- `Available`, `Failed`, and `Denied` are terminal states.
- Terminal posts are locked before they are removed from the active Forum view.
- Existing Forum history is preserved; MediaOps does not delete completed request posts.
- Duplicate Ombi events that resolve to the current status do not create duplicate Forum messages.
- Stale/backward Ombi events do not regress the router index or Forum lifecycle.
- The router and MediaOps should use the same Forum and tag IDs.
- Rotating/recreating a Discord webhook changes its webhook ID; update `MEDIA_REQUESTS_WEBHOOK_ID` when that happens.
- Keep `/data/media-threads.json` persistent across router image updates.

## Companion Ombi Discord Router

The router is a small adapter for Ombi notifications that can create a Forum post and continue posting meaningful lifecycle updates into the same Discord thread. It should keep its webhook URL/token in runtime configuration only.

The router is intentionally separate from the main MediaOps Discord bot so the webhook secret does not need to be stored in MediaOps itself.

The repository includes the router source, Dockerfile, environment template, hardened Compose example, Unraid template, and deployment notes. No deployment-specific IDs, webhook credentials, or infrastructure addresses are embedded in the addon.

See also:

- [`../addons/ombi-discord-router/README.md`](../addons/ombi-discord-router/README.md)
- [`DISCORD_FEATURES.md`](DISCORD_FEATURES.md)
- [`SECURITY_MODEL.md`](SECURITY_MODEL.md)
- [`UNRAID.md`](UNRAID.md)
- root [`.env.example`](../.env.example)
