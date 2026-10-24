# BypassNote — agent instructions

- `src/` contains the Expo app (Expo Router, React Native Web, strict TypeScript), targeting Android and web. Read `README.md` before touching the build setup.
- `bpnote_modules/` contains the installable JavaScript modules (`manifest.json` + `index.js`, distributed as `.zip`). `templates/` is the starter module and is never packaged. Read `bpnote_modules/README.md` before changing a module.
- There is no backend: `.bpnote` files are encoded/decoded locally by `src/lib/codec.ts` (protobufjs + the generated descriptor `src/lib/bpnote_pb.json`). The schema lives in `src/lib/bpnote_file/bpnote_0_1.proto`.
- Never hand-edit `src/lib/bpnote_pb.json`: change the `.proto` file and run `npm run proto:json`.
- Code, comments, UI strings and documentation are written in French; keep them consistent.
- Useful commands: `npm run web`, `npm run android`, `npm run lint`, `npm run build:web`, `npm run cap:sync`.

## Unit tests are mandatory for fixes (all agents)

- Every bug fix or behavior change MUST include unit tests covering it (at minimum, a test that fails before the fix and passes after).
- The repository does not ship a test runner yet. The approved stack is:
  - **Jest + `jest-expo` + `@testing-library/react-native`** for screens, components and hooks.
  - **Node's built-in test runner (`node --test`)** for plain JavaScript (e.g. `bpnote_modules/**/index.js`).
- When adding the first test of a fix, add the devDependencies, the Jest config and the `test` script in the same commit. Do not add Vitest or another test stack without explicit approval.
- Place tests next to the code under test, named `<file>.test.js`, `<file>.test.ts` or `<file>.test.tsx` (component tests may live in a sibling `__tests__/` directory).
- Run `npm test` in the repository root (it runs both suites) before reporting a fix as done; all tests must pass.
- If a fix genuinely cannot be unit-tested, say so explicitly and give the exact manual verification steps instead.

## Conventional Commits (mandatory)

All commit messages MUST follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>
```

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Description: imperative mood, lowercase, no trailing period, 72 characters max for the whole subject line.
- Scope: the affected area, e.g. `ui`, `web`, `modules`, `android`, `docs`.
- Breaking change: add `!` after the type/scope and a `BREAKING CHANGE:` footer.
- One logical change per commit. The unit tests of a fix belong in the same commit as the fix.
- Never use vague messages such as `update`, `fix`, `wip` or `changes`.

Examples:

```
fix(ui): prefill the source key mode in the edit form
test(ui): cover the source key edit round-trip
feat(modules): package installable modules as zip artifacts
build(android): build the web export before Capacitor sync
docs: describe the agent workflow and test rules
```
