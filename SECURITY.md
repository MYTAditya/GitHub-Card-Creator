# Security Policy

## Supported Versions

GitHub Card Creator is a small, actively-maintained client-side tool. There is no long-term support policy for older versions — security attention is focused on the latest code on the `master` branch and the most recent published release, which is also what powers the live deployment at [github-card-creator.vercel.app](https://github-card-creator.vercel.app).

| Version | Supported |
| --- | --- |
| Latest release | :white_check_mark: |
| `master` branch | :white_check_mark: |
| Older releases | :x: |

If you're running an older fork or self-hosted copy, please update to the latest `master` before reporting an issue, since it may already be fixed.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.** Publicly disclosing a vulnerability before it's fixed can put users at risk.

Instead, please report it privately using one of the following methods:

1. **Preferred:** Use GitHub's private vulnerability reporting feature for this repository:
   [github.com/MYTAditya/GitHub-Card-Creator/security/advisories/new](https://github.com/MYTAditya/GitHub-Card-Creator/security/advisories/new)
2. **Discord:** Message the maintainer directly on Discord: [discord.com/users/808184827177336832](https://discord.com/users/808184827177336832)
3. If neither of the above works, open a regular issue asking to be contacted privately (without including vulnerability details), and the maintainer will follow up.

> **No bug bounty:** This is a free, volunteer-maintained project with no budget, so **no monetary bug bounty or reward is offered** for vulnerability reports. Valid reports are still very much appreciated and will be credited (if you'd like) once a fix is out.

When reporting, please include as much of the following as you can:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it (a minimal example or proof-of-concept is very helpful).
- The affected version/commit.
- Any suggested fix or mitigation, if you have one.

### What to Expect

This project is maintained on a best-effort, volunteer basis, so please be patient with response times. As a general guide:

- **Acknowledgment:** We'll aim to acknowledge your report within a few days.
- **Assessment:** We'll investigate and let you know whether it's confirmed as a valid issue.
- **Fix & disclosure:** If confirmed, we'll work on a fix and coordinate an appropriate disclosure timeline with you. Credit will be given to reporters who wish to be acknowledged, once a fix is released.

## Scope

GitHub Card Creator is a client-side web app that generates GitHub-style preview cards, primarily by calling the public GitHub API and rendering results in the browser. Relevant security concerns include (but aren't limited to):

- Cross-site scripting (XSS) via user-supplied input (e.g. repository names, URLs, or other GitHub data rendered into the page).
- Insecure handling of any tokens/credentials, if applicable.
- Dependency vulnerabilities (e.g. flagged by `npm audit` or GitHub Dependabot alerts).
- Issues in the build/deployment configuration (Vite, Vercel) that could expose sensitive data.

Since this is a fan-made project and not an official GitHub product, vulnerabilities in GitHub's own platform or APIs should be reported directly to GitHub via their [Security Bug Bounty program](https://bounty.github.com/), not here.

## Disclaimer
This app generates links and preview cards for publicly available GitHub resources (repositories, issues, commits, etc.) based on user input. It does not control, host, or vet the content at those destinations, nor the third-party image service (opengraph.githubassets.com) used to render previews. The maintainer is not liable for any content found at generated or linked URLs, or for any consequences of visiting them.

This project is provided under the BSD-2-Clause License, "as is," without warranty of any kind. See [LICENSE](./LICENSE) for details.
