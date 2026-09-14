# Experimental langsmith-gateway plugin

An opt-in local proxy, installed separately from `langsmith-tracing` and disabled
by default. Install, enable, recover, and disable it from Claude Code; no manual
proxy startup or plugin-directory lookup is needed. The bundled runtime is internal
to the slash commands and hooks, not a standalone setup or Claude launcher.

Requires macOS/Linux, Node.js 20+, Claude Code on PATH, and a LangSmith CLI OAuth
profile. New configurations use **OAuth-only** gateway auth: gateway-managed
provider keys and provider billing, not native subscription credential forwarding.
The selected deployment must support LangSmith OAuth Bearer authentication and,
only when opted in, `X-LangSmith-Anthropic-Passthrough`. Accepting a URL or passing
local setup checks does not establish backend compatibility. Claude Code signed-out
client compatibility is not established; the plugin does not inject dummy credentials.

## Install and enable in Claude Code

1. Install at **user scope** so hooks are available in every project:

   ```text
   /plugin marketplace add langchain-ai/langsmith-claude-code-plugins
   /plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
   /reload-plugins
   ```

   Installing tracing alone does not install gateway hooks. Re-enabling a previously
   configured gateway plugin can activate its saved forwarding configuration.

2. Choose a scope and invoke directly:

   ```text
   /langsmith-gateway:setup --scope project
   ```

   **The invocation authorizes the change.** The supported UserPromptSubmit hook
   handles it before disabled-config checks and blocks the model, exactly like
   tracing mute/unmute. There is no LLM confirmation, tool execution, or question
   wall. If command markdown reaches the model, it must not execute a fallback;
   enable/reload the plugin and retry.

   - `--scope global`: `~/.claude/settings.json`.
   - `--scope project`: current hook cwd's `.claude/settings.local.json` (never the
     tracked `.claude/settings.json`). Project path must be canonical, not a symlink.
   - Secret files inside repositories must be untracked and git-ignored. Setup
     checks git; it never edits ignores or stages files for you.

   Setup discovers/pins the CLI on PATH, saves private loopback transport settings
   and starts/verifies daemon identity/health. It preserves unrelated settings and
   native Claude authentication. No OAuth token is copied into settings; the local
   proxy key is private. Authentication happens on the **first model request**,
   not setup/hooks. Missing CLI is reported during setup; missing/expired login on
   first use gives terminal guidance. See the [CLI prerequisite](./README.md#langsmith-cli-prerequisite).

   New configs default to API `https://api.smith.langchain.com`, gateway
   `https://gateway.smith.langchain.com`, profile `claude-gateway`, port `43127`.
   Existing config retains its pinned CLI/profile/URLs/port. All active targets share one daemon and
   identical CLI/profile/URLs/port and subscription-forwarding mode; incompatible
   setup is refused unchanged. New configs explicitly save `useClaudeSubscription: false`.

3. **Continue using Claude Code.** Setup reports settings saved (or already
   configured), the selected mode, and local daemon readiness. It does not confirm
   that the running client's model transport has reloaded; see [troubleshooting](#safety-and-troubleshooting)
   if routing does not update. Install scope and settings scope are independent;
   user plugin installation keeps recovery hooks available across projects.

## Read-only status

```text
/langsmith-gateway:status
```

Reports global/current-project disk routing, saved shared config and a bounded
500 ms authenticated loopback health check. `--scope global|project` selects one
routing target, not a separate proxy. Status never writes, starts the daemon,
renews leases, invokes CLI/auth or reads credentials. Disk routing and configured
mode do not prove live session routing, authentication or subscription validity.
Other projects may use the daemon; “not reachable or incompatible” does not prove
it stopped, and disabled config may coexist briefly with a draining listener.

## Optional subscription forwarding and mode switching

```text
/langsmith-gateway:setup --scope project --use-claude-subscription
/langsmith-gateway:setup --scope project
```

On every explicit setup/re-enable, flag presence selects `true` and omission
selects `false`, regardless of saved mode. Boolean values, negative and repeated
flags are rejected. Hooks retain the saved mode without repeating setup.

The **sole known active configured target** can switch mode in place: save the
requested config disabled, drain the old daemon, then start/verify its replacement.
Routing settings and local key stay unchanged. Expect brief downtime: polling
notices within 5 seconds, upstream work gets up to 30 seconds, and new credential
work stops while the in-flight credential child is cancelled.

Disable other active scopes first; an unconfigured target cannot switch an active
install, and setup for another scope must match the shared mode. Later transport
edits are not overwritten. CLI/profile/port/endpoint changes still require disabling
**all** scopes. On drain/readiness failure, the requested choice stays disabled
with routing intact; resolve the conflict and retry the same setup. Failed opt-out
never automatically restores native forwarding.

## Alternate API and gateway hosts

Inside Claude Code, use a dedicated OAuth profile matching your trusted API and
supply both endpoint flags together (replace these placeholder hosts):

```text
/langsmith-gateway:setup --scope project --profile alternate-gateway --api-url https://api.example.com --gateway-url https://gateway.example.com
```

Invoke only for trusted destinations. The same CLI/login
prerequisite applies; follow setup's guidance for the selected profile and API,
not the production login example. **`--api-url` does not change an existing saved
OAuth issuer.** Review the dedicated profile's issuer privately before login or
refresh; do not repurpose a production profile by changing only its API URL.

- Both URL flags are required together. Omitting both retains saved destinations,
  or selects production for a new configuration.
- Origins must be HTTPS public DNS names, optionally with a port (1–65535) and root
  slash. No `/api` or `/gateway` suffix, other paths, credentials, query, fragment,
  HTTP, IP literals, or local names. URL validation does not verify DNS or trust.
- No TLS bypass, redirects, environment endpoint overrides, or implicit production
  fallback. Configurable hosts do not guarantee regional/self-hosted compatibility;
  the selected deployment must implement OAuth and, when opted in, passthrough.
- `--profile name` is optional. For a custom CLI executable and local port, the
  slash command accepts explicit flags:

  ```text
  /langsmith-gateway:setup --scope project --cli /absolute/path/to/langsmith --profile profile --port 43127
  ```

  Local ports must be 1024–65535. Setup accepts only the named options
  `--scope global|project`, `--cli`, `--profile`, `--port`, paired `--api-url` /
  `--gateway-url`, and presence-only `--use-claude-subscription`. Bare arguments,
  unknown or duplicate flags, negative flags and boolean flag values are rejected.

To change pinned endpoints/profile/CLI/port, disable global routing and project
routing in every active project, exit gateway sessions, stop other CLI writers,
and allow up to 35 seconds to drain before terminal login. Rerun setup with explicit
options after following the profile/issuer guidance above. Re-enable waits for the
old port; on conflict, wait and retry without killing unknown listeners or deleting
private config. Startup failure retains the selected config disabled, never falls
back to production, and never performs login.

To restore production, follow the same disable, stop sessions, and drain procedure and explicitly run:

```text
/langsmith-gateway:setup --scope project --profile claude-gateway --api-url https://api.smith.langchain.com --gateway-url https://gateway.smith.langchain.com
```

Complete matching terminal login if requested before resuming gateway requests.

## Consent, credentials, and models

**Routing sends Anthropic headers and unredacted prompts, tool content, and responses
through the selected gateway.** Tracing enablement, mute, and redaction are separate
and never filter this traffic. Only approve destinations you trust with these data.

- **OAuth-only (new default):** the proxy does not require native Authorization.
  It strips caller Authorization, API keys, passthrough and routing/auth auxiliary
  headers, then sends only the CLI OAuth Bearer as gateway authentication. No native
  passthrough header is sent. Gateway provider keys and provider billing apply.
- **Subscription forwarding (explicit saved opt-in):** requires exactly one
  `Authorization: Bearer sk-ant-...` with a nonempty header-safe suffix, even for
  model overrides. Missing/invalid native auth fails before CLI token acquisition.
  The raw native credential goes in `X-LangSmith-Anthropic-Passthrough`, while the
  gateway Authorization remains the CLI OAuth Bearer. The gateway activates native
  credentials only for built-in Anthropic destinations (including fallback legs),
  not arbitrary custom providers. This is no guarantee of subscription eligibility,
  billing treatment or provider access; gateway/provider rules and terms apply.

Neither mode uses a gateway API key. The proxy's OAuth-only protocol does not
establish that a signed-out Claude Code client can start and send requests. Setup
still rejects conflicting `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, and
`apiKeyHelper` overrides rather than changing client auth behavior; native login
is not a blanket proxy prerequisite. No dummy credential is installed. Never put
a LangSmith token or local proxy key in those auth settings.

- **Default models:** leave Claude model settings unchanged. Bare IDs such as
  `claude-sonnet-4-5` become `anthropic/claude-sonnet-4-5` upstream.
- **Overrides:** use Claude's model selection, for example `/model openai/gpt-4.1`.
  Existing `provider/model` strings, including `custom/<saved-model>`, are preserved;
  the gateway determines availability. Messages use unified `/v1/messages`.
  When enabled, native passthrough is for built-in Anthropic destinations; OpenAI and custom
  providers use gateway-managed credentials. A saved custom model can select a
  gateway-managed alternative, not a fallback to direct native Claude traffic.
- **Token counting:** only bare or `anthropic/<id>` models are supported. Other
  prefixes return local 501 without a CLI token check or an upstream request,
  which can break Claude features requiring token counts. There is no automatic
  model fallback. Model listing uses the unified catalog; single-model lookup
  remains Anthropic-specific.

## Session recovery and disabling

For an authorized scope recorded privately in OS home, SessionStart ensures the daemon and registers a session lease without checking auth. UserPromptSubmit recovers the daemon and renews the lease; SessionEnd
releases only that session. Leases expire after 30 minutes without renewal. With
no leases or active work, the daemon exits after 60 seconds idle, including after
setup before any model use. The next session/prompt starts it again. Background
requests before recovery may fail; hook errors do not block Claude, but transport
errors have **no direct fallback**. No service manager is installed.

To turn gateway routing off entirely, inside Claude Code run (to stop only native
credential forwarding, re-run setup without `--use-claude-subscription` instead):

```text
/langsmith-gateway:disable --scope project
```

Use `--scope global` to remove global routing. Invocation authorizes the change;
no confirmation/model turn. Disable unsets the selected target's
`ANTHROPIC_BASE_URL` only if it matches the configured loopback URL, and removes
only the exact `X-LangSmith-Proxy-Key: <local secret>` line. Other headers,
unrelated settings and later replacements are preserved. **Previous values are
never restored**, including empty env/header distinctions. Missing private config
is a no-op: the command cannot safely identify a key to remove.
**Restart affected Claude sessions to stop using the proxy.** Running sessions may
retain transport after disk settings change. Other known matching scopes remain
active; the last known active scope disables the shared config. The daemon notices
within five seconds and drains for up to 30 seconds. Disable every scope before
uninstalling. Global settings still apply in a project after its local scope is
disabled. Other overrides may remain; review privately.

To keep using the gateway, re-enable with setup and the same scope in the same
session when the local transport still matches. Setup recognizes only the retained
private config's exact generated key
line appended to that target's current disk headers; unknown keys or added/altered
inherited headers still cause refusal. It does not copy inherited headers into
settings or retain extra secret/history files. Normal hooks never re-enable a
disabled scope. Re-enable still waits for the old daemon to drain. This restores
saved routing and the local daemon.

## IT-provisioned configuration (no setup required)

IT can provision the enabled private config, the selected CLI profile/login, and
Claude settings directly. With the gateway plugin installed and hooks enabled,
SessionStart/UserPromptSubmit automatically ensure the daemon and register the
session. No slash setup, receipt, or target-list membership is required. Hooks
never change the saved configuration or forwarding mode.

The OS-account-owned `~/.claude/langsmith-proxy` directory must be `0700`, and its
regular, single-link `config.json` must be `0600` (no symlinks). Example schema
(placeholders must be replaced privately, not pasted into chat):

```json
{
  "enabled": true,
  "useClaudeSubscription": false,
  "cli": "/absolute/canonical/path/to/langsmith",
  "profile": "claude-gateway",
  "port": 43127,
  "secret": "<unique per-account random 32 bytes encoded as 64 lowercase hex characters>",
  "apiUrl": "https://api.smith.langchain.com",
  "gatewayUrl": "https://gateway.smith.langchain.com"
}
```

Both boolean fields are required. A disabled config uses the same full schema
with `enabled: false`, retaining its local secret, CLI, profile, port, endpoints
and forwarding mode for re-enable. Both endpoint fields may be omitted together
to use production defaults. Unknown fields and incomplete configs are rejected,
even when disabled; no implicit schema migration occurs. If an older developer
config is rejected, perform a one-time private update to this schema, choosing
the forwarding boolean explicitly and retaining all existing transport/key values.
Do not paste secrets into chat or delete/reset configuration to fix it. Ordinary
hooks fail safely without startup or token acquisition on config errors.

Provision `~/.claude/settings.json` for global routing or the canonical project's
`.claude/settings.local.json` for project routing, preserving other fields:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:43127",
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

**Multi-scope discovery:** explicit setup maintains an optional `settingsTargets`
array in this same config: at most 128 canonical absolute settings-file paths.
It contains no keys, previous values, identity hashes or restore data. It exists
only to find other scopes when disabling or changing the shared daemon mode.
Commands inspect those paths plus global/current-project targets and count only
matching disk URL/key pairs; membership neither authorizes startup nor proves
routing. Status reports the selected global/current-project files, not the index.
Hooks observe global settings with current project `settings.json` then
`settings.local.json` env overrides, without registering paths or writing config.
Managed settings, shell overrides and live client reload state are not fully
observable; this is not universal enforcement of Claude's effective routing.

IT can omit the index for global or single-project provisioning. For multiple
externally provisioned projects, list their settings paths in `settingsTargets`
before scoped disable/mode changes. Unknown projects outside the current directory
cannot be discovered automatically (including legacy receipt-only projects).
Unlisted external projects can still start hooks, but may be interrupted by a
command that sees no other active target. Inventory those scopes before changes;
stop sessions and disable all scopes before switching endpoints/profile/port/CLI.
There is no separate MDM mode or additional authorization record.

## Safety and troubleshooting

- Restart affected sessions after disable. For other routing changes, Claude Code
  supports settings reload; restart if routing does not update. The hook environment
  cannot prove live model transport, and offline tests do not verify synchronous
  reload or supported client versions. The plugin cannot mutate its parent process.
- Setup refuses detected transport/auth conflicts, disabled user hooks, unsafe
  permissions/links and malformed settings. Project/managed settings and shell
  overrides may take precedence; remove inherited transport overrides and restart.
  Resolve other conflicts privately before retrying, without pasting settings.
- Config lives in the **OS account home**; keep it and secret-bearing settings private
  and out of git. Legacy receipts are ignored and may contain sensitive old headers;
  operators may remove them privately. There are no backup/restore records. Avoid
  concurrent settings edits. Custom `CLAUDE_CONFIG_DIR`, CLI config environment
  overrides, proxies/CAs and Windows are unsupported.
- The CLI refreshes ordinary short-lived OAuth credentials and may save rotated
  credentials in its own store. The proxy only caches tokens in memory for at most
  60 seconds; it does not persist tokens or log bodies/tokens. Refresh failure
  requires terminal login and a new request; token lookup failures are cached for
  two seconds, after which a new request can read updated CLI credentials. Failed
  requests are not replayed.
  **The CLI store has no cross-process locking:** avoid competing token refreshes
  on the same profile and login/config writes to the same store during gateway
  sessions. Stop sessions and other writers before login; the daemon serializes
  only its own token requests. Do not use the CLI's separate static-token gateway
  setup flow or copy tokens manually.
- The server binds IPv4 loopback, requires a private local key, rejects browser
  Origins/incorrect Hosts, and forwards only supported routes over verified HTTPS.
  Local HTTP is unencrypted and the key authenticates the client, not the server:
  a process taking over the port can impersonate the proxy. Do not use it on hosts
  with untrusted local users/processes; same-user code can also read the secret.

Developer checks belong in [TESTING.md](./TESTING.md#experimental-gateway-tests),
not the user setup workflow.
