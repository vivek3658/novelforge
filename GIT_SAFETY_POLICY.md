# NovelForge Git Safety & Security Policy

This document defines the mandatory repository security standards and Git workflows for the **NovelForge** project (`vivek3658/novelforge`).

---

## 1. Never Commit Secrets

Never commit, push, or expose:
- SMTP passwords or credentials
- API keys, including Brevo API keys (`xkeysib-...`)
- JWT signing secrets
- Database passwords or connection strings containing credentials
- Redis passwords or authenticated connection strings
- OAuth client secrets
- Private keys (`.pem`, `.key`, `.p12`), certificates, or access tokens
- `.env` files containing real credentials

If any secret is detected, **STOP immediately**. Do not commit or push until it is addressed.

---

## 2. Environment Configuration

- Store sensitive values in environment variables.
- Use environment variable placeholders in application configuration.
- Maintain `.env.example` with placeholder values only.
- Ensure `.env`, `.env.*`, and other secret-bearing files are ignored by Git.
- Allow explicitly safe example files such as `.env.example`.
- Never overwrite a working deployment configuration without checking its existing requirements.

---

## 3. Before Every Commit

Before creating a commit:
1. Run `git status`.
2. Inspect `git diff`.
3. Inspect `git diff --cached`.
4. Review every staged file.
5. Check for credentials, private data, generated files, and unrelated changes.
6. Confirm that all required configuration files remain present.
7. Run relevant tests when practical.
8. Verify that no secrets are included in the staged changes.

If a secret is detected, **STOP**. Do not commit or push until it is addressed.

---

## 4. Before Every Push

Before pushing:
1. Identify the current branch.
2. Check the remote and target branch.
3. Inspect the commits that will be pushed.
4. Check the outgoing changes for secrets.
5. Ensure that no unrelated commits or unfinished work will be pushed accidentally.

**Strict Rule**: Never force-push, rewrite shared history, or delete remote branches without explicit approval.

---

## 5. Preserve Existing Work

- Never discard uncommitted user changes.
- Never run destructive Git commands without explicit approval.
- Do not use `git reset --hard`, `git clean -fd`, or destructive history rewriting without approval.
- Do not amend or rewrite existing commits unless requested.
- Never automatically stage every file with `git add .` or `git add -A`.
- Stage only reviewed files relevant to the requested task.

---

## 6. Configuration Changes

Before modifying deployment configuration:
1. Inspect the existing configuration.
2. Identify required environment variables.
3. Preserve existing working settings unless the task requires changing them.
4. Explain any removed or renamed environment variables.
5. Verify that the application can still start with the required environment variables supplied.

---

## 7. Completion Report

After completing a task, report:
- Files changed.
- Tests performed and their results.
- Configuration or environment variables added, removed, or renamed.
- Git status.
- Whether a commit was created.
- Whether a push was performed.
- Any remaining security concerns.

Never claim that a change was pushed unless the push actually succeeded.

---

## 8. Default Git Behavior

Unless explicitly instructed otherwise:
- Modify files and run appropriate tests.
- Do not commit automatically.
- Do not push automatically.
- Present a concise summary of the changes.
- Ask for approval before committing or pushing.
