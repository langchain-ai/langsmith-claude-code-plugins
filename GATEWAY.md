# LangSmith Gateway Plugin

The [LangSmith](https://smith.langchain.com) gateway routes model requests for many providers using the keys your workspace holds. This plugin points Claude Code at it so a small helper on your machine passes each request on and you keep using Claude Code exactly as before.

This is a different plugin from LangSmith tracing since neither needs the other and turning this on does not start tracing your conversations.

## What you need

- Node.js 20 or newer.
- One way to prove who you are, either the LangSmith command line tool or your own single sign-on.

Install the command line tool and finish the sign-in in the browser that opens, or skip this if your employer's single sign-on issues your token instead.

```sh
curl -fsSL https://cli.langsmith.com/install.sh | sh
langsmith auth login
```

## Install

Run these inside Claude Code, where installing changes nothing on its own since routing stays off until you turn it on.

```text
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
/reload-plugins
```

## Turn it on

```text
/langsmith-gateway:setup --scope global
```

If you pay Anthropic through a Claude subscription rather than an API key, add `--use-claude-subscription` so your own Claude login is passed through.

Model requests are routed through the LangSmith LLM gateway.

To stop, run `/langsmith-gateway:disable --scope global` and restart your sessions, though that does not put your earlier settings back.

## Check it is working

```text
/langsmith-gateway:status
```

It says whether your settings point at the helper and whether the helper answers, and since it does not check your sign-in you should send a message to prove the whole path works.

## Configure custom OIDC authentication

This is for people whose LangSmith organization has a custom OIDC provider configured, meaning their employer's own single sign-on. You hand over a token that provider already issues you by giving the plugin a command to run, and whatever that command prints becomes your token:

```text
/langsmith-gateway:setup --scope global --identity-token-command "cat ~/.oidc/profile.jwt" --workspace-id 11111111-2222-3333-4444-555555555555
```

- Quote the command, as above, so you can keep writing flags after it.
- Name your LangSmith workspace too, as the long dashed id in your workspace settings.
- The command runs without the setup your terminal gives you, so write out full paths and print nothing but the token.
- It runs through `/bin/sh`, so this part needs a Unix-like shell.

## When it does not work

Three failures look alike, so read the wording closely.

- **A message from us naming your token command.** The command did not hand back a usable token.
- **A plain unauthorized reply and nothing else.** Suspect your workspace id rather than your token.
- **An error in the model company's own words.** Your identity is fine, so it is the model or the key behind it.

Other things that go wrong:

- **Nothing seems routed.** Restart the session, since an open one keeps the settings it started with.
- **Setup refuses because you already have a sign-in.** Clear it from your settings file and your terminal.
- **Setup will not change a setting, or the local address is taken.** Turn routing off everywhere, wait about 35 seconds, then run setup again.

[LangSmith tracing](./README.md) is the separate plugin that records what the agent did.
