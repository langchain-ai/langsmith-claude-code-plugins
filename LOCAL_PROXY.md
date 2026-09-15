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
mode. For externally provisioned projects, check [scope discovery](#it-provisioned-configuration)
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

## IT-provisioned configuration

IT installs the software, deploys organization policy through Claude Code's
**managed settings**, and provisions the gateway's per-account files. **The user
signs in with their own account; IT does not provision or distribute OAuth tokens.**

### Managed settings and current gateway support

Deliver organization policy through a `managed-settings.json` file, an MDM policy,
or server-managed settings from the claude.ai console. Managed keys take precedence
over user/project files and `--settings`; users cannot override them locally. If
multiple managed sources are deployed, follow Claude Code's [managed-settings precedence rules](https://code.claude.com/docs/en/settings#settings-precedence),
rather than assuming every source is merged.

For model policy, `model` sets the session's starting model; it does **not** lock
model selection. Use `availableModels` to constrain `/model`, `--model`, and the
`model` key in user settings.

**Managed-only gateway routing is not supported by this plugin yet.** Startup hooks
look for matching routing in user/project settings files; they do not read managed
settings or use inherited routing environment variables for that check. Status and
scope discovery also do not inspect managed policy. Deploying only managed
`ANTHROPIC_BASE_URL` and `ANTHROPIC_CUSTOM_HEADERS` will not automatically start
the daemon.

The checklist below therefore provisions the currently supported user/project
routing files alongside any managed organization policy. This is **not an enforced
routing policy**: the gateway config and these routing files remain user-owned.
MDM can deploy those files, but that is distinct from Claude Code's managed tier.
Do not deploy conflicting managed routing values. Managed-only gateway provisioning
requires lifecycle support in the plugin before it can replace this checklist.

### IT admin checklist

The examples use production endpoints and the CLI's current/default login.
Here, `~` and `$HOME` mean the **target user's OS account home**, not the admin's or
root's home. Run the examples in that user's account context; privileged deployment
tools must explicitly set the destination and user ownership. For an existing
installation, coordinate session shutdown before updates and allow up to 35 seconds
for the daemon to drain. Do not change the CLI store while sessions or other CLI
writers are running.

1. **Deploy the prerequisites.** Ensure macOS/Linux, Node.js 20+, and Claude Code
   are installed. Install the [LangSmith CLI](https://docs.langchain.com/langsmith/langsmith-cli)
   for the target user:

   ```sh
   curl -fsSL https://cli.langsmith.com/install.sh | sh
   ```

   Follow the installer's PATH instructions so Node and `langsmith` are available
   to the user's Claude Code process. Verify in the target user's environment:

   ```sh
   node --version
   langsmith --version
   ```

2. **Deploy and enable the plugin at user scope.** The target user's Claude Code
   installation needs the gateway plugin and enabled hooks in every project. For
   an interactive installation in that user's Claude Code session, run:

   ```text
   /plugin marketplace add langchain-ai/langsmith-claude-code-plugins
   /plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
   /reload-plugins
   ```

   Keep hooks enabled. Exit Claude Code while provisioning the files below;
   reloading a previously configured plugin can activate its saved mode.

3. **Create the private proxy config for each user.** Prepare its directory:

   ```sh
   umask 077
   mkdir -p "$HOME/.claude/langsmith-proxy"
   chmod 700 "$HOME/.claude/langsmith-proxy"
   ```

   Resolve the CLI's canonical executable path for the `cli` field:

   ```sh
   node -e 'console.log(require("node:fs").realpathSync(process.argv[1]))' "$(command -v langsmith)"
   ```

   Generate a separate local key for each new account installation. Do not reuse
   one key across a fleet or include it in deployment logs. For an interactive
   installation, generate it in a private terminal:

   ```sh
   node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'
   ```

   Create `~/.claude/langsmith-proxy/config.json` with a local editor or your
   provisioning tool. Replace the placeholders with the path and key above:

   ```json
   {
     "enabled": true,
     "useClaudeSubscription": false,
     "cli": "/absolute/canonical/path/to/langsmith",
     "port": 52507,
     "secret": "<64 lowercase hex characters>",
     "apiUrl": "https://api.smith.langchain.com",
     "gatewayUrl": "https://gateway.smith.langchain.com"
   }
   ```

   ```sh
   chmod 600 "$HOME/.claude/langsmith-proxy/config.json"
   ```

   The directory and config must be account-owned; the config must be a regular,
   single-link file, not a symlink. The CLI executable must be account- or
   root-owned, executable, and not group/world writable. Preserve the existing
   key and transport values when updating an installation.

   Leave `useClaudeSubscription` false for OAuth-only routing. Set it to true only
   with explicit approval to forward native Claude credentials, and tell the user
   that native Claude login is also required; see [credential forwarding](#consent-credentials-and-models).
   The local key is required in either mode and is not a LangSmith OAuth token.

4. **Provision the gateway's user/project routing files.** These files support
   automatic startup without `/langsmith-gateway:setup`; they are not managed
   settings. Choose one destination:

   - Global: `~/.claude/settings.json`.
   - Project: `.claude/settings.local.json` under the canonical project directory.

   Merge these fields into the existing settings rather than replacing the file.
   Use the same port and local key as the private config. Preserve unrelated env
   fields and custom header lines:

   ```json
   {
     "env": {
       "ANTHROPIC_BASE_URL": "http://127.0.0.1:52507",
       "ANTHROPIC_CUSTOM_HEADERS": "X-LangSmith-Proxy-Key: <same local secret>"
     }
   }
   ```

   Resolve conflicting auth/transport overrides before proceeding. If a managed
   policy sets these keys, changes here cannot override it; IT must change the
   policy. `/langsmith-gateway:disable` cannot remove managed routing and may stop
   the local daemon while that policy still points Claude at it.

   Make the settings file account-owned with mode `0600`; parent directories must be
   account-owned, not writable by other users, and not symlinks. Keep both
   credential-bearing files untracked and git-ignored; never commit them.

5. **Register project scopes when provisioning more than one.** Add optional
   `settingsTargets` to the private config, listing the canonical absolute paths
   of the provisioned settings files (up to 128):

   ```json
   "settingsTargets": [
     "/Users/alice/work/project-a/.claude/settings.local.json",
     "/Users/alice/work/project-b/.claude/settings.local.json"
   ]
   ```

   Commands inspect this list plus global/current-project settings before disable
   or mode changes. Unlisted projects outside the current directory cannot be
   discovered, so commands may interrupt them by assuming no other scope is active.
   The list supports discovery, not authorization.

6. **Hand off to the user.** Confirm that the plugin is enabled, file ownership and
   permissions are correct, and both files contain the same local key and port.
   Give the user the configured scope, forwarding mode, and the
   sign-in instructions below. Tell them that the gateway receives unredacted
   conversation/tool content independently of tracing settings. **Do not run login
   as the administrator or copy an administrator's CLI credential store.**

### End-user steps after IT provisioning

These are user actions, not admin deployment steps. For the production configuration
shown above:

1. **Sign in from a terminal as yourself**, with gateway sessions closed:

   ```sh
   langsmith auth login
   ```

   Complete browser login with your own LangSmith account/workspace. Use ordinary
   OAuth, not the CLI's static-token gateway setup flow. Credentials remain in the
   CLI's store; do not paste tokens into Claude or settings. If IT enabled native
   subscription forwarding, native Claude login is also required.

2. **Open a new Claude Code session** in the configured scope. Hooks start the
   daemon automatically; do not run setup. Check local readiness with:

   ```text
   /langsmith-gateway:status
   ```

3. **Send a model request** to test upstream authentication. Status checks saved
   routing and local health, not login or live session routing. If the request
   fails, see [troubleshooting](#safety-and-troubleshooting) or contact IT. To undo
   routing, follow [disable instructions](#session-recovery-and-disabling) and
   restart affected sessions.

### Advanced: pinning a CLI profile

No profile configuration is needed for the steps above. Without a `profile` field,
the gateway uses the CLI's persisted current profile, falling back to `default`.

To pin a specific profile, IT can add `"profile": "claude-gateway"` to the private
config and instruct the user to sign in with:

```sh
langsmith --profile claude-gateway auth login
```

Explicit names allow 1–128 letters, digits, `_`, `.`, or `-`; null/empty values are
invalid. For custom destinations or an existing profile, review the [profile and issuer requirements](#alternate-api-and-gateway-hosts)
before login. The gateway does not inherit `LANGSMITH_PROFILE` or other CLI
environment overrides.

**Schema notes:** Both booleans are required, even when disabled; retain the other
fields for re-enable. Both endpoints may be omitted together for production
defaults. Incomplete/unknown fields are rejected. Update older configs privately,
preserving keys and transport values rather than deleting/resetting them.

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
