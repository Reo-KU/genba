# Third Party Notices

This file summarizes third-party dependencies identified before public release. It is generated from `package.json`, `package-lock.json`, local `node_modules/*/package.json` metadata where available, and a manual scan of external CLI dependencies referenced by the app.

Audit date: 2026-06-01

## Summary

- npm package entries scanned: 596
- Risk counts: low 584, medium 12, high 0
- License families found: MIT (485), BSD-2-Clause (12), Apache-2.0 (22), ISC (55), Python-2.0 (1), CC-BY-4.0 (1), BlueOak-1.0.0 (8), BSD-3-Clause (8), WTFPL OR ISC (1), WTFPL (1), (MIT OR CC0-1.0) (1), (WTFPL OR MIT) (1)
- No GPL, AGPL, SSPL, or unknown-license npm packages were found in `package-lock.json` during this scan.
- No vendored source directory, copied snippet attribution, `requirements.txt`, `pyproject.toml`, or `Dockerfile` was found in the repository root scan.

## External Tools and CLIs

| Dependency name | Version | License | Source URL | Usage location | Risk | Note |
|---|---:|---|---|---|---|---|
| Node.js | User-installed runtime | MIT | https://nodejs.org/ | Required system tool; runs Electron/Vite app. | low | Not vendored. User installs separately. |
| tmux | User-installed binary | ISC | https://github.com/tmux/tmux | Required for interactive agent panes. | low | Not vendored. User installs separately. |
| ttyd | User-installed binary | MIT | https://github.com/tsl0922/ttyd | Required to render tmux in the embedded terminal. | low | Not vendored. User installs separately. |
| Claude Code CLI | User-installed optional CLI | Proprietary / vendor terms | https://docs.anthropic.com/ | Optional external agent command: claude. | medium | Not bundled. Users must comply with Anthropic terms. |
| OpenAI Codex CLI | User-installed optional CLI | Vendor project terms | https://github.com/openai/codex | Optional external agent command: codex. | medium | Not bundled. Users must comply with OpenAI/project terms. |
| Google Gemini CLI | User-installed optional CLI | Vendor project terms | https://github.com/google-gemini/gemini-cli | Optional external agent command: gemini. | medium | Not bundled. Users must comply with Google/project terms. |
| xAI Grok CLI | User-installed optional CLI | Vendor/project terms | https://x.ai/ | Optional external agent command: grok. | medium | Not bundled; exact CLI package should be verified before recommending. |
| System shells and runtimes | User-installed commands | Varies by OS/runtime | https://opensource.org/licenses | Optional custom commands: sh, bash, zsh, python, python3, node. | medium | Not bundled. Distribution packaging should be reviewed per target OS. |

## npm Dependencies

| Dependency name | Version | License | Source URL | Usage location | Risk | Note |
|---|---:|---|---|---|---|---|
| @alloc/quick-lru | 5.2.0 | MIT | https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz | transitive (node_modules/@alloc/quick-lru) | low | Transitive dependency from package-lock.json. |
| @babel/code-frame | 7.29.0 | MIT | https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.0.tgz | transitive (node_modules/@babel/code-frame) | low | Transitive dependency from package-lock.json. |
| @babel/compat-data | 7.29.3 | MIT | https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.3.tgz | transitive (node_modules/@babel/compat-data) | low | Transitive dependency from package-lock.json. |
| @babel/core | 7.29.0 | MIT | https://registry.npmjs.org/@babel/core/-/core-7.29.0.tgz | transitive (node_modules/@babel/core) | low | Transitive dependency from package-lock.json. |
| @babel/generator | 7.29.1 | MIT | https://registry.npmjs.org/@babel/generator/-/generator-7.29.1.tgz | transitive (node_modules/@babel/generator) | low | Transitive dependency from package-lock.json. |
| @babel/helper-compilation-targets | 7.28.6 | MIT | https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.28.6.tgz | transitive (node_modules/@babel/helper-compilation-targets) | low | Transitive dependency from package-lock.json. |
| @babel/helper-globals | 7.28.0 | MIT | https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.28.0.tgz | transitive (node_modules/@babel/helper-globals) | low | Transitive dependency from package-lock.json. |
| @babel/helper-module-imports | 7.28.6 | MIT | https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.28.6.tgz | transitive (node_modules/@babel/helper-module-imports) | low | Transitive dependency from package-lock.json. |
| @babel/helper-module-transforms | 7.28.6 | MIT | https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.28.6.tgz | transitive (node_modules/@babel/helper-module-transforms) | low | Transitive dependency from package-lock.json. |
| @babel/helper-plugin-utils | 7.28.6 | MIT | https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.28.6.tgz | transitive (node_modules/@babel/helper-plugin-utils) | low | Transitive dependency from package-lock.json. |
| @babel/helper-string-parser | 7.27.1 | MIT | https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz | transitive (node_modules/@babel/helper-string-parser) | low | Transitive dependency from package-lock.json. |
| @babel/helper-validator-identifier | 7.28.5 | MIT | https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz | transitive (node_modules/@babel/helper-validator-identifier) | low | Transitive dependency from package-lock.json. |
| @babel/helper-validator-option | 7.27.1 | MIT | https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.27.1.tgz | transitive (node_modules/@babel/helper-validator-option) | low | Transitive dependency from package-lock.json. |
| @babel/helpers | 7.29.2 | MIT | https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.2.tgz | transitive (node_modules/@babel/helpers) | low | Transitive dependency from package-lock.json. |
| @babel/parser | 7.29.3 | MIT | https://registry.npmjs.org/@babel/parser/-/parser-7.29.3.tgz | transitive (node_modules/@babel/parser) | low | Transitive dependency from package-lock.json. |
| @babel/plugin-transform-arrow-functions | 7.27.1 | MIT | https://registry.npmjs.org/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.27.1.tgz | transitive (node_modules/@babel/plugin-transform-arrow-functions) | low | Transitive dependency from package-lock.json. |
| @babel/template | 7.28.6 | MIT | https://registry.npmjs.org/@babel/template/-/template-7.28.6.tgz | transitive (node_modules/@babel/template) | low | Transitive dependency from package-lock.json. |
| @babel/traverse | 7.29.0 | MIT | https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.0.tgz | transitive (node_modules/@babel/traverse) | low | Transitive dependency from package-lock.json. |
| @babel/types | 7.29.0 | MIT | https://registry.npmjs.org/@babel/types/-/types-7.29.0.tgz | transitive (node_modules/@babel/types) | low | Transitive dependency from package-lock.json. |
| @develar/schema-utils | 2.6.5 | MIT | https://registry.npmjs.org/@develar/schema-utils/-/schema-utils-2.6.5.tgz | transitive (node_modules/@develar/schema-utils) | low | Transitive dependency from package-lock.json. |
| @electron/asar | 3.4.1 | MIT | https://registry.npmjs.org/@electron/asar/-/asar-3.4.1.tgz | transitive (node_modules/@electron/asar) | low | Transitive dependency from package-lock.json. |
| @electron/fuses | 1.8.0 | MIT | https://registry.npmjs.org/@electron/fuses/-/fuses-1.8.0.tgz | transitive (node_modules/@electron/fuses) | low | Transitive dependency from package-lock.json. |
| @electron/get | 3.1.0 | MIT | https://registry.npmjs.org/@electron/get/-/get-3.1.0.tgz | transitive (node_modules/app-builder-lib/node_modules/@electron/get) | low | Transitive dependency from package-lock.json. |
| @electron/get | 5.0.0 | MIT | https://registry.npmjs.org/@electron/get/-/get-5.0.0.tgz | transitive (node_modules/@electron/get) | low | Transitive dependency from package-lock.json. |
| @electron/notarize | 2.5.0 | MIT | https://registry.npmjs.org/@electron/notarize/-/notarize-2.5.0.tgz | transitive (node_modules/@electron/notarize) | low | Transitive dependency from package-lock.json. |
| @electron/osx-sign | 1.3.3 | BSD-2-Clause | https://registry.npmjs.org/@electron/osx-sign/-/osx-sign-1.3.3.tgz | transitive (node_modules/@electron/osx-sign) | low | Transitive dependency from package-lock.json. |
| @electron/rebuild | 4.0.4 | MIT | https://registry.npmjs.org/@electron/rebuild/-/rebuild-4.0.4.tgz | transitive (node_modules/@electron/rebuild) | low | Transitive dependency from package-lock.json. |
| @electron/universal | 2.0.3 | MIT | https://registry.npmjs.org/@electron/universal/-/universal-2.0.3.tgz | transitive (node_modules/@electron/universal) | low | Transitive dependency from package-lock.json. |
| @electron/windows-sign | 1.2.2 | BSD-2-Clause | https://registry.npmjs.org/@electron/windows-sign/-/windows-sign-1.2.2.tgz | transitive (node_modules/@electron/windows-sign) | low | Transitive dependency from package-lock.json. |
| @esbuild/aix-ppc64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.25.12.tgz | transitive (node_modules/@esbuild/aix-ppc64) | low | Transitive dependency from package-lock.json. |
| @esbuild/aix-ppc64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/aix-ppc64) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-arm | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.25.12.tgz | transitive (node_modules/@esbuild/android-arm) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-arm | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/android-arm) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/android-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/android-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.25.12.tgz | transitive (node_modules/@esbuild/android-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/android-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/android-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/darwin-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.12.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @esbuild/darwin-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.27.7.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @esbuild/darwin-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.25.12.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @esbuild/darwin-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.27.7.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @esbuild/freebsd-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/freebsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/freebsd-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/freebsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/freebsd-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.25.12.tgz | transitive (node_modules/@esbuild/freebsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/freebsd-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/freebsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-arm | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.25.12.tgz | transitive (node_modules/@esbuild/linux-arm) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-arm | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-arm) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/linux-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-ia32 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.25.12.tgz | transitive (node_modules/@esbuild/linux-ia32) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-ia32 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-ia32) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-loong64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.25.12.tgz | transitive (node_modules/@esbuild/linux-loong64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-loong64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-loong64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-mips64el | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.25.12.tgz | transitive (node_modules/@esbuild/linux-mips64el) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-mips64el | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-mips64el) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-ppc64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.25.12.tgz | transitive (node_modules/@esbuild/linux-ppc64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-ppc64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-ppc64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-riscv64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.25.12.tgz | transitive (node_modules/@esbuild/linux-riscv64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-riscv64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-riscv64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-s390x | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.25.12.tgz | transitive (node_modules/@esbuild/linux-s390x) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-s390x | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-s390x) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.25.12.tgz | transitive (node_modules/@esbuild/linux-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/linux-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/linux-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/netbsd-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/netbsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/netbsd-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/netbsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/netbsd-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.25.12.tgz | transitive (node_modules/@esbuild/netbsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/netbsd-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/netbsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openbsd-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/openbsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openbsd-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/openbsd-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openbsd-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.25.12.tgz | transitive (node_modules/@esbuild/openbsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openbsd-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/openbsd-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openharmony-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/openharmony-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/openharmony-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/openharmony-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/sunos-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.25.12.tgz | transitive (node_modules/@esbuild/sunos-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/sunos-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/sunos-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-arm64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.25.12.tgz | transitive (node_modules/@esbuild/win32-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-arm64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/win32-arm64) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-ia32 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.25.12.tgz | transitive (node_modules/@esbuild/win32-ia32) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-ia32 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/win32-ia32) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-x64 | 0.25.12 | MIT | https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.25.12.tgz | transitive (node_modules/@esbuild/win32-x64) | low | Transitive dependency from package-lock.json. |
| @esbuild/win32-x64 | 0.27.7 | MIT | https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.27.7.tgz | transitive (node_modules/vite/node_modules/@esbuild/win32-x64) | low | Transitive dependency from package-lock.json. |
| @eslint-community/eslint-utils | 4.9.1 | MIT | https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.9.1.tgz | transitive (node_modules/@eslint-community/eslint-utils) | low | Transitive dependency from package-lock.json. |
| @eslint-community/regexpp | 4.12.2 | MIT | https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.2.tgz | transitive (node_modules/@eslint-community/regexpp) | low | Transitive dependency from package-lock.json. |
| @eslint/config-array | 0.23.5 | Apache-2.0 | https://registry.npmjs.org/@eslint/config-array/-/config-array-0.23.5.tgz | transitive (node_modules/@eslint/config-array) | low | Transitive dependency from package-lock.json. |
| @eslint/config-helpers | 0.6.0 | Apache-2.0 | https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.6.0.tgz | transitive (node_modules/@eslint/config-helpers) | low | Transitive dependency from package-lock.json. |
| @eslint/core | 1.2.1 | Apache-2.0 | https://registry.npmjs.org/@eslint/core/-/core-1.2.1.tgz | transitive (node_modules/@eslint/core) | low | Transitive dependency from package-lock.json. |
| @eslint/object-schema | 3.0.5 | Apache-2.0 | https://registry.npmjs.org/@eslint/object-schema/-/object-schema-3.0.5.tgz | transitive (node_modules/@eslint/object-schema) | low | Transitive dependency from package-lock.json. |
| @eslint/plugin-kit | 0.7.1 | Apache-2.0 | https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.7.1.tgz | transitive (node_modules/@eslint/plugin-kit) | low | Transitive dependency from package-lock.json. |
| @humanfs/core | 0.19.2 | Apache-2.0 | https://registry.npmjs.org/@humanfs/core/-/core-0.19.2.tgz | transitive (node_modules/@humanfs/core) | low | Transitive dependency from package-lock.json. |
| @humanfs/node | 0.16.8 | Apache-2.0 | https://registry.npmjs.org/@humanfs/node/-/node-0.16.8.tgz | transitive (node_modules/@humanfs/node) | low | Transitive dependency from package-lock.json. |
| @humanfs/types | 0.15.0 | Apache-2.0 | https://registry.npmjs.org/@humanfs/types/-/types-0.15.0.tgz | transitive (node_modules/@humanfs/types) | low | Transitive dependency from package-lock.json. |
| @humanwhocodes/module-importer | 1.0.1 | Apache-2.0 | https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz | transitive (node_modules/@humanwhocodes/module-importer) | low | Transitive dependency from package-lock.json. |
| @humanwhocodes/retry | 0.4.3 | Apache-2.0 | https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz | transitive (node_modules/@humanwhocodes/retry) | low | Transitive dependency from package-lock.json. |
| @isaacs/fs-minipass | 4.0.1 | ISC | https://registry.npmjs.org/@isaacs/fs-minipass/-/fs-minipass-4.0.1.tgz | transitive (node_modules/@isaacs/fs-minipass) | low | Transitive dependency from package-lock.json. |
| @jridgewell/gen-mapping | 0.3.13 | MIT | https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz | transitive (node_modules/@jridgewell/gen-mapping) | low | Transitive dependency from package-lock.json. |
| @jridgewell/remapping | 2.3.5 | MIT | https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz | transitive (node_modules/@jridgewell/remapping) | low | Transitive dependency from package-lock.json. |
| @jridgewell/resolve-uri | 3.1.2 | MIT | https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz | transitive (node_modules/@jridgewell/resolve-uri) | low | Transitive dependency from package-lock.json. |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT | https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz | transitive (node_modules/@jridgewell/sourcemap-codec) | low | Transitive dependency from package-lock.json. |
| @jridgewell/trace-mapping | 0.3.31 | MIT | https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz | transitive (node_modules/@jridgewell/trace-mapping) | low | Transitive dependency from package-lock.json. |
| @malept/cross-spawn-promise | 2.0.0 | Apache-2.0 | https://registry.npmjs.org/@malept/cross-spawn-promise/-/cross-spawn-promise-2.0.0.tgz | transitive (node_modules/@malept/cross-spawn-promise) | low | Transitive dependency from package-lock.json. |
| @malept/flatpak-bundler | 0.4.0 | MIT | https://registry.npmjs.org/@malept/flatpak-bundler/-/flatpak-bundler-0.4.0.tgz | transitive (node_modules/@malept/flatpak-bundler) | low | Transitive dependency from package-lock.json. |
| @nodelib/fs.scandir | 2.1.5 | MIT | https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz | transitive (node_modules/@nodelib/fs.scandir) | low | Transitive dependency from package-lock.json. |
| @nodelib/fs.stat | 2.0.5 | MIT | https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz | transitive (node_modules/@nodelib/fs.stat) | low | Transitive dependency from package-lock.json. |
| @nodelib/fs.walk | 1.2.8 | MIT | https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz | transitive (node_modules/@nodelib/fs.walk) | low | Transitive dependency from package-lock.json. |
| @reactflow/background | 11.3.14 | MIT | https://registry.npmjs.org/@reactflow/background/-/background-11.3.14.tgz | transitive (node_modules/@reactflow/background) | low | Transitive dependency from package-lock.json. |
| @reactflow/controls | 11.2.14 | MIT | https://registry.npmjs.org/@reactflow/controls/-/controls-11.2.14.tgz | transitive (node_modules/@reactflow/controls) | low | Transitive dependency from package-lock.json. |
| @reactflow/core | 11.11.4 | MIT | https://registry.npmjs.org/@reactflow/core/-/core-11.11.4.tgz | transitive (node_modules/@reactflow/core) | low | Transitive dependency from package-lock.json. |
| @reactflow/minimap | 11.7.14 | MIT | https://registry.npmjs.org/@reactflow/minimap/-/minimap-11.7.14.tgz | transitive (node_modules/@reactflow/minimap) | low | Transitive dependency from package-lock.json. |
| @reactflow/node-resizer | 2.2.14 | MIT | https://registry.npmjs.org/@reactflow/node-resizer/-/node-resizer-2.2.14.tgz | transitive (node_modules/@reactflow/node-resizer) | low | Transitive dependency from package-lock.json. |
| @reactflow/node-toolbar | 1.3.14 | MIT | https://registry.npmjs.org/@reactflow/node-toolbar/-/node-toolbar-1.3.14.tgz | transitive (node_modules/@reactflow/node-toolbar) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-android-arm-eabi | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.60.4.tgz | transitive (node_modules/@rollup/rollup-android-arm-eabi) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-android-arm64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.60.4.tgz | transitive (node_modules/@rollup/rollup-android-arm64) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-darwin-arm64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.60.4.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @rollup/rollup-darwin-x64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.60.4.tgz | optionalDependencies | low | Direct dependency from package.json. |
| @rollup/rollup-freebsd-arm64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.60.4.tgz | transitive (node_modules/@rollup/rollup-freebsd-arm64) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-freebsd-x64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.60.4.tgz | transitive (node_modules/@rollup/rollup-freebsd-x64) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-arm-gnueabihf | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-arm-gnueabihf) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-arm-musleabihf | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-arm-musleabihf) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-arm64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-arm64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-arm64-musl | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-arm64-musl) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-loong64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-loong64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-loong64-musl | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-loong64-musl) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-ppc64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-ppc64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-ppc64-musl | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-ppc64-musl) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-riscv64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-riscv64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-riscv64-musl | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-riscv64-musl) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-s390x-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-s390x-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-x64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-x64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-linux-x64-musl | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.60.4.tgz | transitive (node_modules/@rollup/rollup-linux-x64-musl) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-openbsd-x64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.60.4.tgz | transitive (node_modules/@rollup/rollup-openbsd-x64) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-openharmony-arm64 | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.60.4.tgz | transitive (node_modules/@rollup/rollup-openharmony-arm64) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-win32-arm64-msvc | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.60.4.tgz | transitive (node_modules/@rollup/rollup-win32-arm64-msvc) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-win32-ia32-msvc | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.60.4.tgz | transitive (node_modules/@rollup/rollup-win32-ia32-msvc) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-win32-x64-gnu | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.60.4.tgz | transitive (node_modules/@rollup/rollup-win32-x64-gnu) | low | Transitive dependency from package-lock.json. |
| @rollup/rollup-win32-x64-msvc | 4.60.4 | MIT | https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.60.4.tgz | transitive (node_modules/@rollup/rollup-win32-x64-msvc) | low | Transitive dependency from package-lock.json. |
| @sindresorhus/is | 4.6.0 | MIT | https://registry.npmjs.org/@sindresorhus/is/-/is-4.6.0.tgz | transitive (node_modules/@sindresorhus/is) | low | Transitive dependency from package-lock.json. |
| @szmarczak/http-timer | 4.0.6 | MIT | https://registry.npmjs.org/@szmarczak/http-timer/-/http-timer-4.0.6.tgz | transitive (node_modules/@szmarczak/http-timer) | low | Transitive dependency from package-lock.json. |
| @types/cacheable-request | 6.0.3 | MIT | https://registry.npmjs.org/@types/cacheable-request/-/cacheable-request-6.0.3.tgz | transitive (node_modules/@types/cacheable-request) | low | Transitive dependency from package-lock.json. |
| @types/d3 | 7.4.3 | MIT | https://registry.npmjs.org/@types/d3/-/d3-7.4.3.tgz | transitive (node_modules/@types/d3) | low | Transitive dependency from package-lock.json. |
| @types/d3-array | 3.2.2 | MIT | https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.2.tgz | transitive (node_modules/@types/d3-array) | low | Transitive dependency from package-lock.json. |
| @types/d3-axis | 3.0.6 | MIT | https://registry.npmjs.org/@types/d3-axis/-/d3-axis-3.0.6.tgz | transitive (node_modules/@types/d3-axis) | low | Transitive dependency from package-lock.json. |
| @types/d3-brush | 3.0.6 | MIT | https://registry.npmjs.org/@types/d3-brush/-/d3-brush-3.0.6.tgz | transitive (node_modules/@types/d3-brush) | low | Transitive dependency from package-lock.json. |
| @types/d3-chord | 3.0.6 | MIT | https://registry.npmjs.org/@types/d3-chord/-/d3-chord-3.0.6.tgz | transitive (node_modules/@types/d3-chord) | low | Transitive dependency from package-lock.json. |
| @types/d3-color | 3.1.3 | MIT | https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz | transitive (node_modules/@types/d3-color) | low | Transitive dependency from package-lock.json. |
| @types/d3-contour | 3.0.6 | MIT | https://registry.npmjs.org/@types/d3-contour/-/d3-contour-3.0.6.tgz | transitive (node_modules/@types/d3-contour) | low | Transitive dependency from package-lock.json. |
| @types/d3-delaunay | 6.0.4 | MIT | https://registry.npmjs.org/@types/d3-delaunay/-/d3-delaunay-6.0.4.tgz | transitive (node_modules/@types/d3-delaunay) | low | Transitive dependency from package-lock.json. |
| @types/d3-dispatch | 3.0.7 | MIT | https://registry.npmjs.org/@types/d3-dispatch/-/d3-dispatch-3.0.7.tgz | transitive (node_modules/@types/d3-dispatch) | low | Transitive dependency from package-lock.json. |
| @types/d3-drag | 3.0.7 | MIT | https://registry.npmjs.org/@types/d3-drag/-/d3-drag-3.0.7.tgz | transitive (node_modules/@types/d3-drag) | low | Transitive dependency from package-lock.json. |
| @types/d3-dsv | 3.0.7 | MIT | https://registry.npmjs.org/@types/d3-dsv/-/d3-dsv-3.0.7.tgz | transitive (node_modules/@types/d3-dsv) | low | Transitive dependency from package-lock.json. |
| @types/d3-ease | 3.0.2 | MIT | https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz | transitive (node_modules/@types/d3-ease) | low | Transitive dependency from package-lock.json. |
| @types/d3-fetch | 3.0.7 | MIT | https://registry.npmjs.org/@types/d3-fetch/-/d3-fetch-3.0.7.tgz | transitive (node_modules/@types/d3-fetch) | low | Transitive dependency from package-lock.json. |
| @types/d3-force | 3.0.10 | MIT | https://registry.npmjs.org/@types/d3-force/-/d3-force-3.0.10.tgz | transitive (node_modules/@types/d3-force) | low | Transitive dependency from package-lock.json. |
| @types/d3-format | 3.0.4 | MIT | https://registry.npmjs.org/@types/d3-format/-/d3-format-3.0.4.tgz | transitive (node_modules/@types/d3-format) | low | Transitive dependency from package-lock.json. |
| @types/d3-geo | 3.1.0 | MIT | https://registry.npmjs.org/@types/d3-geo/-/d3-geo-3.1.0.tgz | transitive (node_modules/@types/d3-geo) | low | Transitive dependency from package-lock.json. |
| @types/d3-hierarchy | 3.1.7 | MIT | https://registry.npmjs.org/@types/d3-hierarchy/-/d3-hierarchy-3.1.7.tgz | transitive (node_modules/@types/d3-hierarchy) | low | Transitive dependency from package-lock.json. |
| @types/d3-interpolate | 3.0.4 | MIT | https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz | transitive (node_modules/@types/d3-interpolate) | low | Transitive dependency from package-lock.json. |
| @types/d3-path | 3.1.1 | MIT | https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.1.tgz | transitive (node_modules/@types/d3-path) | low | Transitive dependency from package-lock.json. |
| @types/d3-polygon | 3.0.2 | MIT | https://registry.npmjs.org/@types/d3-polygon/-/d3-polygon-3.0.2.tgz | transitive (node_modules/@types/d3-polygon) | low | Transitive dependency from package-lock.json. |
| @types/d3-quadtree | 3.0.6 | MIT | https://registry.npmjs.org/@types/d3-quadtree/-/d3-quadtree-3.0.6.tgz | transitive (node_modules/@types/d3-quadtree) | low | Transitive dependency from package-lock.json. |
| @types/d3-random | 3.0.3 | MIT | https://registry.npmjs.org/@types/d3-random/-/d3-random-3.0.3.tgz | transitive (node_modules/@types/d3-random) | low | Transitive dependency from package-lock.json. |
| @types/d3-scale | 4.0.9 | MIT | https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.9.tgz | transitive (node_modules/@types/d3-scale) | low | Transitive dependency from package-lock.json. |
| @types/d3-scale-chromatic | 3.1.0 | MIT | https://registry.npmjs.org/@types/d3-scale-chromatic/-/d3-scale-chromatic-3.1.0.tgz | transitive (node_modules/@types/d3-scale-chromatic) | low | Transitive dependency from package-lock.json. |
| @types/d3-selection | 3.0.11 | MIT | https://registry.npmjs.org/@types/d3-selection/-/d3-selection-3.0.11.tgz | transitive (node_modules/@types/d3-selection) | low | Transitive dependency from package-lock.json. |
| @types/d3-shape | 3.1.8 | MIT | https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.1.8.tgz | transitive (node_modules/@types/d3-shape) | low | Transitive dependency from package-lock.json. |
| @types/d3-time | 3.0.4 | MIT | https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.4.tgz | transitive (node_modules/@types/d3-time) | low | Transitive dependency from package-lock.json. |
| @types/d3-time-format | 4.0.3 | MIT | https://registry.npmjs.org/@types/d3-time-format/-/d3-time-format-4.0.3.tgz | transitive (node_modules/@types/d3-time-format) | low | Transitive dependency from package-lock.json. |
| @types/d3-timer | 3.0.2 | MIT | https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz | transitive (node_modules/@types/d3-timer) | low | Transitive dependency from package-lock.json. |
| @types/d3-transition | 3.0.9 | MIT | https://registry.npmjs.org/@types/d3-transition/-/d3-transition-3.0.9.tgz | transitive (node_modules/@types/d3-transition) | low | Transitive dependency from package-lock.json. |
| @types/d3-zoom | 3.0.8 | MIT | https://registry.npmjs.org/@types/d3-zoom/-/d3-zoom-3.0.8.tgz | transitive (node_modules/@types/d3-zoom) | low | Transitive dependency from package-lock.json. |
| @types/debug | 4.1.13 | MIT | https://registry.npmjs.org/@types/debug/-/debug-4.1.13.tgz | transitive (node_modules/@types/debug) | low | Transitive dependency from package-lock.json. |
| @types/esrecurse | 4.3.1 | MIT | https://registry.npmjs.org/@types/esrecurse/-/esrecurse-4.3.1.tgz | transitive (node_modules/@types/esrecurse) | low | Transitive dependency from package-lock.json. |
| @types/estree | 1.0.8 | MIT | https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz | transitive (node_modules/rollup/node_modules/@types/estree) | low | Transitive dependency from package-lock.json. |
| @types/estree | 1.0.9 | MIT | https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz | transitive (node_modules/@types/estree) | low | Transitive dependency from package-lock.json. |
| @types/fs-extra | 9.0.13 | MIT | https://registry.npmjs.org/@types/fs-extra/-/fs-extra-9.0.13.tgz | transitive (node_modules/@types/fs-extra) | low | Transitive dependency from package-lock.json. |
| @types/geojson | 7946.0.16 | MIT | https://registry.npmjs.org/@types/geojson/-/geojson-7946.0.16.tgz | transitive (node_modules/@types/geojson) | low | Transitive dependency from package-lock.json. |
| @types/http-cache-semantics | 4.2.0 | MIT | https://registry.npmjs.org/@types/http-cache-semantics/-/http-cache-semantics-4.2.0.tgz | transitive (node_modules/@types/http-cache-semantics) | low | Transitive dependency from package-lock.json. |
| @types/json-schema | 7.0.15 | MIT | https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz | transitive (node_modules/@types/json-schema) | low | Transitive dependency from package-lock.json. |
| @types/keyv | 3.1.4 | MIT | https://registry.npmjs.org/@types/keyv/-/keyv-3.1.4.tgz | transitive (node_modules/@types/keyv) | low | Transitive dependency from package-lock.json. |
| @types/ms | 2.1.0 | MIT | https://registry.npmjs.org/@types/ms/-/ms-2.1.0.tgz | transitive (node_modules/@types/ms) | low | Transitive dependency from package-lock.json. |
| @types/node | 24.12.4 | MIT | https://registry.npmjs.org/@types/node/-/node-24.12.4.tgz | devDependencies | low | Direct dependency from package.json. |
| @types/node | 25.8.0 | MIT | https://registry.npmjs.org/@types/node/-/node-25.8.0.tgz | devDependencies | low | Direct dependency from package.json. |
| @types/plist | 3.0.5 | MIT | https://registry.npmjs.org/@types/plist/-/plist-3.0.5.tgz | transitive (node_modules/@types/plist) | low | Transitive dependency from package-lock.json. |
| @types/react | 19.2.14 | MIT | https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz | devDependencies | low | Direct dependency from package.json. |
| @types/react-dom | 19.2.3 | MIT | https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz | devDependencies | low | Direct dependency from package.json. |
| @types/responselike | 1.0.3 | MIT | https://registry.npmjs.org/@types/responselike/-/responselike-1.0.3.tgz | transitive (node_modules/@types/responselike) | low | Transitive dependency from package-lock.json. |
| @types/verror | 1.10.11 | MIT | https://registry.npmjs.org/@types/verror/-/verror-1.10.11.tgz | transitive (node_modules/@types/verror) | low | Transitive dependency from package-lock.json. |
| @types/yauzl | 2.10.3 | MIT | https://registry.npmjs.org/@types/yauzl/-/yauzl-2.10.3.tgz | transitive (node_modules/@types/yauzl) | low | Transitive dependency from package-lock.json. |
| @xmldom/xmldom | 0.8.13 | MIT | https://registry.npmjs.org/@xmldom/xmldom/-/xmldom-0.8.13.tgz | transitive (node_modules/@xmldom/xmldom) | low | Transitive dependency from package-lock.json. |
| @xterm/addon-fit | 0.11.0 | MIT | https://registry.npmjs.org/@xterm/addon-fit/-/addon-fit-0.11.0.tgz | dependencies | low | Direct dependency from package.json. |
| @xterm/xterm | 6.0.0 | MIT | https://registry.npmjs.org/@xterm/xterm/-/xterm-6.0.0.tgz | dependencies | low | Direct dependency from package.json. |
| 7zip-bin | 5.2.0 | MIT | https://registry.npmjs.org/7zip-bin/-/7zip-bin-5.2.0.tgz | transitive (node_modules/7zip-bin) | low | Transitive dependency from package-lock.json. |
| abbrev | 4.0.0 | ISC | https://registry.npmjs.org/abbrev/-/abbrev-4.0.0.tgz | transitive (node_modules/abbrev) | low | Transitive dependency from package-lock.json. |
| acorn | 8.16.0 | MIT | https://registry.npmjs.org/acorn/-/acorn-8.16.0.tgz | transitive (node_modules/acorn) | low | Transitive dependency from package-lock.json. |
| acorn-jsx | 5.3.2 | MIT | https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz | transitive (node_modules/acorn-jsx) | low | Transitive dependency from package-lock.json. |
| agent-base | 7.1.4 | MIT | https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz | transitive (node_modules/agent-base) | low | Transitive dependency from package-lock.json. |
| ajv | 6.15.0 | MIT | https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz | transitive (node_modules/ajv) | low | Transitive dependency from package-lock.json. |
| ajv-keywords | 3.5.2 | MIT | https://registry.npmjs.org/ajv-keywords/-/ajv-keywords-3.5.2.tgz | transitive (node_modules/ajv-keywords) | low | Transitive dependency from package-lock.json. |
| ansi-regex | 5.0.1 | MIT | https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz | transitive (node_modules/ansi-regex) | low | Transitive dependency from package-lock.json. |
| ansi-styles | 4.3.0 | MIT | https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz | transitive (node_modules/ansi-styles) | low | Transitive dependency from package-lock.json. |
| any-promise | 1.3.0 | MIT | https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz | transitive (node_modules/any-promise) | low | Transitive dependency from package-lock.json. |
| anymatch | 3.1.3 | ISC | https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz | transitive (node_modules/anymatch) | low | Transitive dependency from package-lock.json. |
| app-builder-bin | 5.0.0-alpha.12 | MIT | https://registry.npmjs.org/app-builder-bin/-/app-builder-bin-5.0.0-alpha.12.tgz | transitive (node_modules/app-builder-bin) | low | Transitive dependency from package-lock.json. |
| app-builder-lib | 26.8.1 | MIT | https://registry.npmjs.org/app-builder-lib/-/app-builder-lib-26.8.1.tgz | transitive (node_modules/app-builder-lib) | low | Transitive dependency from package-lock.json. |
| arg | 5.0.2 | MIT | https://registry.npmjs.org/arg/-/arg-5.0.2.tgz | transitive (node_modules/arg) | low | Transitive dependency from package-lock.json. |
| argparse | 2.0.1 | Python-2.0 | https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz | transitive (node_modules/argparse) | low | Transitive dependency from package-lock.json. |
| assert-plus | 1.0.0 | MIT | https://registry.npmjs.org/assert-plus/-/assert-plus-1.0.0.tgz | transitive (node_modules/assert-plus) | low | Transitive dependency from package-lock.json. |
| astral-regex | 2.0.0 | MIT | https://registry.npmjs.org/astral-regex/-/astral-regex-2.0.0.tgz | transitive (node_modules/astral-regex) | low | Transitive dependency from package-lock.json. |
| async | 3.2.6 | MIT | https://registry.npmjs.org/async/-/async-3.2.6.tgz | transitive (node_modules/async) | low | Transitive dependency from package-lock.json. |
| async-exit-hook | 2.0.1 | MIT | https://registry.npmjs.org/async-exit-hook/-/async-exit-hook-2.0.1.tgz | transitive (node_modules/async-exit-hook) | low | Transitive dependency from package-lock.json. |
| asynckit | 0.4.0 | MIT | https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz | transitive (node_modules/asynckit) | low | Transitive dependency from package-lock.json. |
| at-least-node | 1.0.0 | ISC | https://registry.npmjs.org/at-least-node/-/at-least-node-1.0.0.tgz | transitive (node_modules/at-least-node) | low | Transitive dependency from package-lock.json. |
| autoprefixer | 10.5.0 | MIT | https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.5.0.tgz | devDependencies | low | Direct dependency from package.json. |
| balanced-match | 1.0.2 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz | transitive (node_modules/@electron/asar/node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| balanced-match | 1.0.2 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz | transitive (node_modules/@electron/universal/node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| balanced-match | 1.0.2 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz | transitive (node_modules/dir-compare/node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| balanced-match | 1.0.2 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz | transitive (node_modules/filelist/node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| balanced-match | 1.0.2 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz | transitive (node_modules/glob/node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| balanced-match | 4.0.4 | MIT | https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz | transitive (node_modules/balanced-match) | low | Transitive dependency from package-lock.json. |
| base64-js | 1.5.1 | MIT | https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz | transitive (node_modules/base64-js) | low | Transitive dependency from package-lock.json. |
| baseline-browser-mapping | 2.10.29 | Apache-2.0 | https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.10.29.tgz | transitive (node_modules/baseline-browser-mapping) | low | Transitive dependency from package-lock.json. |
| binary-extensions | 2.3.0 | MIT | https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz | transitive (node_modules/binary-extensions) | low | Transitive dependency from package-lock.json. |
| boolean | 3.2.0 | MIT | https://registry.npmjs.org/boolean/-/boolean-3.2.0.tgz | transitive (node_modules/boolean) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 1.1.14 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.14.tgz | transitive (node_modules/@electron/asar/node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 1.1.14 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.14.tgz | transitive (node_modules/dir-compare/node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 1.1.14 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.14.tgz | transitive (node_modules/glob/node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 2.1.0 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.1.0.tgz | transitive (node_modules/@electron/universal/node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 2.1.0 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.1.0.tgz | transitive (node_modules/filelist/node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| brace-expansion | 5.0.6 | MIT | https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.6.tgz | transitive (node_modules/brace-expansion) | low | Transitive dependency from package-lock.json. |
| braces | 3.0.3 | MIT | https://registry.npmjs.org/braces/-/braces-3.0.3.tgz | transitive (node_modules/braces) | low | Transitive dependency from package-lock.json. |
| browserslist | 4.28.2 | MIT | https://registry.npmjs.org/browserslist/-/browserslist-4.28.2.tgz | transitive (node_modules/browserslist) | low | Transitive dependency from package-lock.json. |
| buffer | 5.7.1 | MIT | https://registry.npmjs.org/buffer/-/buffer-5.7.1.tgz | transitive (node_modules/buffer) | low | Transitive dependency from package-lock.json. |
| buffer-crc32 | 0.2.13 | MIT | https://registry.npmjs.org/buffer-crc32/-/buffer-crc32-0.2.13.tgz | transitive (node_modules/buffer-crc32) | low | Transitive dependency from package-lock.json. |
| buffer-from | 1.1.2 | MIT | https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz | transitive (node_modules/buffer-from) | low | Transitive dependency from package-lock.json. |
| builder-util | 26.8.1 | MIT | https://registry.npmjs.org/builder-util/-/builder-util-26.8.1.tgz | transitive (node_modules/builder-util) | low | Transitive dependency from package-lock.json. |
| builder-util-runtime | 9.5.1 | MIT | https://registry.npmjs.org/builder-util-runtime/-/builder-util-runtime-9.5.1.tgz | transitive (node_modules/builder-util-runtime) | low | Transitive dependency from package-lock.json. |
| cac | 6.7.14 | MIT | https://registry.npmjs.org/cac/-/cac-6.7.14.tgz | transitive (node_modules/cac) | low | Transitive dependency from package-lock.json. |
| cacheable-lookup | 5.0.4 | MIT | https://registry.npmjs.org/cacheable-lookup/-/cacheable-lookup-5.0.4.tgz | transitive (node_modules/cacheable-lookup) | low | Transitive dependency from package-lock.json. |
| cacheable-request | 7.0.4 | MIT | https://registry.npmjs.org/cacheable-request/-/cacheable-request-7.0.4.tgz | transitive (node_modules/cacheable-request) | low | Transitive dependency from package-lock.json. |
| call-bind-apply-helpers | 1.0.2 | MIT | https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz | transitive (node_modules/call-bind-apply-helpers) | low | Transitive dependency from package-lock.json. |
| camelcase-css | 2.0.1 | MIT | https://registry.npmjs.org/camelcase-css/-/camelcase-css-2.0.1.tgz | transitive (node_modules/camelcase-css) | low | Transitive dependency from package-lock.json. |
| caniuse-lite | 1.0.30001792 | CC-BY-4.0 | https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001792.tgz | transitive (node_modules/caniuse-lite) | low | Transitive dependency from package-lock.json. |
| chalk | 4.1.2 | MIT | https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz | transitive (node_modules/chalk) | low | Transitive dependency from package-lock.json. |
| chokidar | 3.6.0 | MIT | https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz | transitive (node_modules/chokidar) | low | Transitive dependency from package-lock.json. |
| chownr | 3.0.0 | BlueOak-1.0.0 | https://registry.npmjs.org/chownr/-/chownr-3.0.0.tgz | transitive (node_modules/chownr) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| chromium-pickle-js | 0.2.0 | MIT | https://registry.npmjs.org/chromium-pickle-js/-/chromium-pickle-js-0.2.0.tgz | transitive (node_modules/chromium-pickle-js) | low | Transitive dependency from package-lock.json. |
| ci-info | 4.3.1 | MIT | https://registry.npmjs.org/ci-info/-/ci-info-4.3.1.tgz | transitive (node_modules/app-builder-lib/node_modules/ci-info) | low | Transitive dependency from package-lock.json. |
| ci-info | 4.4.0 | MIT | https://registry.npmjs.org/ci-info/-/ci-info-4.4.0.tgz | transitive (node_modules/ci-info) | low | Transitive dependency from package-lock.json. |
| classcat | 5.0.5 | MIT | https://registry.npmjs.org/classcat/-/classcat-5.0.5.tgz | transitive (node_modules/classcat) | low | Transitive dependency from package-lock.json. |
| cli-truncate | 2.1.0 | MIT | https://registry.npmjs.org/cli-truncate/-/cli-truncate-2.1.0.tgz | transitive (node_modules/cli-truncate) | low | Transitive dependency from package-lock.json. |
| cliui | 8.0.1 | ISC | https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz | transitive (node_modules/cliui) | low | Transitive dependency from package-lock.json. |
| clone-response | 1.0.3 | MIT | https://registry.npmjs.org/clone-response/-/clone-response-1.0.3.tgz | transitive (node_modules/clone-response) | low | Transitive dependency from package-lock.json. |
| color-convert | 2.0.1 | MIT | https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz | transitive (node_modules/color-convert) | low | Transitive dependency from package-lock.json. |
| color-name | 1.1.4 | MIT | https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz | transitive (node_modules/color-name) | low | Transitive dependency from package-lock.json. |
| combined-stream | 1.0.8 | MIT | https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz | transitive (node_modules/combined-stream) | low | Transitive dependency from package-lock.json. |
| commander | 4.1.1 | MIT | https://registry.npmjs.org/commander/-/commander-4.1.1.tgz | transitive (node_modules/sucrase/node_modules/commander) | low | Transitive dependency from package-lock.json. |
| commander | 5.1.0 | MIT | https://registry.npmjs.org/commander/-/commander-5.1.0.tgz | transitive (node_modules/commander) | low | Transitive dependency from package-lock.json. |
| commander | 9.5.0 | MIT | https://registry.npmjs.org/commander/-/commander-9.5.0.tgz | transitive (node_modules/postject/node_modules/commander) | low | Transitive dependency from package-lock.json. |
| compare-version | 0.1.2 | MIT | https://registry.npmjs.org/compare-version/-/compare-version-0.1.2.tgz | transitive (node_modules/compare-version) | low | Transitive dependency from package-lock.json. |
| concat-map | 0.0.1 | MIT | https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz | transitive (node_modules/concat-map) | low | Transitive dependency from package-lock.json. |
| convert-source-map | 2.0.0 | MIT | https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz | transitive (node_modules/convert-source-map) | low | Transitive dependency from package-lock.json. |
| core-util-is | 1.0.2 | MIT | https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.2.tgz | transitive (node_modules/core-util-is) | low | Transitive dependency from package-lock.json. |
| crc | 3.8.0 | MIT | https://registry.npmjs.org/crc/-/crc-3.8.0.tgz | transitive (node_modules/crc) | low | Transitive dependency from package-lock.json. |
| cross-dirname | 0.1.0 | MIT | https://registry.npmjs.org/cross-dirname/-/cross-dirname-0.1.0.tgz | transitive (node_modules/cross-dirname) | low | Transitive dependency from package-lock.json. |
| cross-spawn | 7.0.6 | MIT | https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz | transitive (node_modules/cross-spawn) | low | Transitive dependency from package-lock.json. |
| cssesc | 3.0.0 | MIT | https://registry.npmjs.org/cssesc/-/cssesc-3.0.0.tgz | transitive (node_modules/cssesc) | low | Transitive dependency from package-lock.json. |
| csstype | 3.2.3 | MIT | https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz | transitive (node_modules/csstype) | low | Transitive dependency from package-lock.json. |
| d3-color | 3.1.0 | ISC | https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz | transitive (node_modules/d3-color) | low | Transitive dependency from package-lock.json. |
| d3-dispatch | 3.0.1 | ISC | https://registry.npmjs.org/d3-dispatch/-/d3-dispatch-3.0.1.tgz | transitive (node_modules/d3-dispatch) | low | Transitive dependency from package-lock.json. |
| d3-drag | 3.0.0 | ISC | https://registry.npmjs.org/d3-drag/-/d3-drag-3.0.0.tgz | transitive (node_modules/d3-drag) | low | Transitive dependency from package-lock.json. |
| d3-ease | 3.0.1 | BSD-3-Clause | https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz | transitive (node_modules/d3-ease) | low | Transitive dependency from package-lock.json. |
| d3-interpolate | 3.0.1 | ISC | https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz | transitive (node_modules/d3-interpolate) | low | Transitive dependency from package-lock.json. |
| d3-selection | 3.0.0 | ISC | https://registry.npmjs.org/d3-selection/-/d3-selection-3.0.0.tgz | transitive (node_modules/d3-selection) | low | Transitive dependency from package-lock.json. |
| d3-timer | 3.0.1 | ISC | https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz | transitive (node_modules/d3-timer) | low | Transitive dependency from package-lock.json. |
| d3-transition | 3.0.1 | ISC | https://registry.npmjs.org/d3-transition/-/d3-transition-3.0.1.tgz | transitive (node_modules/d3-transition) | low | Transitive dependency from package-lock.json. |
| d3-zoom | 3.0.0 | ISC | https://registry.npmjs.org/d3-zoom/-/d3-zoom-3.0.0.tgz | transitive (node_modules/d3-zoom) | low | Transitive dependency from package-lock.json. |
| debug | 4.4.3 | MIT | https://registry.npmjs.org/debug/-/debug-4.4.3.tgz | transitive (node_modules/debug) | low | Transitive dependency from package-lock.json. |
| decompress-response | 6.0.0 | MIT | https://registry.npmjs.org/decompress-response/-/decompress-response-6.0.0.tgz | transitive (node_modules/decompress-response) | low | Transitive dependency from package-lock.json. |
| deep-is | 0.1.4 | MIT | https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz | transitive (node_modules/deep-is) | low | Transitive dependency from package-lock.json. |
| defer-to-connect | 2.0.1 | MIT | https://registry.npmjs.org/defer-to-connect/-/defer-to-connect-2.0.1.tgz | transitive (node_modules/defer-to-connect) | low | Transitive dependency from package-lock.json. |
| define-data-property | 1.1.4 | MIT | https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz | transitive (node_modules/define-data-property) | low | Transitive dependency from package-lock.json. |
| define-properties | 1.2.1 | MIT | https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz | transitive (node_modules/define-properties) | low | Transitive dependency from package-lock.json. |
| delayed-stream | 1.0.0 | MIT | https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz | transitive (node_modules/delayed-stream) | low | Transitive dependency from package-lock.json. |
| detect-node | 2.1.0 | MIT | https://registry.npmjs.org/detect-node/-/detect-node-2.1.0.tgz | transitive (node_modules/detect-node) | low | Transitive dependency from package-lock.json. |
| didyoumean | 1.2.2 | Apache-2.0 | https://registry.npmjs.org/didyoumean/-/didyoumean-1.2.2.tgz | transitive (node_modules/didyoumean) | low | Transitive dependency from package-lock.json. |
| dir-compare | 4.2.0 | MIT | https://registry.npmjs.org/dir-compare/-/dir-compare-4.2.0.tgz | transitive (node_modules/dir-compare) | low | Transitive dependency from package-lock.json. |
| dlv | 1.1.3 | MIT | https://registry.npmjs.org/dlv/-/dlv-1.1.3.tgz | transitive (node_modules/dlv) | low | Transitive dependency from package-lock.json. |
| dmg-builder | 26.8.1 | MIT | https://registry.npmjs.org/dmg-builder/-/dmg-builder-26.8.1.tgz | transitive (node_modules/dmg-builder) | low | Transitive dependency from package-lock.json. |
| dmg-license | 1.0.11 | MIT | https://registry.npmjs.org/dmg-license/-/dmg-license-1.0.11.tgz | transitive (node_modules/dmg-license) | low | Transitive dependency from package-lock.json. |
| dotenv | 16.6.1 | BSD-2-Clause | https://registry.npmjs.org/dotenv/-/dotenv-16.6.1.tgz | transitive (node_modules/dotenv) | low | Transitive dependency from package-lock.json. |
| dotenv-expand | 11.0.7 | BSD-2-Clause | https://registry.npmjs.org/dotenv-expand/-/dotenv-expand-11.0.7.tgz | transitive (node_modules/dotenv-expand) | low | Transitive dependency from package-lock.json. |
| dunder-proto | 1.0.1 | MIT | https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz | transitive (node_modules/dunder-proto) | low | Transitive dependency from package-lock.json. |
| ejs | 3.1.10 | Apache-2.0 | https://registry.npmjs.org/ejs/-/ejs-3.1.10.tgz | transitive (node_modules/ejs) | low | Transitive dependency from package-lock.json. |
| electron | 42.1.0 | MIT | https://registry.npmjs.org/electron/-/electron-42.1.0.tgz | devDependencies | low | Direct dependency from package.json. |
| electron-builder | 26.8.1 | MIT | https://registry.npmjs.org/electron-builder/-/electron-builder-26.8.1.tgz | devDependencies | low | Direct dependency from package.json. |
| electron-builder-squirrel-windows | 26.8.1 | MIT | https://registry.npmjs.org/electron-builder-squirrel-windows/-/electron-builder-squirrel-windows-26.8.1.tgz | transitive (node_modules/electron-builder-squirrel-windows) | low | Transitive dependency from package-lock.json. |
| electron-publish | 26.8.1 | MIT | https://registry.npmjs.org/electron-publish/-/electron-publish-26.8.1.tgz | transitive (node_modules/electron-publish) | low | Transitive dependency from package-lock.json. |
| electron-to-chromium | 1.5.356 | ISC | https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.356.tgz | transitive (node_modules/electron-to-chromium) | low | Transitive dependency from package-lock.json. |
| electron-vite | 5.0.0 | MIT | https://registry.npmjs.org/electron-vite/-/electron-vite-5.0.0.tgz | devDependencies | low | Direct dependency from package.json. |
| electron-winstaller | 5.4.0 | MIT | https://registry.npmjs.org/electron-winstaller/-/electron-winstaller-5.4.0.tgz | transitive (node_modules/electron-winstaller) | low | Transitive dependency from package-lock.json. |
| emoji-regex | 8.0.0 | MIT | https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz | transitive (node_modules/emoji-regex) | low | Transitive dependency from package-lock.json. |
| end-of-stream | 1.4.5 | MIT | https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.5.tgz | transitive (node_modules/end-of-stream) | low | Transitive dependency from package-lock.json. |
| env-paths | 2.2.1 | MIT | https://registry.npmjs.org/env-paths/-/env-paths-2.2.1.tgz | transitive (node_modules/app-builder-lib/node_modules/env-paths) | low | Transitive dependency from package-lock.json. |
| env-paths | 2.2.1 | MIT | https://registry.npmjs.org/env-paths/-/env-paths-2.2.1.tgz | transitive (node_modules/node-gyp/node_modules/env-paths) | low | Transitive dependency from package-lock.json. |
| env-paths | 3.0.0 | MIT | https://registry.npmjs.org/env-paths/-/env-paths-3.0.0.tgz | transitive (node_modules/env-paths) | low | Transitive dependency from package-lock.json. |
| err-code | 2.0.3 | MIT | https://registry.npmjs.org/err-code/-/err-code-2.0.3.tgz | transitive (node_modules/err-code) | low | Transitive dependency from package-lock.json. |
| es-define-property | 1.0.1 | MIT | https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz | transitive (node_modules/es-define-property) | low | Transitive dependency from package-lock.json. |
| es-errors | 1.3.0 | MIT | https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz | transitive (node_modules/es-errors) | low | Transitive dependency from package-lock.json. |
| es-object-atoms | 1.1.1 | MIT | https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz | transitive (node_modules/es-object-atoms) | low | Transitive dependency from package-lock.json. |
| es-set-tostringtag | 2.1.0 | MIT | https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz | transitive (node_modules/es-set-tostringtag) | low | Transitive dependency from package-lock.json. |
| es6-error | 4.1.1 | MIT | https://registry.npmjs.org/es6-error/-/es6-error-4.1.1.tgz | transitive (node_modules/es6-error) | low | Transitive dependency from package-lock.json. |
| esbuild | 0.25.12 | MIT | https://registry.npmjs.org/esbuild/-/esbuild-0.25.12.tgz | transitive (node_modules/esbuild) | low | Transitive dependency from package-lock.json. |
| esbuild | 0.27.7 | MIT | https://registry.npmjs.org/esbuild/-/esbuild-0.27.7.tgz | transitive (node_modules/vite/node_modules/esbuild) | low | Transitive dependency from package-lock.json. |
| escalade | 3.2.0 | MIT | https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz | transitive (node_modules/escalade) | low | Transitive dependency from package-lock.json. |
| escape-string-regexp | 4.0.0 | MIT | https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz | transitive (node_modules/escape-string-regexp) | low | Transitive dependency from package-lock.json. |
| eslint | 10.4.0 | MIT | https://registry.npmjs.org/eslint/-/eslint-10.4.0.tgz | devDependencies | low | Direct dependency from package.json. |
| eslint-scope | 9.1.2 | BSD-2-Clause | https://registry.npmjs.org/eslint-scope/-/eslint-scope-9.1.2.tgz | transitive (node_modules/eslint-scope) | low | Transitive dependency from package-lock.json. |
| eslint-visitor-keys | 3.4.3 | Apache-2.0 | https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz | transitive (node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys) | low | Transitive dependency from package-lock.json. |
| eslint-visitor-keys | 5.0.1 | Apache-2.0 | https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz | transitive (node_modules/eslint-visitor-keys) | low | Transitive dependency from package-lock.json. |
| espree | 11.2.0 | BSD-2-Clause | https://registry.npmjs.org/espree/-/espree-11.2.0.tgz | transitive (node_modules/espree) | low | Transitive dependency from package-lock.json. |
| esquery | 1.7.0 | BSD-3-Clause | https://registry.npmjs.org/esquery/-/esquery-1.7.0.tgz | transitive (node_modules/esquery) | low | Transitive dependency from package-lock.json. |
| esrecurse | 4.3.0 | BSD-2-Clause | https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz | transitive (node_modules/esrecurse) | low | Transitive dependency from package-lock.json. |
| estraverse | 5.3.0 | BSD-2-Clause | https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz | transitive (node_modules/estraverse) | low | Transitive dependency from package-lock.json. |
| esutils | 2.0.3 | BSD-2-Clause | https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz | transitive (node_modules/esutils) | low | Transitive dependency from package-lock.json. |
| exponential-backoff | 3.1.3 | Apache-2.0 | https://registry.npmjs.org/exponential-backoff/-/exponential-backoff-3.1.3.tgz | transitive (node_modules/exponential-backoff) | low | Transitive dependency from package-lock.json. |
| extract-zip | 2.0.1 | BSD-2-Clause | https://registry.npmjs.org/extract-zip/-/extract-zip-2.0.1.tgz | transitive (node_modules/extract-zip) | low | Transitive dependency from package-lock.json. |
| extsprintf | 1.4.1 | MIT | https://registry.npmjs.org/extsprintf/-/extsprintf-1.4.1.tgz | transitive (node_modules/extsprintf) | low | Transitive dependency from package-lock.json. |
| fast-deep-equal | 3.1.3 | MIT | https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz | transitive (node_modules/fast-deep-equal) | low | Transitive dependency from package-lock.json. |
| fast-glob | 3.3.3 | MIT | https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.3.tgz | transitive (node_modules/fast-glob) | low | Transitive dependency from package-lock.json. |
| fast-json-stable-stringify | 2.1.0 | MIT | https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz | transitive (node_modules/fast-json-stable-stringify) | low | Transitive dependency from package-lock.json. |
| fast-levenshtein | 2.0.6 | MIT | https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz | transitive (node_modules/fast-levenshtein) | low | Transitive dependency from package-lock.json. |
| fastq | 1.20.1 | ISC | https://registry.npmjs.org/fastq/-/fastq-1.20.1.tgz | transitive (node_modules/fastq) | low | Transitive dependency from package-lock.json. |
| fd-slicer | 1.1.0 | MIT | https://registry.npmjs.org/fd-slicer/-/fd-slicer-1.1.0.tgz | transitive (node_modules/fd-slicer) | low | Transitive dependency from package-lock.json. |
| fdir | 6.5.0 | MIT | https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz | transitive (node_modules/tinyglobby/node_modules/fdir) | low | Transitive dependency from package-lock.json. |
| fdir | 6.5.0 | MIT | https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz | transitive (node_modules/vite/node_modules/fdir) | low | Transitive dependency from package-lock.json. |
| file-entry-cache | 8.0.0 | MIT | https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz | transitive (node_modules/file-entry-cache) | low | Transitive dependency from package-lock.json. |
| filelist | 1.0.6 | Apache-2.0 | https://registry.npmjs.org/filelist/-/filelist-1.0.6.tgz | transitive (node_modules/filelist) | low | Transitive dependency from package-lock.json. |
| fill-range | 7.1.1 | MIT | https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz | transitive (node_modules/fill-range) | low | Transitive dependency from package-lock.json. |
| find-up | 5.0.0 | MIT | https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz | transitive (node_modules/find-up) | low | Transitive dependency from package-lock.json. |
| flat-cache | 4.0.1 | MIT | https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz | transitive (node_modules/flat-cache) | low | Transitive dependency from package-lock.json. |
| flatted | 3.4.2 | ISC | https://registry.npmjs.org/flatted/-/flatted-3.4.2.tgz | transitive (node_modules/flatted) | low | Transitive dependency from package-lock.json. |
| form-data | 4.0.5 | MIT | https://registry.npmjs.org/form-data/-/form-data-4.0.5.tgz | transitive (node_modules/form-data) | low | Transitive dependency from package-lock.json. |
| fraction.js | 5.3.4 | MIT | https://registry.npmjs.org/fraction.js/-/fraction.js-5.3.4.tgz | transitive (node_modules/fraction.js) | low | Transitive dependency from package-lock.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 10.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-10.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 11.3.5 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-11.3.5.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 7.0.1 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-7.0.1.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 8.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-8.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 9.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 9.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs-extra | 9.1.0 | MIT | https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| fs.realpath | 1.0.0 | ISC | https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz | transitive (node_modules/fs.realpath) | low | Transitive dependency from package-lock.json. |
| fsevents | 2.3.3 | MIT | https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz | transitive (node_modules/fsevents) | low | Transitive dependency from package-lock.json. |
| function-bind | 1.1.2 | MIT | https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz | transitive (node_modules/function-bind) | low | Transitive dependency from package-lock.json. |
| gensync | 1.0.0-beta.2 | MIT | https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz | transitive (node_modules/gensync) | low | Transitive dependency from package-lock.json. |
| get-caller-file | 2.0.5 | ISC | https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz | transitive (node_modules/get-caller-file) | low | Transitive dependency from package-lock.json. |
| get-intrinsic | 1.3.0 | MIT | https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz | transitive (node_modules/get-intrinsic) | low | Transitive dependency from package-lock.json. |
| get-proto | 1.0.1 | MIT | https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz | transitive (node_modules/get-proto) | low | Transitive dependency from package-lock.json. |
| get-stream | 5.2.0 | MIT | https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz | transitive (node_modules/get-stream) | low | Transitive dependency from package-lock.json. |
| glob | 7.2.3 | ISC | https://registry.npmjs.org/glob/-/glob-7.2.3.tgz | transitive (node_modules/glob) | low | Transitive dependency from package-lock.json. |
| glob-parent | 5.1.2 | ISC | https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz | transitive (node_modules/chokidar/node_modules/glob-parent) | low | Transitive dependency from package-lock.json. |
| glob-parent | 5.1.2 | ISC | https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz | transitive (node_modules/fast-glob/node_modules/glob-parent) | low | Transitive dependency from package-lock.json. |
| glob-parent | 6.0.2 | ISC | https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz | transitive (node_modules/glob-parent) | low | Transitive dependency from package-lock.json. |
| global-agent | 3.0.0 | BSD-3-Clause | https://registry.npmjs.org/global-agent/-/global-agent-3.0.0.tgz | transitive (node_modules/global-agent) | low | Transitive dependency from package-lock.json. |
| globalthis | 1.0.4 | MIT | https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz | transitive (node_modules/globalthis) | low | Transitive dependency from package-lock.json. |
| gopd | 1.2.0 | MIT | https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz | transitive (node_modules/gopd) | low | Transitive dependency from package-lock.json. |
| got | 11.8.6 | MIT | https://registry.npmjs.org/got/-/got-11.8.6.tgz | transitive (node_modules/got) | low | Transitive dependency from package-lock.json. |
| graceful-fs | 4.2.11 | ISC | https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz | transitive (node_modules/graceful-fs) | low | Transitive dependency from package-lock.json. |
| has-flag | 4.0.0 | MIT | https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz | transitive (node_modules/has-flag) | low | Transitive dependency from package-lock.json. |
| has-property-descriptors | 1.0.2 | MIT | https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz | transitive (node_modules/has-property-descriptors) | low | Transitive dependency from package-lock.json. |
| has-symbols | 1.1.0 | MIT | https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz | transitive (node_modules/has-symbols) | low | Transitive dependency from package-lock.json. |
| has-tostringtag | 1.0.2 | MIT | https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz | transitive (node_modules/has-tostringtag) | low | Transitive dependency from package-lock.json. |
| hasown | 2.0.3 | MIT | https://registry.npmjs.org/hasown/-/hasown-2.0.3.tgz | transitive (node_modules/hasown) | low | Transitive dependency from package-lock.json. |
| hosted-git-info | 4.1.0 | ISC | https://registry.npmjs.org/hosted-git-info/-/hosted-git-info-4.1.0.tgz | transitive (node_modules/hosted-git-info) | low | Transitive dependency from package-lock.json. |
| http-cache-semantics | 4.2.0 | BSD-2-Clause | https://registry.npmjs.org/http-cache-semantics/-/http-cache-semantics-4.2.0.tgz | transitive (node_modules/http-cache-semantics) | low | Transitive dependency from package-lock.json. |
| http-proxy-agent | 7.0.2 | MIT | https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-7.0.2.tgz | transitive (node_modules/http-proxy-agent) | low | Transitive dependency from package-lock.json. |
| http2-wrapper | 1.0.3 | MIT | https://registry.npmjs.org/http2-wrapper/-/http2-wrapper-1.0.3.tgz | transitive (node_modules/http2-wrapper) | low | Transitive dependency from package-lock.json. |
| https-proxy-agent | 7.0.6 | MIT | https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz | transitive (node_modules/https-proxy-agent) | low | Transitive dependency from package-lock.json. |
| iconv-corefoundation | 1.1.7 | MIT | https://registry.npmjs.org/iconv-corefoundation/-/iconv-corefoundation-1.1.7.tgz | transitive (node_modules/iconv-corefoundation) | low | Transitive dependency from package-lock.json. |
| iconv-lite | 0.6.3 | MIT | https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz | transitive (node_modules/iconv-lite) | low | Transitive dependency from package-lock.json. |
| ieee754 | 1.2.1 | BSD-3-Clause | https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz | transitive (node_modules/ieee754) | low | Transitive dependency from package-lock.json. |
| ignore | 5.3.2 | MIT | https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz | transitive (node_modules/ignore) | low | Transitive dependency from package-lock.json. |
| imurmurhash | 0.1.4 | MIT | https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz | transitive (node_modules/imurmurhash) | low | Transitive dependency from package-lock.json. |
| inflight | 1.0.6 | ISC | https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz | transitive (node_modules/inflight) | low | Transitive dependency from package-lock.json. |
| inherits | 2.0.4 | ISC | https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz | transitive (node_modules/inherits) | low | Transitive dependency from package-lock.json. |
| is-binary-path | 2.1.0 | MIT | https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz | transitive (node_modules/is-binary-path) | low | Transitive dependency from package-lock.json. |
| is-core-module | 2.16.2 | MIT | https://registry.npmjs.org/is-core-module/-/is-core-module-2.16.2.tgz | transitive (node_modules/is-core-module) | low | Transitive dependency from package-lock.json. |
| is-extglob | 2.1.1 | MIT | https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz | transitive (node_modules/is-extglob) | low | Transitive dependency from package-lock.json. |
| is-fullwidth-code-point | 3.0.0 | MIT | https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz | transitive (node_modules/is-fullwidth-code-point) | low | Transitive dependency from package-lock.json. |
| is-glob | 4.0.3 | MIT | https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz | transitive (node_modules/is-glob) | low | Transitive dependency from package-lock.json. |
| is-number | 7.0.0 | MIT | https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz | transitive (node_modules/is-number) | low | Transitive dependency from package-lock.json. |
| isbinaryfile | 4.0.10 | MIT | https://registry.npmjs.org/isbinaryfile/-/isbinaryfile-4.0.10.tgz | transitive (node_modules/@electron/osx-sign/node_modules/isbinaryfile) | low | Transitive dependency from package-lock.json. |
| isbinaryfile | 5.0.7 | MIT | https://registry.npmjs.org/isbinaryfile/-/isbinaryfile-5.0.7.tgz | transitive (node_modules/isbinaryfile) | low | Transitive dependency from package-lock.json. |
| isexe | 2.0.0 | ISC | https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz | transitive (node_modules/cross-spawn/node_modules/isexe) | low | Transitive dependency from package-lock.json. |
| isexe | 3.1.5 | BlueOak-1.0.0 | https://registry.npmjs.org/isexe/-/isexe-3.1.5.tgz | transitive (node_modules/isexe) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| isexe | 4.0.0 | BlueOak-1.0.0 | https://registry.npmjs.org/isexe/-/isexe-4.0.0.tgz | transitive (node_modules/node-gyp/node_modules/isexe) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| jake | 10.9.4 | Apache-2.0 | https://registry.npmjs.org/jake/-/jake-10.9.4.tgz | transitive (node_modules/jake) | low | Transitive dependency from package-lock.json. |
| jiti | 1.21.7 | MIT | https://registry.npmjs.org/jiti/-/jiti-1.21.7.tgz | transitive (node_modules/tailwindcss/node_modules/jiti) | low | Transitive dependency from package-lock.json. |
| jiti | 2.7.0 | MIT | https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz | transitive (node_modules/jiti) | low | Transitive dependency from package-lock.json. |
| js-tokens | 4.0.0 | MIT | https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz | transitive (node_modules/js-tokens) | low | Transitive dependency from package-lock.json. |
| js-yaml | 4.1.1 | MIT | https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.1.tgz | transitive (node_modules/js-yaml) | low | Transitive dependency from package-lock.json. |
| jsesc | 3.1.0 | MIT | https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz | transitive (node_modules/jsesc) | low | Transitive dependency from package-lock.json. |
| json-buffer | 3.0.1 | MIT | https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz | transitive (node_modules/json-buffer) | low | Transitive dependency from package-lock.json. |
| json-schema-traverse | 0.4.1 | MIT | https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz | transitive (node_modules/json-schema-traverse) | low | Transitive dependency from package-lock.json. |
| json-stable-stringify-without-jsonify | 1.0.1 | MIT | https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz | transitive (node_modules/json-stable-stringify-without-jsonify) | low | Transitive dependency from package-lock.json. |
| json-stringify-safe | 5.0.1 | ISC | https://registry.npmjs.org/json-stringify-safe/-/json-stringify-safe-5.0.1.tgz | transitive (node_modules/json-stringify-safe) | low | Transitive dependency from package-lock.json. |
| json5 | 2.2.3 | MIT | https://registry.npmjs.org/json5/-/json5-2.2.3.tgz | transitive (node_modules/json5) | low | Transitive dependency from package-lock.json. |
| jsonfile | 4.0.0 | MIT | https://registry.npmjs.org/jsonfile/-/jsonfile-4.0.0.tgz | transitive (node_modules/app-builder-lib/node_modules/@electron/get/node_modules/jsonfile) | low | Transitive dependency from package-lock.json. |
| jsonfile | 4.0.0 | MIT | https://registry.npmjs.org/jsonfile/-/jsonfile-4.0.0.tgz | transitive (node_modules/electron-winstaller/node_modules/jsonfile) | low | Transitive dependency from package-lock.json. |
| jsonfile | 6.2.1 | MIT | https://registry.npmjs.org/jsonfile/-/jsonfile-6.2.1.tgz | transitive (node_modules/jsonfile) | low | Transitive dependency from package-lock.json. |
| keyv | 4.5.4 | MIT | https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz | transitive (node_modules/keyv) | low | Transitive dependency from package-lock.json. |
| lazy-val | 1.0.5 | MIT | https://registry.npmjs.org/lazy-val/-/lazy-val-1.0.5.tgz | transitive (node_modules/lazy-val) | low | Transitive dependency from package-lock.json. |
| levn | 0.4.1 | MIT | https://registry.npmjs.org/levn/-/levn-0.4.1.tgz | transitive (node_modules/levn) | low | Transitive dependency from package-lock.json. |
| lilconfig | 3.1.3 | MIT | https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.3.tgz | transitive (node_modules/lilconfig) | low | Transitive dependency from package-lock.json. |
| lines-and-columns | 1.2.4 | MIT | https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz | transitive (node_modules/lines-and-columns) | low | Transitive dependency from package-lock.json. |
| locate-path | 6.0.0 | MIT | https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz | transitive (node_modules/locate-path) | low | Transitive dependency from package-lock.json. |
| lodash | 4.18.1 | MIT | https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz | transitive (node_modules/lodash) | low | Transitive dependency from package-lock.json. |
| lowercase-keys | 2.0.0 | MIT | https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-2.0.0.tgz | transitive (node_modules/lowercase-keys) | low | Transitive dependency from package-lock.json. |
| lru-cache | 5.1.1 | ISC | https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz | transitive (node_modules/lru-cache) | low | Transitive dependency from package-lock.json. |
| lru-cache | 6.0.0 | ISC | https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz | transitive (node_modules/hosted-git-info/node_modules/lru-cache) | low | Transitive dependency from package-lock.json. |
| magic-string | 0.30.21 | MIT | https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz | transitive (node_modules/magic-string) | low | Transitive dependency from package-lock.json. |
| matcher | 3.0.0 | MIT | https://registry.npmjs.org/matcher/-/matcher-3.0.0.tgz | transitive (node_modules/matcher) | low | Transitive dependency from package-lock.json. |
| math-intrinsics | 1.1.0 | MIT | https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz | transitive (node_modules/math-intrinsics) | low | Transitive dependency from package-lock.json. |
| merge2 | 1.4.1 | MIT | https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz | transitive (node_modules/merge2) | low | Transitive dependency from package-lock.json. |
| micromatch | 4.0.8 | MIT | https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz | transitive (node_modules/micromatch) | low | Transitive dependency from package-lock.json. |
| mime | 2.6.0 | MIT | https://registry.npmjs.org/mime/-/mime-2.6.0.tgz | transitive (node_modules/mime) | low | Transitive dependency from package-lock.json. |
| mime-db | 1.52.0 | MIT | https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz | transitive (node_modules/mime-db) | low | Transitive dependency from package-lock.json. |
| mime-types | 2.1.35 | MIT | https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz | transitive (node_modules/mime-types) | low | Transitive dependency from package-lock.json. |
| mimic-response | 1.0.1 | MIT | https://registry.npmjs.org/mimic-response/-/mimic-response-1.0.1.tgz | transitive (node_modules/mimic-response) | low | Transitive dependency from package-lock.json. |
| mimic-response | 3.1.0 | MIT | https://registry.npmjs.org/mimic-response/-/mimic-response-3.1.0.tgz | transitive (node_modules/decompress-response/node_modules/mimic-response) | low | Transitive dependency from package-lock.json. |
| minimatch | 10.2.5 | BlueOak-1.0.0 | https://registry.npmjs.org/minimatch/-/minimatch-10.2.5.tgz | transitive (node_modules/minimatch) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| minimatch | 3.1.5 | ISC | https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz | transitive (node_modules/@electron/asar/node_modules/minimatch) | low | Transitive dependency from package-lock.json. |
| minimatch | 3.1.5 | ISC | https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz | transitive (node_modules/dir-compare/node_modules/minimatch) | low | Transitive dependency from package-lock.json. |
| minimatch | 3.1.5 | ISC | https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz | transitive (node_modules/glob/node_modules/minimatch) | low | Transitive dependency from package-lock.json. |
| minimatch | 5.1.9 | ISC | https://registry.npmjs.org/minimatch/-/minimatch-5.1.9.tgz | transitive (node_modules/filelist/node_modules/minimatch) | low | Transitive dependency from package-lock.json. |
| minimatch | 9.0.9 | ISC | https://registry.npmjs.org/minimatch/-/minimatch-9.0.9.tgz | transitive (node_modules/@electron/universal/node_modules/minimatch) | low | Transitive dependency from package-lock.json. |
| minimist | 1.2.8 | MIT | https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz | transitive (node_modules/minimist) | low | Transitive dependency from package-lock.json. |
| minipass | 7.1.3 | BlueOak-1.0.0 | https://registry.npmjs.org/minipass/-/minipass-7.1.3.tgz | transitive (node_modules/minipass) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| minizlib | 3.1.0 | MIT | https://registry.npmjs.org/minizlib/-/minizlib-3.1.0.tgz | transitive (node_modules/minizlib) | low | Transitive dependency from package-lock.json. |
| mkdirp | 0.5.6 | MIT | https://registry.npmjs.org/mkdirp/-/mkdirp-0.5.6.tgz | transitive (node_modules/mkdirp) | low | Transitive dependency from package-lock.json. |
| ms | 2.1.3 | MIT | https://registry.npmjs.org/ms/-/ms-2.1.3.tgz | transitive (node_modules/ms) | low | Transitive dependency from package-lock.json. |
| mz | 2.7.0 | MIT | https://registry.npmjs.org/mz/-/mz-2.7.0.tgz | transitive (node_modules/mz) | low | Transitive dependency from package-lock.json. |
| nanoid | 3.3.12 | MIT | https://registry.npmjs.org/nanoid/-/nanoid-3.3.12.tgz | transitive (node_modules/nanoid) | low | Transitive dependency from package-lock.json. |
| natural-compare | 1.4.0 | MIT | https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz | transitive (node_modules/natural-compare) | low | Transitive dependency from package-lock.json. |
| node-abi | 4.31.0 | MIT | https://registry.npmjs.org/node-abi/-/node-abi-4.31.0.tgz | transitive (node_modules/node-abi) | low | Transitive dependency from package-lock.json. |
| node-addon-api | 1.7.2 | MIT | https://registry.npmjs.org/node-addon-api/-/node-addon-api-1.7.2.tgz | transitive (node_modules/node-addon-api) | low | Transitive dependency from package-lock.json. |
| node-addon-api | 7.1.1 | MIT | https://registry.npmjs.org/node-addon-api/-/node-addon-api-7.1.1.tgz | transitive (node_modules/node-pty/node_modules/node-addon-api) | low | Transitive dependency from package-lock.json. |
| node-api-version | 0.2.1 | MIT | https://registry.npmjs.org/node-api-version/-/node-api-version-0.2.1.tgz | transitive (node_modules/node-api-version) | low | Transitive dependency from package-lock.json. |
| node-gyp | 12.3.0 | MIT | https://registry.npmjs.org/node-gyp/-/node-gyp-12.3.0.tgz | transitive (node_modules/node-gyp) | low | Transitive dependency from package-lock.json. |
| node-pty | 1.1.0 | MIT | https://registry.npmjs.org/node-pty/-/node-pty-1.1.0.tgz | dependencies | low | Direct dependency from package.json. |
| node-releases | 2.0.44 | MIT | https://registry.npmjs.org/node-releases/-/node-releases-2.0.44.tgz | transitive (node_modules/node-releases) | low | Transitive dependency from package-lock.json. |
| nopt | 9.0.0 | ISC | https://registry.npmjs.org/nopt/-/nopt-9.0.0.tgz | transitive (node_modules/nopt) | low | Transitive dependency from package-lock.json. |
| normalize-path | 3.0.0 | MIT | https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz | transitive (node_modules/normalize-path) | low | Transitive dependency from package-lock.json. |
| normalize-url | 6.1.0 | MIT | https://registry.npmjs.org/normalize-url/-/normalize-url-6.1.0.tgz | transitive (node_modules/normalize-url) | low | Transitive dependency from package-lock.json. |
| object-assign | 4.1.1 | MIT | https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz | transitive (node_modules/object-assign) | low | Transitive dependency from package-lock.json. |
| object-hash | 3.0.0 | MIT | https://registry.npmjs.org/object-hash/-/object-hash-3.0.0.tgz | transitive (node_modules/object-hash) | low | Transitive dependency from package-lock.json. |
| object-keys | 1.1.1 | MIT | https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz | transitive (node_modules/object-keys) | low | Transitive dependency from package-lock.json. |
| once | 1.4.0 | ISC | https://registry.npmjs.org/once/-/once-1.4.0.tgz | transitive (node_modules/once) | low | Transitive dependency from package-lock.json. |
| optionator | 0.9.4 | MIT | https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz | transitive (node_modules/optionator) | low | Transitive dependency from package-lock.json. |
| p-cancelable | 2.1.1 | MIT | https://registry.npmjs.org/p-cancelable/-/p-cancelable-2.1.1.tgz | transitive (node_modules/p-cancelable) | low | Transitive dependency from package-lock.json. |
| p-limit | 3.1.0 | MIT | https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz | transitive (node_modules/p-limit) | low | Transitive dependency from package-lock.json. |
| p-locate | 5.0.0 | MIT | https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz | transitive (node_modules/p-locate) | low | Transitive dependency from package-lock.json. |
| path-exists | 4.0.0 | MIT | https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz | transitive (node_modules/path-exists) | low | Transitive dependency from package-lock.json. |
| path-is-absolute | 1.0.1 | MIT | https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz | transitive (node_modules/path-is-absolute) | low | Transitive dependency from package-lock.json. |
| path-key | 3.1.1 | MIT | https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz | transitive (node_modules/path-key) | low | Transitive dependency from package-lock.json. |
| path-parse | 1.0.7 | MIT | https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz | transitive (node_modules/path-parse) | low | Transitive dependency from package-lock.json. |
| pe-library | 0.4.1 | MIT | https://registry.npmjs.org/pe-library/-/pe-library-0.4.1.tgz | transitive (node_modules/pe-library) | low | Transitive dependency from package-lock.json. |
| pend | 1.2.0 | MIT | https://registry.npmjs.org/pend/-/pend-1.2.0.tgz | transitive (node_modules/pend) | low | Transitive dependency from package-lock.json. |
| picocolors | 1.1.1 | ISC | https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz | transitive (node_modules/picocolors) | low | Transitive dependency from package-lock.json. |
| picomatch | 2.3.2 | MIT | https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz | transitive (node_modules/picomatch) | low | Transitive dependency from package-lock.json. |
| picomatch | 4.0.4 | MIT | https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz | transitive (node_modules/tinyglobby/node_modules/picomatch) | low | Transitive dependency from package-lock.json. |
| picomatch | 4.0.4 | MIT | https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz | transitive (node_modules/vite/node_modules/picomatch) | low | Transitive dependency from package-lock.json. |
| pify | 2.3.0 | MIT | https://registry.npmjs.org/pify/-/pify-2.3.0.tgz | transitive (node_modules/pify) | low | Transitive dependency from package-lock.json. |
| pirates | 4.0.7 | MIT | https://registry.npmjs.org/pirates/-/pirates-4.0.7.tgz | transitive (node_modules/pirates) | low | Transitive dependency from package-lock.json. |
| plist | 3.1.0 | MIT | https://registry.npmjs.org/plist/-/plist-3.1.0.tgz | transitive (node_modules/plist) | low | Transitive dependency from package-lock.json. |
| postcss | 8.5.14 | MIT | https://registry.npmjs.org/postcss/-/postcss-8.5.14.tgz | devDependencies | low | Direct dependency from package.json. |
| postcss-import | 15.1.0 | MIT | https://registry.npmjs.org/postcss-import/-/postcss-import-15.1.0.tgz | transitive (node_modules/postcss-import) | low | Transitive dependency from package-lock.json. |
| postcss-js | 4.1.0 | MIT | https://registry.npmjs.org/postcss-js/-/postcss-js-4.1.0.tgz | transitive (node_modules/postcss-js) | low | Transitive dependency from package-lock.json. |
| postcss-load-config | 6.0.1 | MIT | https://registry.npmjs.org/postcss-load-config/-/postcss-load-config-6.0.1.tgz | transitive (node_modules/postcss-load-config) | low | Transitive dependency from package-lock.json. |
| postcss-nested | 6.2.0 | MIT | https://registry.npmjs.org/postcss-nested/-/postcss-nested-6.2.0.tgz | transitive (node_modules/postcss-nested) | low | Transitive dependency from package-lock.json. |
| postcss-selector-parser | 6.1.2 | MIT | https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.1.2.tgz | transitive (node_modules/postcss-selector-parser) | low | Transitive dependency from package-lock.json. |
| postcss-value-parser | 4.2.0 | MIT | https://registry.npmjs.org/postcss-value-parser/-/postcss-value-parser-4.2.0.tgz | transitive (node_modules/postcss-value-parser) | low | Transitive dependency from package-lock.json. |
| postject | 1.0.0-alpha.6 | MIT | https://registry.npmjs.org/postject/-/postject-1.0.0-alpha.6.tgz | transitive (node_modules/postject) | low | Transitive dependency from package-lock.json. |
| prelude-ls | 1.2.1 | MIT | https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz | transitive (node_modules/prelude-ls) | low | Transitive dependency from package-lock.json. |
| prettier | 3.8.3 | MIT | https://registry.npmjs.org/prettier/-/prettier-3.8.3.tgz | devDependencies | low | Direct dependency from package.json. |
| proc-log | 6.1.0 | ISC | https://registry.npmjs.org/proc-log/-/proc-log-6.1.0.tgz | transitive (node_modules/proc-log) | low | Transitive dependency from package-lock.json. |
| progress | 2.0.3 | MIT | https://registry.npmjs.org/progress/-/progress-2.0.3.tgz | transitive (node_modules/progress) | low | Transitive dependency from package-lock.json. |
| promise-retry | 2.0.1 | MIT | https://registry.npmjs.org/promise-retry/-/promise-retry-2.0.1.tgz | transitive (node_modules/promise-retry) | low | Transitive dependency from package-lock.json. |
| proper-lockfile | 4.1.2 | MIT | https://registry.npmjs.org/proper-lockfile/-/proper-lockfile-4.1.2.tgz | transitive (node_modules/proper-lockfile) | low | Transitive dependency from package-lock.json. |
| pump | 3.0.4 | MIT | https://registry.npmjs.org/pump/-/pump-3.0.4.tgz | transitive (node_modules/pump) | low | Transitive dependency from package-lock.json. |
| punycode | 2.3.1 | MIT | https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz | transitive (node_modules/punycode) | low | Transitive dependency from package-lock.json. |
| queue-microtask | 1.2.3 | MIT | https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz | transitive (node_modules/queue-microtask) | low | Transitive dependency from package-lock.json. |
| quick-lru | 5.1.1 | MIT | https://registry.npmjs.org/quick-lru/-/quick-lru-5.1.1.tgz | transitive (node_modules/quick-lru) | low | Transitive dependency from package-lock.json. |
| react | 19.2.6 | MIT | https://registry.npmjs.org/react/-/react-19.2.6.tgz | dependencies | low | Direct dependency from package.json. |
| react-dom | 19.2.6 | MIT | https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | dependencies | low | Direct dependency from package.json. |
| reactflow | 11.11.4 | MIT | https://registry.npmjs.org/reactflow/-/reactflow-11.11.4.tgz | dependencies | low | Direct dependency from package.json. |
| read-binary-file-arch | 1.0.6 | MIT | https://registry.npmjs.org/read-binary-file-arch/-/read-binary-file-arch-1.0.6.tgz | transitive (node_modules/read-binary-file-arch) | low | Transitive dependency from package-lock.json. |
| read-cache | 1.0.0 | MIT | https://registry.npmjs.org/read-cache/-/read-cache-1.0.0.tgz | transitive (node_modules/read-cache) | low | Transitive dependency from package-lock.json. |
| readdirp | 3.6.0 | MIT | https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz | transitive (node_modules/readdirp) | low | Transitive dependency from package-lock.json. |
| require-directory | 2.1.1 | MIT | https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz | transitive (node_modules/require-directory) | low | Transitive dependency from package-lock.json. |
| resedit | 1.7.2 | MIT | https://registry.npmjs.org/resedit/-/resedit-1.7.2.tgz | transitive (node_modules/resedit) | low | Transitive dependency from package-lock.json. |
| resolve | 1.22.12 | MIT | https://registry.npmjs.org/resolve/-/resolve-1.22.12.tgz | transitive (node_modules/resolve) | low | Transitive dependency from package-lock.json. |
| resolve-alpn | 1.2.1 | MIT | https://registry.npmjs.org/resolve-alpn/-/resolve-alpn-1.2.1.tgz | transitive (node_modules/resolve-alpn) | low | Transitive dependency from package-lock.json. |
| responselike | 2.0.1 | MIT | https://registry.npmjs.org/responselike/-/responselike-2.0.1.tgz | transitive (node_modules/responselike) | low | Transitive dependency from package-lock.json. |
| retry | 0.12.0 | MIT | https://registry.npmjs.org/retry/-/retry-0.12.0.tgz | transitive (node_modules/retry) | low | Transitive dependency from package-lock.json. |
| reusify | 1.1.0 | MIT | https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz | transitive (node_modules/reusify) | low | Transitive dependency from package-lock.json. |
| rimraf | 2.6.3 | ISC | https://registry.npmjs.org/rimraf/-/rimraf-2.6.3.tgz | transitive (node_modules/rimraf) | low | Transitive dependency from package-lock.json. |
| roarr | 2.15.4 | BSD-3-Clause | https://registry.npmjs.org/roarr/-/roarr-2.15.4.tgz | transitive (node_modules/roarr) | low | Transitive dependency from package-lock.json. |
| rollup | 4.60.4 | MIT | https://registry.npmjs.org/rollup/-/rollup-4.60.4.tgz | transitive (node_modules/rollup) | low | Transitive dependency from package-lock.json. |
| run-parallel | 1.2.0 | MIT | https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz | transitive (node_modules/run-parallel) | low | Transitive dependency from package-lock.json. |
| safer-buffer | 2.1.2 | MIT | https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz | transitive (node_modules/safer-buffer) | low | Transitive dependency from package-lock.json. |
| sanitize-filename | 1.6.4 | WTFPL OR ISC | https://registry.npmjs.org/sanitize-filename/-/sanitize-filename-1.6.4.tgz | transitive (node_modules/sanitize-filename) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| sax | 1.6.0 | BlueOak-1.0.0 | https://registry.npmjs.org/sax/-/sax-1.6.0.tgz | transitive (node_modules/sax) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| scheduler | 0.27.0 | MIT | https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | transitive (node_modules/scheduler) | low | Transitive dependency from package-lock.json. |
| semver | 5.7.2 | ISC | https://registry.npmjs.org/semver/-/semver-5.7.2.tgz | transitive (node_modules/tiny-async-pool/node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver | 6.3.1 | ISC | https://registry.npmjs.org/semver/-/semver-6.3.1.tgz | transitive (node_modules/@babel/core/node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver | 6.3.1 | ISC | https://registry.npmjs.org/semver/-/semver-6.3.1.tgz | transitive (node_modules/@babel/helper-compilation-targets/node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver | 6.3.1 | ISC | https://registry.npmjs.org/semver/-/semver-6.3.1.tgz | transitive (node_modules/app-builder-lib/node_modules/@electron/get/node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver | 7.7.4 | ISC | https://registry.npmjs.org/semver/-/semver-7.7.4.tgz | transitive (node_modules/app-builder-lib/node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver | 7.8.0 | ISC | https://registry.npmjs.org/semver/-/semver-7.8.0.tgz | transitive (node_modules/semver) | low | Transitive dependency from package-lock.json. |
| semver-compare | 1.0.0 | MIT | https://registry.npmjs.org/semver-compare/-/semver-compare-1.0.0.tgz | transitive (node_modules/semver-compare) | low | Transitive dependency from package-lock.json. |
| serialize-error | 7.0.1 | MIT | https://registry.npmjs.org/serialize-error/-/serialize-error-7.0.1.tgz | transitive (node_modules/serialize-error) | low | Transitive dependency from package-lock.json. |
| shebang-command | 2.0.0 | MIT | https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz | transitive (node_modules/shebang-command) | low | Transitive dependency from package-lock.json. |
| shebang-regex | 3.0.0 | MIT | https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz | transitive (node_modules/shebang-regex) | low | Transitive dependency from package-lock.json. |
| signal-exit | 3.0.7 | ISC | https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz | transitive (node_modules/signal-exit) | low | Transitive dependency from package-lock.json. |
| simple-update-notifier | 2.0.0 | MIT | https://registry.npmjs.org/simple-update-notifier/-/simple-update-notifier-2.0.0.tgz | transitive (node_modules/simple-update-notifier) | low | Transitive dependency from package-lock.json. |
| slice-ansi | 3.0.0 | MIT | https://registry.npmjs.org/slice-ansi/-/slice-ansi-3.0.0.tgz | transitive (node_modules/slice-ansi) | low | Transitive dependency from package-lock.json. |
| smart-buffer | 4.2.0 | MIT | https://registry.npmjs.org/smart-buffer/-/smart-buffer-4.2.0.tgz | transitive (node_modules/smart-buffer) | low | Transitive dependency from package-lock.json. |
| source-map | 0.6.1 | BSD-3-Clause | https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz | transitive (node_modules/source-map) | low | Transitive dependency from package-lock.json. |
| source-map-js | 1.2.1 | BSD-3-Clause | https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz | transitive (node_modules/source-map-js) | low | Transitive dependency from package-lock.json. |
| source-map-support | 0.5.21 | MIT | https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.21.tgz | transitive (node_modules/source-map-support) | low | Transitive dependency from package-lock.json. |
| sprintf-js | 1.1.3 | BSD-3-Clause | https://registry.npmjs.org/sprintf-js/-/sprintf-js-1.1.3.tgz | transitive (node_modules/sprintf-js) | low | Transitive dependency from package-lock.json. |
| stat-mode | 1.0.0 | MIT | https://registry.npmjs.org/stat-mode/-/stat-mode-1.0.0.tgz | transitive (node_modules/stat-mode) | low | Transitive dependency from package-lock.json. |
| string-width | 4.2.3 | MIT | https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz | transitive (node_modules/string-width) | low | Transitive dependency from package-lock.json. |
| strip-ansi | 6.0.1 | MIT | https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz | transitive (node_modules/strip-ansi) | low | Transitive dependency from package-lock.json. |
| sucrase | 3.35.1 | MIT | https://registry.npmjs.org/sucrase/-/sucrase-3.35.1.tgz | transitive (node_modules/sucrase) | low | Transitive dependency from package-lock.json. |
| sumchecker | 3.0.1 | Apache-2.0 | https://registry.npmjs.org/sumchecker/-/sumchecker-3.0.1.tgz | transitive (node_modules/sumchecker) | low | Transitive dependency from package-lock.json. |
| supports-color | 7.2.0 | MIT | https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz | transitive (node_modules/supports-color) | low | Transitive dependency from package-lock.json. |
| supports-preserve-symlinks-flag | 1.0.0 | MIT | https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz | transitive (node_modules/supports-preserve-symlinks-flag) | low | Transitive dependency from package-lock.json. |
| tailwindcss | 3.4.19 | MIT | https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.19.tgz | devDependencies | low | Direct dependency from package.json. |
| tar | 7.5.15 | BlueOak-1.0.0 | https://registry.npmjs.org/tar/-/tar-7.5.15.tgz | transitive (node_modules/tar) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| temp | 0.9.4 | MIT | https://registry.npmjs.org/temp/-/temp-0.9.4.tgz | transitive (node_modules/temp) | low | Transitive dependency from package-lock.json. |
| temp-file | 3.4.0 | MIT | https://registry.npmjs.org/temp-file/-/temp-file-3.4.0.tgz | transitive (node_modules/temp-file) | low | Transitive dependency from package-lock.json. |
| thenify | 3.3.1 | MIT | https://registry.npmjs.org/thenify/-/thenify-3.3.1.tgz | transitive (node_modules/thenify) | low | Transitive dependency from package-lock.json. |
| thenify-all | 1.6.0 | MIT | https://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz | transitive (node_modules/thenify-all) | low | Transitive dependency from package-lock.json. |
| tiny-async-pool | 1.3.0 | MIT | https://registry.npmjs.org/tiny-async-pool/-/tiny-async-pool-1.3.0.tgz | transitive (node_modules/tiny-async-pool) | low | Transitive dependency from package-lock.json. |
| tinyglobby | 0.2.16 | MIT | https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.16.tgz | transitive (node_modules/tinyglobby) | low | Transitive dependency from package-lock.json. |
| tmp | 0.2.5 | MIT | https://registry.npmjs.org/tmp/-/tmp-0.2.5.tgz | transitive (node_modules/tmp) | low | Transitive dependency from package-lock.json. |
| tmp-promise | 3.0.3 | MIT | https://registry.npmjs.org/tmp-promise/-/tmp-promise-3.0.3.tgz | transitive (node_modules/tmp-promise) | low | Transitive dependency from package-lock.json. |
| to-regex-range | 5.0.1 | MIT | https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz | transitive (node_modules/to-regex-range) | low | Transitive dependency from package-lock.json. |
| truncate-utf8-bytes | 1.0.2 | WTFPL | https://registry.npmjs.org/truncate-utf8-bytes/-/truncate-utf8-bytes-1.0.2.tgz | transitive (node_modules/truncate-utf8-bytes) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| ts-interface-checker | 0.1.13 | Apache-2.0 | https://registry.npmjs.org/ts-interface-checker/-/ts-interface-checker-0.1.13.tgz | transitive (node_modules/ts-interface-checker) | low | Transitive dependency from package-lock.json. |
| type-check | 0.4.0 | MIT | https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz | transitive (node_modules/type-check) | low | Transitive dependency from package-lock.json. |
| type-fest | 0.13.1 | (MIT OR CC0-1.0) | https://registry.npmjs.org/type-fest/-/type-fest-0.13.1.tgz | transitive (node_modules/type-fest) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| typescript | 5.9.3 | Apache-2.0 | https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz | devDependencies | low | Direct dependency from package.json. |
| undici | 6.25.0 | MIT | https://registry.npmjs.org/undici/-/undici-6.25.0.tgz | transitive (node_modules/node-gyp/node_modules/undici) | low | Transitive dependency from package-lock.json. |
| undici | 7.25.0 | MIT | https://registry.npmjs.org/undici/-/undici-7.25.0.tgz | transitive (node_modules/undici) | low | Transitive dependency from package-lock.json. |
| undici-types | 7.16.0 | MIT | https://registry.npmjs.org/undici-types/-/undici-types-7.16.0.tgz | transitive (node_modules/electron/node_modules/undici-types) | low | Transitive dependency from package-lock.json. |
| undici-types | 7.24.6 | MIT | https://registry.npmjs.org/undici-types/-/undici-types-7.24.6.tgz | transitive (node_modules/undici-types) | low | Transitive dependency from package-lock.json. |
| universalify | 0.1.2 | MIT | https://registry.npmjs.org/universalify/-/universalify-0.1.2.tgz | transitive (node_modules/app-builder-lib/node_modules/@electron/get/node_modules/universalify) | low | Transitive dependency from package-lock.json. |
| universalify | 0.1.2 | MIT | https://registry.npmjs.org/universalify/-/universalify-0.1.2.tgz | transitive (node_modules/electron-winstaller/node_modules/universalify) | low | Transitive dependency from package-lock.json. |
| universalify | 2.0.1 | MIT | https://registry.npmjs.org/universalify/-/universalify-2.0.1.tgz | transitive (node_modules/universalify) | low | Transitive dependency from package-lock.json. |
| update-browserslist-db | 1.2.3 | MIT | https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.2.3.tgz | transitive (node_modules/update-browserslist-db) | low | Transitive dependency from package-lock.json. |
| uri-js | 4.4.1 | BSD-2-Clause | https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz | transitive (node_modules/uri-js) | low | Transitive dependency from package-lock.json. |
| use-sync-external-store | 1.6.0 | MIT | https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.6.0.tgz | transitive (node_modules/use-sync-external-store) | low | Transitive dependency from package-lock.json. |
| utf8-byte-length | 1.0.5 | (WTFPL OR MIT) | https://registry.npmjs.org/utf8-byte-length/-/utf8-byte-length-1.0.5.tgz | transitive (node_modules/utf8-byte-length) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| util-deprecate | 1.0.2 | MIT | https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz | transitive (node_modules/util-deprecate) | low | Transitive dependency from package-lock.json. |
| verror | 1.10.1 | MIT | https://registry.npmjs.org/verror/-/verror-1.10.1.tgz | transitive (node_modules/verror) | low | Transitive dependency from package-lock.json. |
| vite | 7.3.3 | MIT | https://registry.npmjs.org/vite/-/vite-7.3.3.tgz | devDependencies | low | Direct dependency from package.json. |
| which | 2.0.2 | ISC | https://registry.npmjs.org/which/-/which-2.0.2.tgz | transitive (node_modules/cross-spawn/node_modules/which) | low | Transitive dependency from package-lock.json. |
| which | 5.0.0 | ISC | https://registry.npmjs.org/which/-/which-5.0.0.tgz | transitive (node_modules/which) | low | Transitive dependency from package-lock.json. |
| which | 6.0.1 | ISC | https://registry.npmjs.org/which/-/which-6.0.1.tgz | transitive (node_modules/node-gyp/node_modules/which) | low | Transitive dependency from package-lock.json. |
| word-wrap | 1.2.5 | MIT | https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz | transitive (node_modules/word-wrap) | low | Transitive dependency from package-lock.json. |
| wrap-ansi | 7.0.0 | MIT | https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz | transitive (node_modules/wrap-ansi) | low | Transitive dependency from package-lock.json. |
| wrappy | 1.0.2 | ISC | https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz | transitive (node_modules/wrappy) | low | Transitive dependency from package-lock.json. |
| xmlbuilder | 15.1.1 | MIT | https://registry.npmjs.org/xmlbuilder/-/xmlbuilder-15.1.1.tgz | transitive (node_modules/xmlbuilder) | low | Transitive dependency from package-lock.json. |
| y18n | 5.0.8 | ISC | https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz | transitive (node_modules/y18n) | low | Transitive dependency from package-lock.json. |
| yallist | 3.1.1 | ISC | https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz | transitive (node_modules/yallist) | low | Transitive dependency from package-lock.json. |
| yallist | 4.0.0 | ISC | https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz | transitive (node_modules/hosted-git-info/node_modules/yallist) | low | Transitive dependency from package-lock.json. |
| yallist | 5.0.0 | BlueOak-1.0.0 | https://registry.npmjs.org/yallist/-/yallist-5.0.0.tgz | transitive (node_modules/tar/node_modules/yallist) | medium | Permissive or public-domain-style license, but uncommon; human review recommended. |
| yargs | 17.7.2 | MIT | https://registry.npmjs.org/yargs/-/yargs-17.7.2.tgz | transitive (node_modules/yargs) | low | Transitive dependency from package-lock.json. |
| yargs-parser | 21.1.1 | ISC | https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz | transitive (node_modules/yargs-parser) | low | Transitive dependency from package-lock.json. |
| yauzl | 2.10.0 | MIT | https://registry.npmjs.org/yauzl/-/yauzl-2.10.0.tgz | transitive (node_modules/yauzl) | low | Transitive dependency from package-lock.json. |
| yocto-queue | 0.1.0 | MIT | https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz | transitive (node_modules/yocto-queue) | low | Transitive dependency from package-lock.json. |
| zod | 4.4.3 | MIT | https://registry.npmjs.org/zod/-/zod-4.4.3.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 4.5.7 | MIT | https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz | dependencies | low | Direct dependency from package.json. |
| zustand | 5.0.13 | MIT | https://registry.npmjs.org/zustand/-/zustand-5.0.13.tgz | dependencies | low | Direct dependency from package.json. |

## TODO / Human Review

- Verify the exact current licenses and terms for optional external CLIs before recommending them in official release notes. They are not bundled with MAO.
- Re-run this audit after every dependency update and before publishing packaged binaries.
- If packaged binaries include Electron, native modules, or platform binaries, preserve required license notices in the final installer/distribution.
