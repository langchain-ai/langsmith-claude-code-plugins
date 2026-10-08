# LangSmith Gateway for Claude Code

Sends Claude Code's model requests through [LangSmith](https://smith.langchain.com) instead of straight to the company that runs the model.

A small helper program runs on your own machine and Claude Code talks to that instead. The helper proves the request is yours and passes it on to LangSmith, which holds the keys to the models, pays for the call and can record it. You keep using Claude Code exactly as before, so nothing about how you work changes.

This is experimental. It is a different plugin from LangSmith tracing, neither one needs the other, and turning this on does not start tracing your conversations.

## What you need

- A Mac or a Linux machine. Windows does not work.
- Node.js 20 or newer.
- One way to prove who you are, either the LangSmith command line tool or your own company identity token.

The command line tool is a program you run in your terminal. Install it, follow its instructions so `langsmith` works in a new terminal, then sign in:

```sh
curl -fsSL https://cli.langsmith.com/install.sh | sh
langsmith auth login
```

Finish the sign-in in the browser that opens. Skip all of that if you use a company identity token instead, since setup then never looks for the tool.

## Install

Run these inside Claude Code:

```text
/plugin marketplace add langchain-ai/langsmith-claude-code-plugins
/plugin install langsmith-gateway@langsmith-claude-code-plugins --scope user
/reload-plugins
```

Installing changes nothing by itself, since routing stays off until you turn it on.

## Turn it on

```text
/langsmith-gateway:setup --scope project
```

Choose `project` to route only the project you are in, or `global` to route every project. Setup points Claude Code at the helper, saves a secret that proves a request came from you, starts the helper and leaves your other settings alone. That secret lands in a settings file inside the project, at `.claude/settings.local.json`, so do not commit that file to git.

Your sign-in is checked on your first message, not during setup, so a missing login shows up then.

## Check it is working

```text
/langsmith-gateway:status
```

It says whether your settings point at the helper and whether the helper answers. It changes nothing and it does not check your LangSmith sign-in, so send a message to prove the whole path works.

## Sign in with your company identity token

Instead of signing into LangSmith, you can hand over a token your employer already issues you, which is a string that proves who you are. You give the plugin a command to run, and whatever that command prints becomes your token.

Say something at work keeps a fresh token in the file `~/.oidc/profile.jwt`, so your command only has to print that file. Put your own workspace id in, and keep `--use-claude-subscription` only if you pay Anthropic through your own Claude login:

```text
/langsmith-gateway:setup --scope project --use-claude-subscription --workspace-id 11111111-2222-3333-4444-555555555555 --identity-token-command cat ~/.oidc/profile.jwt
```

What to know before you use it:

- Name your LangSmith workspace as well, written as a UUID, which is the long dashed id in your LangSmith workspace settings.
- Put the command last, because everything after it is swallowed into the command. A flag written after it is read as part of the command and quietly stops being a flag.
- The command runs on its own, without any of the setup your terminal normally gives you, so write out full paths and put anything fancier in a small script.
- It has to print the token and nothing else, and it has to finish within ten seconds.
- A good result is reused for five minutes, or for less time when the token runs out sooner. Change that window with `--identity-token-ttl` and a number of seconds between 1 and 3600.
- A failure is remembered for two seconds, and the request that failed is not retried for you.

## When it does not work

Three failures look alike, so read the wording closely.

- **A message from us that names your token command.** The command did not hand back a usable token, because it failed, printed something else, or took too long. A command that works in your terminal can still fail here, since it runs without your shell profile.
- **A plain unauthorized reply with nothing else in it.** Suspect the workspace rather than the token. A workspace id that is not a real workspace comes back exactly like a bad token, with nothing to tell you which it was.
- **An error in the model provider's own words.** Your identity is fine and LangSmith reached the provider, so the problem is the key LangSmith used or your access to that model.

Other things that go wrong:

- **Nothing seems routed.** Restart the session, since a session that was already open keeps the settings it started with.
- **Setup refuses because you already have a sign-in of your own.** It will not overwrite one. It looks in your settings file and in the terminal you started Claude Code from, so clear it in both places.
- **The local address is taken.** Wait about 35 seconds and run setup again, rather than killing whatever is listening.
- **Something that counts your usage stops working on another company's model.** Only Anthropic's models can be counted, and nothing fills the gap.

## Change your setup later

Setup will not change your workspace, your token command or any of the other choices you made while routing is still on, because every project shares one helper and it is still running with the old ones. Change them like this:

1. Turn routing off for every scope you turned on, so both `--scope project` and `--scope global` if you used both.
2. Run setup again with the new options. If it says the local address is still busy, wait about 35 seconds and run it again.
3. Restart every session that is still open.

## Choosing a model

Leave your model settings alone and everything goes to Anthropic as before. Pick another provider with Claude Code's own model selection, for example `/model openai/gpt-4.1`, and LangSmith supplies the key and the billing for it.

## What leaves your machine

Everything in the conversation goes to the gateway, meaning your prompts, your tool inputs and outputs and the replies, with nothing removed. Tracing's mute and redaction settings do not apply to any of it. Only turn this on for a gateway you trust with that content.

By default your Claude subscription credentials are not sent anywhere. Add `--use-claude-subscription` to your setup command and your Claude login is passed through to Anthropic instead, which also means you have to be signed into Claude. Run setup again without it to stop that, which works only when this is the one scope you turned on.

## Turn it off

```text
/langsmith-gateway:disable --scope project
```

Run it again for the global scope if you turned both on, then restart any session that is still open. Your earlier settings are not put back, so set them again if you had any.

## Rolling it out for a team

An administrator can install the plugin, write the same local address and key into Claude Code's managed settings, and place the saved configuration in each person's home directory under `.claude/langsmith-proxy/config.json`, owned by them and readable by nobody else. Give each person their own key rather than one key for everyone. Each person still signs in as themselves, because tokens are never handed out by an administrator. Routing that comes from managed settings has to be removed the same way, since the commands above only edit a person's own settings.

## More

- [LangSmith tracing](./README.md), the separate plugin that records what the agent did
- [Developer checks](./TESTING.md#experimental-gateway-tests)
