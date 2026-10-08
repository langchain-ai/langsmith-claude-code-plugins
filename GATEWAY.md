# LangSmith Gateway for Claude Code

Sends Claude Code's model requests through [LangSmith](https://smith.langchain.com) instead of straight to the company that runs the model. A small helper program runs on your machine and passes each request on, and LangSmith holds the keys, pays for the call and can record it. You keep using Claude Code exactly as before.

This is a different plugin from LangSmith tracing. Neither needs the other, and turning this on does not start tracing your conversations.

## What you need

- A Mac or a Linux machine. Windows does not work.
- Node.js 20 or newer.
- One way to prove who you are, either the LangSmith command line tool or your own company identity token.

Install the command line tool, then finish the sign-in in the browser that opens. Skip this if you use a company identity token.

```sh
curl -fsSL https://cli.langsmith.com/install.sh | sh
langsmith auth login
```

## Install

Run these inside Claude Code. Installing changes nothing on its own, since routing stays off until you turn it on.

```text
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
/reload-plugins
```

## Turn it on

```text
/langsmith-gateway:setup --scope project
```

Choose `project` to route only the project you are in, or `global` to route every project. Setup saves a secret in the project's `.claude/settings.local.json`, so do not commit that file to git. Your sign-in is checked on your first message, not during setup.

Everything in the conversation reaches LangSmith, meaning your prompts, your tool inputs and outputs and the replies, with nothing removed. Only turn this on for a gateway you trust with that content. Your Claude login stays out of it unless you add `--use-claude-subscription`, which passes it through to Anthropic.

Keep using Anthropic's models and nothing else changes, or pick another company with `/model openai/gpt-4.1` and LangSmith supplies the key.

To stop, run `/langsmith-gateway:disable --scope project`, and again with `--scope global` if you turned both on, then restart your sessions. Your earlier settings are not put back.

## Check it is working

```text
/langsmith-gateway:status
```

It says whether your settings point at the helper and whether the helper answers. It does not check your sign-in, so send a message to prove the whole path works.

## Sign in with your company identity token

Instead of signing into LangSmith, hand over a token your employer already issues you. You give the plugin a command to run, and whatever that command prints becomes your token. Say something at work keeps a fresh token in `~/.oidc/profile.jwt`, so your command only has to print that file:

```text
/langsmith-gateway:setup --scope project --workspace-id 11111111-2222-3333-4444-555555555555 --identity-token-command cat ~/.oidc/profile.jwt
```

- Name your LangSmith workspace too, as the long dashed id in your workspace settings.
- Put the command last, because everything after it is swallowed into the command.
- The command runs without the setup your terminal normally gives you, so write out full paths.
- It has to print the token and nothing else, and finish within ten seconds.
- A good token is reused for five minutes. Change that with `--identity-token-ttl` and a number of seconds.

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
