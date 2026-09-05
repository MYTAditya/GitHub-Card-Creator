# Contributing to GitHub Card Creator

Thanks for your interest in contributing! GitHub Card Creator is a small, community-driven tool for generating GitHub-style social preview cards, and contributions of all sizes — bug fixes, features, docs, and design tweaks — are welcome.

> **Note:** This project is a fan-made tool and is **not affiliated with GitHub or GitHub, Inc.** Please keep that in mind when discussing branding, naming, or visual design changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Security Issues](#security-issues)
- [License](#license)

## Code of Conduct

Be respectful and constructive. Assume good intent, keep discussions focused on the work, and avoid personal attacks in issues, pull requests, or discussions. Maintainers may edit, close, or lock threads that don't follow this spirit. See [CODE OF CONDUCT](./CODE_OF_CONDUCT.md) for details.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (bundled with Node.js)
- Git

### Setup

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/GitHub-Card-Creator.git
   cd GitHub-Card-Creator
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Vite will print a local URL (typically `http://localhost:5173`) — open it in your browser to see live-reloading changes.
5. **Build for production** (to sanity-check your changes build cleanly):
   ```bash
   npm run build
   ```

## Project Structure

This is a Vite + TypeScript project styled with Tailwind CSS. At a high level:

```
GitHub-Card-Creator/
├── src/              # Application source code
├── index.html        # Entry HTML
├── vite.config.ts    # Vite configuration
├── tailwind.config.js
├── postcss.config.js
├── tsconfig*.json    # TypeScript configuration
├── eslint.config.js  # Lint rules
└── package.json
```

If you're adding a new card type or preview format, it most likely belongs alongside the existing components/logic in `src/` — look for the existing card-generation code to follow established patterns.

## Development Workflow

1. Create a new branch of `master` for your change:
   ```bash
   git checkout -b feature/short-description
   ```
   Use a prefix that describes the change, e.g. `feature/...`, `fix/...`, `docs/...`, `refactor/...`.
2. Make your changes, testing them locally with `npm run dev`.
3. Run the linter before committing (see below).
4. Keep pull requests focused — one logical change per PR is much easier to review than a large mixed-purpose one.

## Coding Guidelines

- **Language:** Write new code in TypeScript, and keep type annotations meaningful rather than using `any` as an escape hatch.
- **Linting:** Run the linter and fix any issues before opening a PR:
  ```bash
  npm run lint
  ```
- **Styling:** Use Tailwind utility classes consistent with the existing UI rather than introducing new CSS files or inline styles where a Tailwind class already covers the need.
- **Consistency:** Match the formatting, naming, and file organization conventions already used in the codebase rather than introducing a new style in an unrelated PR.
- **No unrelated changes:** Avoid bundling formatting-only or unrelated refactors into a functional PR — it makes review harder and obscures the actual change.

## Commit Messages

Write clear, descriptive commit messages in the imperative mood, e.g.:

```
Add support for Discussion card previews
Fix incorrect avatar sizing on release cards
Update README with new deployment instructions
```

Reference related issues where relevant, e.g. `Fixes #12`.

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/short-description
   ```
2. Open a pull request against the `master` branch of `MYTAditya/GitHub-Card-Creator`.
3. In your PR description, include:
   - What the change does and why.
   - Screenshots or a short clip/GIF for any visual/UI changes.
   - Any related issue numbers.
4. Be responsive to review feedback — small follow-up commits are fine; you don't need to force-push/squash until asked.
5. A maintainer will review, request changes if needed, and merge once it looks good.

## Reporting Bugs

Please [open an issue](https://github.com/MYTAditya/GitHub-Card-Creator/issues) and include:

- A clear, descriptive title.
- Steps to reproduce the issue.
- What you expected to happen vs. what actually happened.
- Screenshots, if the bug is visual.
- Your browser/OS, if relevant.

Search existing issues first to avoid duplicates.

## Suggesting Features

Feature ideas are welcome via [issues](https://github.com/MYTAditya/GitHub-Card-Creator/issues) or [pull requests](https://github.com/MYTAditya/GitHub-Card-Creator/pulls) — describe the use case and, if you can, how it might fit into the existing card-generation flow. Since this project mirrors GitHub's own card styles, keep proposals aligned with that "official social media preview card look" goal rather than introducing unrelated design directions.

## Security Issues

Please **do not** report security vulnerabilities through public GitHub issues. See [SECURITY.md](./SECURITY.md) for how to report them responsibly.

## License

By contributing, you agree that your contributions will be licensed under the project's [BSD-2-Clause License](./LICENSE).
