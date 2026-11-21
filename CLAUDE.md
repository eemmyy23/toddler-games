# Rules

1. **Respect the architecture** in [ARCHITECTURE.md](ARCHITECTURE.md): everything is data, config or a module — no needless hard-coding in `abc/core/`, `abc.html` or `sw.js`; one class and one base style per UI component.
2. **No comments in code.** Well-architected code explains itself; contracts and rules live in ARCHITECTURE.md.
3. **Fix every bug the moment you see it**, in the same change — never leave a known bug for later.
4. **Be efficient** with tokens and time:
   - Start from the file map and contracts in ARCHITECTURE.md; open only the files a change needs, with targeted grep/reads.
   - After a change: `node tools/check.js --fix`, then `node tools/fast.js` (~13 s) for any CSS/markup/view change. The full `tools/smoke.js` runs in CI; run it locally only when a change touches behaviour it covers.
   - One commit and push per finished change; let CI run, don't poll.
   - Ship silently: open the PR and enable auto-merge (squash) on it — GitHub merges it when CI is green (merge it yourself only if auto-merge is unavailable), wait for the public site to serve the new `abc/manifest.js` version, then report ONCE: what changed and that it is live. Never report CI progress, intermediate notifications or "still running". A PR that only changes `*.md`/`docs/**` runs no CI and is merged directly.
5. **Report only measured results** — never claim a test passed, a deploy finished or a number before seeing it.
