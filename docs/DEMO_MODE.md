# MediaOps Demo Mode

MediaOps can be run in a public/demo configuration without publishing the operator's configured Watch Party URL into Discord.

Enable it with:

```env
MEDIAOPS_DEMO_MODE=true
```

When Demo Mode is enabled:

- Watch Party link buttons remain visible so the Discord UX can be demonstrated, but they are disabled and contain no URL.
- `/watchparty-setup` publishes its **Ouvrir / Open** control as a disabled non-link button and does not read or serialize `WATCHPARTY_URL` for that control.
- `/watchparty` does not emit the configured Watch Party URL into its Discord response.
- `/watchparty-start` does not build or emit a public join URL into its Discord response.
- scheduled Watch Party launch messages replace the direct join URL with a Demo Mode notice.
- backend Watch Party configuration remains available to the MediaOps process; Demo Mode is an output/privacy boundary, not a substitute for network isolation or provider authentication.

When Demo Mode is disabled (the default), MediaOps keeps the normal self-hosted behavior and uses `WATCHPARTY_URL` for Discord join links.

## Unraid / Docker / Portainer

The Unraid template exposes **Demo Mode** as `MEDIAOPS_DEMO_MODE`. Docker Compose and Portainer stacks can set the same environment variable directly.

For a public Community/demo bot, set:

```text
MEDIAOPS_DEMO_MODE=true
```

For a normal private/self-hosted deployment, keep:

```text
MEDIAOPS_DEMO_MODE=false
```

Changing this environment variable only requires restarting/recreating the MediaOps container. It does not change the registered slash-command schema, so `npm run deploy-commands` is not required solely for Demo Mode. Re-run command deployment only when command definitions themselves change.

After changing Demo Mode or updating MediaOps, republish persistent Discord panels such as `/watchparty-setup`; Discord keeps the components that were serialized into older messages.

## Security note

Demo Mode is intentionally fail-closed for Watch Party link presentation: configured Watch Party URLs are not attached to disabled Discord buttons. The `/watchparty-setup` panel also avoids retrieving the public Watch Party URL while Demo Mode is active, reducing the chance of accidentally serializing it into Discord output.

Operators should still avoid placing secrets in URLs and should continue using least-privilege credentials, private/internal provider connectivity where practical, and normal network controls.
