# LangSmith Gateway Plugin

The [LangSmith](https://smith.langchain.com) gateway routes model requests for many providers using the keys your workspace holds. This plugin points Claude Code at it so a small helper on your machine passes each request on and you keep using Claude Code exactly as before.

This is a different plugin from LangSmith tracing since neither needs the other and turning this on does not start tracing your conversations.

## What you need

- Node.js 20 or newer.
- A way to sign in, either the LangSmith CLI or your org's own OIDC provider.

Install the LangSmith CLI and finish the sign-in in the browser that opens. If your org has a custom OIDC provider configured for LangSmith you can skip this step.

```sh
curl -fsSL https://cli.langsmith.com/install.sh | sh
langsmith auth login
```

## Install

Run these inside Claude Code to install the plugin from the LangChain marketplace.

```text
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-gateway@langsmith-claude-code-plugins
/reload-plugins
```

## Turn it on

```text
/langsmith-gateway:setup --scope global
```

If you pay Anthropic through a Claude subscription rather than an API key, add `--use-claude-subscription` so your own Claude login is passed through.

Model requests are routed through the LangSmith LLM gateway from here on.

To stop, run `/langsmith-gateway:disable --scope global` and restart your sessions.

## Check it is working

```text
/langsmith-gateway:status
```

It tells you whether routing is on, whether the helper is up and whether your credentials are working. Send a message to confirm the whole path end to end.

## Configure custom OIDC authentication

This is for orgs that have a custom OIDC provider configured in LangSmith. It maps the token used for gateway authentication to a command you provide, similar to [Anthropic's apiKeyHelper](https://code.claude.com/docs/en/settings-reference):

```text
/langsmith-gateway:setup --scope global --identity-token-command "cat ~/.oidc/profile.jwt" --workspace-id 11111111-2222-3333-4444-555555555555
```

- Quote the command so you can keep writing flags after it.
- Your workspace id is in your LangSmith workspace settings.
- The command runs through `/bin/sh` without your terminal's setup, so use full paths and print nothing but the token.

[LangSmith tracing](./README.md) is the separate plugin that records what the agent did.
