# MAO

MAO is an AI agent organization OS.

It lets you connect multiple AI coding and assistant CLIs, such as Claude,
Codex, GPT-compatible tools, Gemini, Grok, and custom commands, assign roles to
them, and coordinate their work as an interactive organization chart. Agents can
be arranged as upstream managers, downstream workers, and peers, then run
together through a visual map and embedded terminals.

MAO is a source-available project. Self-hosting, personal use, learning,
research, development, internal company use, forks, modifications, and pull
requests are allowed under the license terms.

Commercial hosted competing services are not allowed. You may not offer MAO, a
modified MAO, or a substantially similar derivative as a hosted SaaS, cloud
service, managed service, hosted agent-orchestration service, or competing
automation platform without a separate written commercial license.

License details are in [LICENSE](LICENSE). Third-party dependency notices are
in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

MAO, MAO OS, and MAO Cloud are trademarks and brand names of Reo Komai. See
[TRADEMARKS.md](TRADEMARKS.md).

Official repository:
[github.com/Reo-KU/multi-agent-orchestrator](https://github.com/Reo-KU/multi-agent-orchestrator)

Issues:
[GitHub Issues](https://github.com/Reo-KU/multi-agent-orchestrator/issues)

Licensing and commercial inquiries:
[imopotato8@gmail.com](mailto:imopotato8@gmail.com)

> MAO does not bundle Claude, Codex, Gemini, Grok, GPT, or other agent CLIs.
> It starts the commands you configure, and each CLI remains governed by its
> own vendor terms.

## Features

- Visual multi-agent organization map
- Upstream, downstream, and peer relationship awareness
- Independent organization planner for generating active-agent briefs
- Interactive agent terminals backed by tmux and ttyd
- Support for Claude, Codex, Gemini, Grok, and custom allowlisted commands
- Per-agent execution modes and permission policy controls
- Persistent task artifacts under `mao_artifacts/`
- Temporary MAO control files under `.mao/`

## Requirements

Required:

| Tool | Why |
|---|---|
| Node.js 20+ | App runtime and build tooling |
| tmux | Interactive agent session backend |
| ttyd | Embedded web terminal for tmux |

Optional agent CLIs:

| CLI | Typical use |
|---|---|
| `claude` | Claude Code agents and organization planner |
| `codex` | Codex agents |
| `gemini` | Gemini CLI agents |
| `grok` | Grok CLI agents |
| `sh`, `bash`, `zsh`, `python`, `python3`, `node` | Custom local commands |

Install and authenticate the CLIs you want to use before adding them as agents.

## Development

```sh
npm install
npm run dev
```

Build:

```sh
npm run build
```

Package:

```sh
npm run dist
```

## Workspace Files

MAO stores app-level workspace state under:

```text
~/.multi-agent-orchestrator/workspaces/default/
```

Inside each agent working directory, MAO may create:

| Path | Purpose |
|---|---|
| `.mao/` | Temporary control files, briefs, dispatches, and completion signals |
| `mao_artifacts/` | Persistent task outputs created by agents |

`.mao/` is control state and may be cleaned or regenerated. Do not store final
deliverables there. Use `mao_artifacts/` for outputs that should survive
organization saves and task cleanup.

## License Summary

MAO is licensed under the Business Source License 1.1 with an Additional Use
Grant for personal, educational, research, development, self-hosted, and
internal business use.

The current proposed Change Date is `2030-06-01`. On the Change Date, the
covered version changes to the Apache License 2.0 unless a later release states
different parameters.

This summary is not a substitute for [LICENSE](LICENSE).

## Contributing

Pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before submitting changes.
