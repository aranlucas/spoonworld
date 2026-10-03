# Provenance

Source: https://github.com/dmmulroy/anti-slop

Exact commit: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`. Production assets copied unmodified from `skills/install-anti-slop/assets/anti-slop/` to `tools/oxlint/anti-slop/`. Root MIT license and nested ESLint Stylistic LICENSE/UPSTREAM.md are preserved.

## Integration

Oxlint and @oxlint/plugins are both exactly 1.86.0. All 18 generic custom rules plus native oxc/no-accumulating-spread are enabled. No direct Effect dependency exists, so Effect remains unregistered. Existing package manager, CI triggers, security checks and formatting commands are preserved.

Three documented no-runtime-typeof exceptions preserve existing imported/save-file validation in native JavaScript. Unit tests: 11 passed. Clean dependency install/build/browser checks locally are blocked by npm dependency tarball HTTP403 and omitted binary assets; existing CI performs complete validation.

Initial diagnostic counts: {"anti-slop(no-runtime-typeof)": 3, "anti-slop(require-readable-spacing)": 321, "eslint(no-unused-expressions)": 1, "eslint(no-unused-vars)": 1}. Final lint: zero diagnostics using the matching, already verified local toolchain. No deployment or merge.
