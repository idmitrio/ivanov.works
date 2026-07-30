---
name: review-workflow
description: Run project-agnostic code reviews for diffs, PRs, architectural changes, critiques, risk assessments, bug or regression hunts, and security review using Codex Security when available.
---

# Review Workflow

## Overview

Use this shared skill when the user asks for a code review, review of changes, architectural review, critique, risk assessment, diff or PR check, or asks to find bugs, regressions, security risks, or missing tests.

Act as a reviewer, not an implementer. Do not modify files unless the user explicitly asks you to fix the issues.

This shared skill defines only the generic review discipline. If a project has a project-specific review skill, apply that project skill in addition to this shared skill. Project-specific checks belong in local overlay skills, not in this shared skill.

## Recommended Reasoning

Default: `high`

Use `high` for normal code, architecture, risk, and regression reviews because the workflow requires tracing changed behavior, contracts, tests, and concrete failure modes. Use `xhigh` for security reviews, large PRs, auth/payment/data-storage changes, infrastructure or dependency changes, migrations, and reviews where missing one issue would have high production impact.

## Capabilities

- Review local diffs, PR diffs, changed files, architectural proposals, and risk assessments.
- Prioritize concrete bugs, regressions, security risks, migration risks, and missing tests.
- Run a security-focused pass for reviewed code using Codex Security when it is available.
- Use sub-agents for parallel review work without asking for extra permission when the review has independent areas that benefit from delegation.
- Produce findings first with severity and file/line references.
- State residual test gaps and review limitations.
- Work with project-specific review overlay skills when they exist.

## Not Supported

- Do not modify files while using this skill unless the user explicitly asks for fixes.
- Do not perform broad style-only reviews unless the user explicitly asks for style feedback.
- Do not replace project-specific review rules; apply local overlays in addition to this shared discipline.

## Review Priorities

Prioritize findings that create concrete current risk:

- Correctness bugs.
- Behavior regressions.
- Security and privacy risks.
- Data loss or migration risks.
- Broken public contracts.
- Concurrency, async, or resource leaks where relevant.
- Missing tests for changed behavior.
- Maintainability risks only when they create concrete current risk.

Do not prioritize:

- Subjective style preferences.
- Broad refactors.
- Unrelated improvements.
- Theoretical architecture concerns without concrete risk.
- Summary before findings.

## Workflow

1. Inspect `git status` when reviewing local changes.
2. Inspect the relevant diff, PR, or changed files.
3. Identify the changed behavior and affected contracts.
4. Inspect relevant tests or note missing tests.
5. For reviewed code changes, run a security-focused pass over the same review scope using Codex Security when it is available. Use the applicable `$codex-security` workflow for the target shape, such as a PR, commit, branch diff, working-tree diff, patch, or repository scan.
6. Focus on the highest-risk changed areas first when the diff is large.
7. Produce findings first, ordered by severity.
8. Ask clarifying questions only when the review intent or baseline is unclear.

## Sub-Agent Delegation

Invoking this skill is explicit permission to use sub-agents for review work when sub-agents are available. Do not ask the user for separate confirmation before delegating bounded, independent review tasks.

Use sub-agents for work that can run in parallel without blocking the main review path, such as:

- Security analysis of a high-risk changed surface.
- Focused review of an isolated subsystem or file group.
- Test coverage inspection for changed behavior.
- Verification of a specific suspected regression or attack path.

Keep delegation scoped to review. Sub-agents must not modify files unless the user explicitly asked for fixes. Integrate sub-agent results into the normal findings-first output, and validate that any reported finding satisfies this skill's finding requirements before including it.

## Security Review

When the review scope includes source code, infrastructure code, configuration that affects runtime behavior, dependency changes, authentication, authorization, parsing, serialization, filesystem access, network access, data storage, secrets handling, payments, or permission boundaries, include a Codex Security pass.

Use the same scope and baseline as the review:

- PR review: scan the PR diff.
- Commit review: scan the commit against its parent unless the user provided another baseline.
- Branch review: scan the requested merge-base-to-head range.
- Working-tree or patch review: scan the local diff or patch being reviewed.
- Repository review: scan the repository scope requested by the user.

Security findings must still satisfy this skill's finding requirements. Report only concrete, validated security or privacy risks, and fold them into the normal `Findings` list with severity, file/line reference, risk, impact, and smallest reasonable correction.

If Codex Security is unavailable in the current session, state that limitation under `Residual Risk / Test Gaps` and still perform a manual security pass for obvious issues in the reviewed scope.

## Finding Requirements

Each finding must include:

- Severity.
- File and line reference.
- Concrete risk.
- Why it matters.
- Smallest reasonable correction.

Use a small correction snippet only when it is the clearest way to explain the issue. Do not rewrite the code in the review response.

## Severity Guidance

High:

- Data loss.
- Security or privacy issue.
- Broken production path.
- Public API, auth, payment, or permission regression.
- Migration risk that can corrupt or block data.

Medium:

- Likely behavior bug.
- Missing error handling.
- Contract mismatch.
- Missing important test.
- Bad boundary that creates concrete maintenance or behavior risk.

Low:

- Small maintainability issue.
- Unclear naming only if it can cause real confusion.
- Minor missing edge-case coverage.

## Output Format

Use this format strictly:

```text
Findings
- High: path/to/file.ext:12 - Concrete issue, why it matters, and smallest reasonable correction.
- Medium: path/to/file.ext:34 - Concrete issue, why it matters, and smallest reasonable correction.
- Low: path/to/file.ext:56 - Concrete issue, why it matters, and smallest reasonable correction.

Open Questions
- Question or assumption that affects review confidence.

Residual Risk / Test Gaps
- Test gap or area not covered by the review.

Summary
- Short summary only after findings.
```

If there are no findings, start with:

```text
Findings
- No findings.
```

Then include `Residual Risk / Test Gaps` when any remain. Keep summaries short and secondary.

## Interaction Rules

- Do not praise broadly.
- Do not summarize the diff before findings.
- Keep open questions limited to information needed to judge risk.
- Keep summaries short and secondary.

## Examples

No findings:

```text
Findings
- No findings.

Residual Risk / Test Gaps
- I did not run the full integration suite, so environment-specific regressions remain possible.

Summary
- The changed path is narrow and covered by the inspected tests.
```

Finding:

```text
Findings
- High: app/payments.py:42 - The payment callback accepts unsigned status updates, which can mark unpaid orders as paid; verify the provider signature before mutating order state.

Residual Risk / Test Gaps
- No callback replay test was present.

Summary
- The review focused on payment-state mutation paths.
```

## Verification

A review response is complete when it has inspected the relevant changed files and tests, reports findings first in the required format, and clearly states any residual risk or test gaps.
