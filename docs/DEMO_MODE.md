# MediaOps Demo Mode

MediaOps can be run in a public/demo configuration without publishing the operator's configured Watch Party URL into Discord.

Enable it with:

```env
MEDIAOPS_DEMO_MODE=true
```

When Demo Mode is enabled:

- Watch Party link buttons remain visible so the Discord UX can be demonstrated, but they are disabled and contain no URL.
- `/watchparty` does not emit the configured Watch Party URL into its Discord response.
- `/watchparty-start` does not build or emit a public join URL into its Discord response.
- scheduled Watch Party launch messages replace the direct join URL with a Demo Mode notice.
- backend Watch Party configuration remains available to the MediaOps process; Demo Mode is an output/privacy boundary, not a substitute for network isolation or provider authentication.

When Demo Mode is disabled (the default), MediaOps keeps the normal self-hosted behavior and uses `WATCHPARTY_URL` for Discord join links.

## Unraid

The Unraid template exposes **Demo Mode** as `MEDIAOPS_DEMO_MODE`.

For a public Community/demo bot, set:

```text
MEDIAOPS_DEMO_MODE=true
```

For a normal private/self-hosted deployment, keep:

```text
MEDIAOPS_DEMO_MODE=false
```

Changing this environment variable only requires restarting/recreating the MediaOps container. It does not change the registered slash-command schema, so `npm run deploy-commands` is not required solely for Demo Mode. Re-run command deployment only when command definitions themselves change.

## Security note

Demo Mode is intentionally fail-closed for Watch Party link presentation: the configured URL is not attached to disabled Discord buttons. Operators should still avoid placing secrets in URLs and should continue using least-privilege credentials, private/internal provider connectivity where practical, and normal network controls.
