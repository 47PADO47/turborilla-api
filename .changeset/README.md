# Changesets

This directory holds [Changesets](https://github.com/changesets/changesets) — one Markdown file per pending change that records the semver bump and a changelog entry.

## Adding a changeset

After a change worth releasing, run:

```bash
bun changeset
```

Pick the bump (`patch` / `minor` / `major`) and write a short summary, then commit the generated file alongside your change.

## Releasing

On push to `master`, the [release workflow](../.github/workflows/release.yml) runs `changesets/action`:

- If changesets are pending, it opens (or updates) a **Version Packages** PR that bumps `package.json`, updates `CHANGELOG.md` and deletes the consumed changesets.
- Merging that PR publishes the new version to npm (with provenance) and creates a matching GitHub release.
