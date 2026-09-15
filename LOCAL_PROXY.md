# Experimental langsmith-gateway plugin

Operational reference for the opt-in local proxy, installed separately from
`langsmith-tracing` and disabled by default. Start with the [README quick start](./README.md#langsmith-cli-prerequisite)
for CLI installation and browser login.

Requires macOS/Linux, Node.js 20+, Claude Code and `langsmith` on PATH. The selected
gateway must support LangSmith OAuth and, for subscription forwarding,
`X-LangSmith-Anthropic-Passthrough`; local readiness does not verify this.
Signed-out Claude Code compatibility is not established.

## Install and enable in Claude Code

1. Install at **user scope** so hooks are available in every project:

   ```text
   /plugin marketplace add langchain-ai/langsmith-claude-code-plugins
   /plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
   /reload-plugins
   ```

   Re-enabling a previously configured plugin can activate its saved forwarding mode.

2. Choose a scope and invoke directly:

   ```text
   /langsmith-gateway:setup --scope project
   ```

   - `--scope global`: `~/.claude/settings.json`.
   - `--scope project`: current hook cwd's `.claude/settings.local.json`.
   - Keep credential-bearing files untracked and git-ignored; never commit credentials.

   Setup pins the CLI from PATH, saves loopback routing and a private local key,
   and starts/verifies the daemon. Unrelated settings and native login are preserved.
   Authentication happens on the **first model request**; missing/expired login
   produces terminal guidance.

   New configs use API `https://api.smith.langchain.com`, gateway
   `https://gateway.smith.langchain.com`, the CLI default/current profile, port `52507`,
   and OAuth-only auth. Existing configs retain their CLI/profile/URLs/port.
   Without `--profile`, new setups save no profile and token lookup uses the CLI’s
   persisted `current_profile`, falling back to `default` when none is selected.
   `LANGSMITH_PROFILE` and other CLI environment overrides are intentionally stripped,
   not captured from the setup process; pin `--profile name` if needed. Omission on
   existing setups (even disabled ones) preserves any saved explicit profile.
   All active scopes share one daemon and must use identical options and mode.

3. **Continue using Claude Code.** If routing does not update, see [troubleshooting](#safety-and-troubleshooting).

## Read-only status

```text
/langsmith-gateway:status
```

Reports global/current-project disk routing and saved shared config, with a 500 ms
authenticated loopback health check. `--scope global|project` selects one routing
target. Status is read-only; it does not start the daemon or check upstream auth.
Disk routing and saved mode do not verify live session routing or subscription
validity. Other projects may use the daemon, and disabled config may briefly have
a draining listener; "not reachable or incompatible" is not proof it stopped.

## Optional subscription forwarding and mode switching

```text
/langsmith-gateway:setup --scope project --use-claude-subscription
/langsmith-gateway:setup --scope project
```

The first command enables forwarding; the second disables it. Every explicit
setup/re-enable without the flag saves `false`, regardless of the previous choice.
The flag takes no value and may appear only once. Hooks retain the saved mode.

To change modes, disable every other active scope, then run setup on the remaining
configured scope. The daemon drains/restarts with brief downtime; routing settings
and the local key stay unchanged. Setup for additional scopes must match the shared
mode. For externally provisioned projects, check [scope discovery](#it-provisioned-configuration-no-setup-required)
first. CLI/profile/port/endpoint changes require disabling **all** scopes.

If draining or startup fails, the requested mode stays saved but disabled, with
routing settings retained. Resolve the conflict and retry the same setup command;
a failed opt-out does not restore credential forwarding.

## Alternate API and gateway hosts

Inside Claude Code, supply both endpoint flags together and use an OAuth profile
matching your trusted API. You can optionally specify an explicit auth profile:

```text
/langsmith-gateway:setup --scope project --profile alternate-gateway --api-url https://api.example.com --gateway-url https://gateway.example.com
```

Use only trusted destinations and follow login guidance for the selected profile
and API. The proxy always passes its configured `--api-url`, overriding the CLI
profile’s saved API URL. **`--api-url` does not change a saved OAuth issuer.** Review
the selected profile’s issuer privately before login or refresh; changing a production profile's
API URL alone does not safely retarget it.

- Both URL flags are required together. Omitting both retains saved destinations,
  or selects production for a new configuration.
- Origins must be HTTPS public DNS names, optionally with a port (1–65535) and root
  slash. No `/api` or `/gateway` suffix, other paths, credentials, query, fragment,
  HTTP, IP literals, or local names. URL validation does not verify DNS or trust.
- Destinations come from saved config or setup flags, not environment overrides.
  HTTPS verification is required; requests do not follow redirects or fall back
  to production.
- `--profile name` is optional. For a custom CLI executable and local port, the
  slash command accepts explicit flags:

  ```text
  /langsmith-gateway:setup --scope project --cli /absolute/path/to/langsmith --port 52507
  ```

  Local ports must be 1024–65535. The examples above cover all setup options;
  unknown/duplicate flags and positional arguments are rejected.

To change pinned endpoints/profile/CLI/port:

1. Disable global routing and project routing in every active project.
2. Exit gateway sessions, stop other CLI writers, and allow up to 35 seconds for
   the daemon to drain before terminal login.
3. Follow the profile/issuer guidance above, then rerun setup with explicit options.

On a port conflict, wait and retry without killing unknown listeners or deleting
private config. Startup failure leaves the selected config disabled.

To restore production, follow the same disable, stop sessions, and drain procedure.
If you pinned an alternate profile, explicitly select your matching production
profile (replace `production-profile`; omitting the flag retains the saved profile):

```text
/langsmith-gateway:setup --scope project --profile production-profile --api-url https://api.smith.langchain.com --gateway-url https://gateway.smith.langchain.com
```

Complete matching terminal login if requested before resuming gateway requests.

## Consent, credentials, and models

**Routing sends Anthropic headers and unredacted prompts, tool content, and responses
through the selected gateway.** Tracing enablement, mute, and redaction are separate
and never filter this traffic. Only approve destinations you trust with these data.

- **OAuth-only (default):** uses CLI OAuth for gateway authentication and strips
  caller credentials. Gateway-managed provider keys and provider billing apply.
- **Subscription forwarding (explicit opt-in):** requires native Claude login,
  including for model overrides. The raw native credential is sent in
  `X-LangSmith-Anthropic-Passthrough` alongside CLI OAuth. The gateway uses it only
  for built-in Anthropic destinations, including fallback legs. Subscription
  eligibility, billing, and provider access remain subject to gateway/provider terms.

Both modes require LangSmith CLI login. Setup rejects conflicting
`ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, and `apiKeyHelper` overrides.
Never put LangSmith tokens or the local proxy key in those auth settings.

- **Default models:** leave Claude model settings unchanged. Bare IDs such as
  `claude-sonnet-4-5` become `anthropic/claude-sonnet-4-5` upstream.
- **Overrides:** use Claude's model selection, for example `/model openai/gpt-4.1`.
  `provider/model` strings, including `custom/<saved-model>`, are preserved.
  Availability and OpenAI/custom-provider credentials are gateway-managed.
- **Token counting:** only bare or `anthropic/<id>` models are supported. Other
  prefixes return local 501, which can break Claude features requiring token counts.
  There is no automatic model fallback.

## Session recovery and disabling

Hooks recover the daemon for enabled, configured scopes at session start and on
prompts. Session leases expire after 30 minutes without renewal; the daemon exits
after 60 seconds with no leases or active work. The next session/prompt restarts it.
Background requests before recovery may fail; transport errors have **no direct fallback**.

To turn gateway routing off entirely, inside Claude Code run (to stop only native
credential forwarding, re-run setup without `--use-claude-subscription` instead):

```text
/langsmith-gateway:disable --scope project
```

Use `--scope global` to remove global routing. Disable removes only the matching
loopback `ANTHROPIC_BASE_URL` and exact `X-LangSmith-Proxy-Key` header line,
preserving other settings and later edits. **Previous values are not restored.**
Without private config, disable cannot identify the key and leaves settings alone.

**Restart affected Claude sessions to stop using the proxy.** Other known active
scopes remain enabled; disabling the last one stops the shared daemon after up to
five seconds to notice and 30 seconds to drain. Global routing still applies after
disabling a project's local scope. Disable every scope before uninstalling.

Re-enable with setup on the same scope; hooks do not re-enable disabled routing.
The private config and local key are retained. Same-session re-enable is supported
when inherited transport still matches; resolve altered headers or unknown keys
privately if setup refuses. Re-enable waits for the old daemon to drain.

## IT-provisioned configuration (no setup required)

IT can provision the enabled private config, CLI profile/login, and Claude settings
directly. With the plugin installed and hooks enabled, sessions automatically start
the daemon using the saved configuration and forwarding mode.

The OS-account-owned `~/.claude/langsmith-proxy` directory must be `0700`, and its
regular, single-link `config.json` must be `0600` (no symlinks). Example schema
(placeholders must be replaced privately, not pasted into chat):

```json
{
  "enabled": true,
  "useClaudeSubscription": false,
  "cli": "/absolute/canonical/path/to/langsmith",
  "port": 52507,
  "secret": "<unique per-account random 32 bytes encoded as 64 lowercase hex characters>",
  "apiUrl": "https://api.smith.langchain.com",
  "gatewayUrl": "https://gateway.smith.langchain.com"
}
```

`profile` is optional: omit it for CLI default/current selection, or set it to an
explicit name (1–128 letters, digits, `_`, `.`, or `-`). Null/empty values are invalid.

Both booleans are required, including when disabled (`enabled: false`); retain the
other fields for re-enable. Both endpoints may be omitted together for production
defaults. Incomplete/unknown fields are rejected. Update older configs privately to
this schema, explicitly choosing forwarding mode and preserving keys and transport
values; do not paste secrets into chat or delete/reset config.

Provision `~/.claude/settings.json` for global routing or the canonical project's
`.claude/settings.local.json` for project routing, preserving other fields:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:52507",
    "ANTHROPIC_CUSTOM_HEADERS": "X-LangSmith-Proxy-Key: <same local secret>"
  }
}
```

Settings containing this bearer secret should be account-owned `0600`, untracked
and git-ignored. Parent directories must be account-owned, non-writable by other
users and not symlinks. The executable must be account- or root-owned, executable
and not group/world writable. CLI credentials remain in the CLI's own store;
never place LangSmith OAuth tokens or native Anthropic credentials in this config.
The local secret remains required in both modes; it is not native/provider auth.

**Multi-scope discovery:** setup maintains optional `settingsTargets` in this config,
an array of up to 128 canonical absolute settings-file paths. Commands inspect
these plus global/current-project settings to find matching URL/key pairs before
disable or mode changes. The list aids discovery, not authorization.

For multiple externally provisioned projects, populate `settingsTargets` before
scoped disable/mode changes. Unlisted projects outside the current directory cannot
be discovered: their hooks can still start, but commands may interrupt them by
assuming no other scope is active. Inventory those projects before changes.

## Safety and troubleshooting

- Claude Code supports settings reload, but setup confirms only saved settings and
  local daemon readiness. Restart if routing does not update (always after disable).
- Setup refuses detected transport/auth conflicts, disabled hooks, unsafe
  permissions/links, and malformed settings. Project/managed settings or shell
  overrides may take precedence; resolve inherited overrides privately and restart.
- Config uses the **OS account home**. Custom `CLAUDE_CONFIG_DIR`, CLI config
  environment overrides, proxies/CAs, and Windows are unsupported. Avoid concurrent
  settings edits. Legacy receipts are ignored but may contain old secret headers;
  remove them privately if no longer needed.
- **The CLI credential store has no cross-process locking.** Avoid competing
  refreshes on one profile or login/config writes to the same store during gateway
  sessions; the daemon serializes only its own token requests. Stop sessions and
  other writers before terminal login. Use ordinary OAuth, not the CLI's static-token
  gateway flow, and never copy tokens manually. After reauthentication, wait two
  seconds for cached lookup failures to expire and retry; failed requests are not replayed.
- The server binds IPv4 loopback, requires a private local key, rejects browser
  Origins/incorrect Hosts, and forwards only supported routes over verified HTTPS.
  Local HTTP is unencrypted and the key authenticates the client, not the server:
  a process taking over the port can impersonate the proxy. Do not use it on hosts
  with untrusted local users/processes; same-user code can also read the secret.

Developer checks belong in [TESTING.md](./TESTING.md#experimental-gateway-tests),
not the user setup workflow.
