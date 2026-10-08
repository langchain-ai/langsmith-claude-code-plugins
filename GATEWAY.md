# LangSmith Gateway for Claude Code

Sends Claude Code's model requests through LangSmith instead of straight to the model provider.

A small helper program runs on your own machine and Claude Code talks to that instead of the provider. The helper adds your LangSmith credentials and passes each request on to LangSmith's gateway, which holds the provider keys, covers the cost and can record the call. You keep using Claude Code normally.

This is experimental. It is a different plugin from LangSmith tracing, neither one needs the other, and turning this on does not start tracing your conversations.

## What you need

- A Mac or a Linux machine. Windows does not work.
- Node.js 20 or newer.
- The LangSmith command line tool, which is a program you run in your terminal:

  ```sh
  curl -fsSL https://cli.langsmith.com/install.sh | sh
  ```

  Follow the installer's instructions so `langsmith` works in a new terminal, then sign in:

  ```sh
  langsmith auth login
  ```

  Finish the sign-in in the browser that opens. If you plan to use your company identity token instead, you can skip the sign-in, but the tool still has to be installed.

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

Choose `project` to route only the project you are in, or `global` to route every project. Setup points Claude Code at the helper, saves a secret that proves a request came from you, starts the helper and leaves your other settings alone. That secret lands in `.claude/settings.local.json` inside the project, so keep that file out of version control.

Your sign-in is checked on your first message, not during setup, so a missing login shows up then.

## Check it is working

```text
/langsmith-gateway:status
```

It says whether your settings point at the helper and whether the helper answers. It changes nothing and it does not check your LangSmith sign-in, so send a message to prove the whole path works.

## Sign in with your company identity token

Instead of signing into LangSmith, you can hand over a token your employer already issues you, which is a string that proves who you are. You give the plugin a command, the plugin runs that command, and whatever the command prints becomes the token. This works the same way as Claude Code's own `apiKeyHelper` setting.

Say your company's tooling refreshes a token into a file every hour. Point the plugin at that file:

```text
/langsmith-gateway:setup --scope project --workspace-id 11111111-2222-3333-4444-555555555555 --credential-command cat /var/run/acme/langsmith.jwt
```

What to know before you use it:

- Name your LangSmith workspace as well, written as a UUID, which is the long dashed id in your LangSmith workspace settings. Saving it in the command above is the simple route. A program that talks to the helper directly can instead name a workspace on each request, and that choice wins over the saved one.
- Put the command last, because everything after it is treated as the command.
- The command runs through `/bin/sh` from your home directory and gets only your home directory and a plain search path. Nothing your shell profile or virtual environment normally sets up is there, so use absolute paths, and write a small script if you need quotes, pipes or anything else.
- It has to print the token and nothing else, and it has to finish within ten seconds.
- A good result is reused for five minutes, or for less time when the token runs out sooner. Change that window with `--credential-ttl` and a number of seconds between 1 and 3600.
- A failure is remembered for two seconds, and the request that failed is not retried for you.

## When it does not work

Three failures look alike, so read the wording closely.

- **Our own message naming your credential command.** The command did not produce a usable token, because it failed, printed something else, or ran too long. A command that works in your terminal can still fail here, since it runs without your shell profile.
- **A plain unauthorized reply with nothing else in it.** Suspect the workspace rather than the token. LangSmith tells you least when it does not recognise the workspace you named.
- **An error in the model provider's own words.** Your identity is fine and LangSmith reached the provider, so the problem is the key LangSmith used or your access to that model.

Other things that go wrong:

- **Nothing seems routed.** Restart the session, since a session that was already open keeps the settings it started with.
- **Setup refuses to run.** It will not overwrite an API key, an auth token or a key helper you already set, so remove that yourself and try again.
- **The local address is taken.** Wait and run setup again rather than killing whatever is listening.
- **Setup says to disable first.** Changing a saved credential command, workspace, reuse window, port or address means turning routing off everywhere first, since every project shares one helper.
- **A model that is not Anthropic's breaks a feature that counts tokens.** Only Anthropic models can be counted, and there is no automatic fallback.

## Choosing a model

Leave your model settings alone and everything goes to Anthropic as before. Pick another provider with Claude Code's own model selection, for example `/model openai/gpt-4.1`, and LangSmith supplies the key and the billing for it.

## What leaves your machine

Everything in the conversation goes to the gateway, meaning your prompts, your tool inputs and outputs and the replies, with nothing removed. Tracing's mute and redaction settings do not apply to any of it. Only turn this on for a gateway you trust with that content.

By default your Claude subscription credentials are not sent anywhere. Add `--use-claude-subscription` to your setup command and your Claude login is passed through to Anthropic instead, which also means you have to be signed into Claude. Run setup again without it to stop that.

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
