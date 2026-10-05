# Local security patch

This vendored package contains the `braces` stack-depth and AST-cycle protections from [micromatch/braces PR #72](https://github.com/micromatch/braces/pull/72), through commit `28d440b` on October 3, 2026. The upstream repository has not published a fixed npm release yet.

The local version `3.0.4+getthawha.0` identifies the patched fork. Remove this override and vendor copy after upstream publishes a reviewed release that fixes CVE-2026-93687.
