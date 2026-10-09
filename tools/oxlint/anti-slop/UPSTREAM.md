# Provenance

Source: https://github.com/dmmulroy/anti-slop

Exact commit: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`. Production assets copied unmodified from `skills/install-anti-slop/assets/anti-slop/` to `tools/oxlint/anti-slop/`. Root MIT license and nested ESLint Stylistic LICENSE/UPSTREAM.md are preserved.

## Integration

Oxlint and @oxlint/plugins are both exactly 1.87.0 (installed at 1.86.0; bumped together in 55c4d19). Re-verified 2026-10-09: generic plugin assets byte-identical to upstream HEAD `c44ef22`; lint and format clean. All 18 generic custom rules plus native oxc/no-accumulating-spread are enabled. The opt-in Effect plugin (`effect/`) was removed from the vendored copy on 2026-10-09 because the project has no direct Effect dependency; re-adding it requires restoring `effect/` from upstream and registering `anti-slop-effect` in `.oxlintrc.json`. Existing package manager, CI triggers, security checks and formatting commands are preserved.

Three documented no-runtime-typeof exceptions preserve existing imported/save-file validation in native JavaScript. Unit tests: 11 passed. Clean dependency install/build/browser checks locally are blocked by npm dependency tarball HTTP403 and omitted binary assets; existing CI performs complete validation.

Initial diagnostic counts: {"anti-slop(no-runtime-typeof)": 3, "anti-slop(require-readable-spacing)": 321, "eslint(no-unused-expressions)": 1, "eslint(no-unused-vars)": 1}. Final lint: zero diagnostics using the matching, already verified local toolchain. No deployment or merge.
