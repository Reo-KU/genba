# Contributing to Genba

Thank you for considering a contribution to Genba.

Pull requests are welcome, especially fixes, focused improvements, tests,
documentation updates, and integrations that fit the project direction.

## Before You Start

For small fixes, feel free to open a pull request directly.

For large changes, architecture changes, licensing-sensitive changes, new
dependencies, hosted/cloud behavior, or major agent workflow changes, please
open an issue first so the direction can be discussed before implementation.

## Contribution License

By submitting a contribution, you agree that your contribution may be included
in Genba, future Genba releases, and future commercial versions or hosted offerings
such as Genba Cloud, Genba Team, or Genba Enterprise.

Unless otherwise agreed in writing, contributions are submitted under the same
license terms as the project at the time of submission.

Genba may introduce a Contributor License Agreement (CLA) or Developer Certificate
of Origin (DCO) process in the future. If that happens, future contributions may
require accepting that process before merge.

## Code and Content Rules

Do not submit:

- code copied from projects with unknown or incompatible licenses;
- snippets copied from blogs, forums, generated examples, or private code where
  the rights are unclear;
- generated AI code if you cannot reasonably confirm that you have the right to
  contribute it;
- vendored source code without explicit approval and license notices;
- GPL, AGPL, SSPL, or other copyleft dependencies without prior discussion; or
- assets, logos, icons, fonts, screenshots, or datasets without clear rights.

New dependencies should be listed in `package.json` and `package-lock.json` and
must be compatible with Genba's source-available licensing model. Update
`THIRD_PARTY_NOTICES.md` when dependency changes affect the notice list.

## Development

```sh
npm install
npm run dev
```

Before submitting:

```sh
npm run build
```

## Trademarks

Do not use Genba, Genba, Genba Cloud, or project logos in a way that suggests your
fork, service, package, or company is the official project. See
[TRADEMARKS.md](TRADEMARKS.md).
