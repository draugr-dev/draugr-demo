# draugr-demo

A tiny, **intentionally-vulnerable** sample app for exercising [Draugr](https://github.com/draugr-dev/draugr)
end to end — every control, every report format, the publishers, and `draugr diff`. Use it to
evaluate Draugr's features and developer experience without touching a real codebase.

> ⚠️ **This repo is deliberately insecure.** The vulnerabilities, misconfigurations, and the
> "secret" are planted and fake. Do **not** use any of this as a template or deploy it.

## What's planted (and which control catches it)

| File | Planted issue | Control | Scanner |
|------|---------------|---------|---------|
| `app/app.py` | command injection, `eval`, `shell=True`, debug bind | `sast` | Semgrep |
| `app/requirements.txt` | old, vulnerable dependencies | `sca` | Trivy fs |
| `app/config.example.pem` | a fake private key | `secrets` | Gitleaks |
| `app/Dockerfile` | runs as root, old base image | `iac` / `images` | Trivy |
| `deploy/pod.yaml` | privileged pod, `latest` tag, no limits | `iac` | Trivy config |

The scan is driven by [`draugr.saga.yaml`](draugr.saga.yaml).

## Quick start

```bash
# 1. Install Draugr (see draugr-dev/draugr releases) and the scanners it needs.
draugr tools install            # Trivy, Gitleaks, Semgrep (pinned + verified)
draugr doctor draugr.saga.yaml  # confirms the environment is ready

# 2. Scan — a readable console summary with a prioritized "fix first" list.
draugr scan draugr.saga.yaml
```

You should see a **FAIL** verdict with findings across `sast`, `sca`, `secrets`, and `iac`,
grouped by priority (P1–P4).

## UAT walkthrough

Work through these to evaluate the experience. Note anything confusing or rough.

### Reports — every format
```bash
draugr scan draugr.saga.yaml --format markdown          # paste into an MR/issue
draugr scan draugr.saga.yaml --format html > report.html # open in a browser
draugr scan draugr.saga.yaml --format junit > junit.xml  # CI test panel
draugr scan draugr.saga.yaml --format json | jq .        # machine-readable
draugr scan draugr.saga.yaml --format template \
  --template '{{.Verdict}}: P1={{.Priorities.P1}} P2={{.Priorities.P2}}'
```

### Publishers — declarative, in the Saga
The Saga already declares a `file` publisher and a `github` publisher. A plain scan writes all
formats to `./draugr-out/`:
```bash
draugr scan draugr.saga.yaml
ls draugr-out/            # results.sarif, report.md, report.html
```
The `github` publisher **no-ops locally** and **uploads to code scanning in CI** — see the
[Draugr workflow](.github/workflows/draugr.yml). After a run on GitHub, open the repo's
**Security → Code scanning** tab: each alert is tagged with the originating scanner
(`scanner:semgrep`, `scanner:trivy`, …).

### Gating
```bash
draugr scan draugr.saga.yaml --fail-on warning       # exit non-zero on warnings+
draugr scan draugr.saga.yaml --fail-on-priority P1   # block only on P1s
echo $?
```

### Prioritization
```bash
draugr classify draugr.saga.yaml     # set component exposure/criticality via a wizard
draugr scan draugr.saga.yaml --min-priority P2   # focus on what matters now
```
Change `exposure`/`criticality` in the Saga and watch the P1–P4 banding shift.

### Diff — the PR story
Compare two scans to see what a change introduced, and gate only on *new* findings:
```bash
# Baseline the current state.
draugr scan draugr.saga.yaml -o base/

# Make a change (e.g. fix app/app.py or bump a dependency), then:
draugr scan draugr.saga.yaml -o head/
draugr diff base/results.sarif head/results.sarif                    # new / fixed / unchanged
draugr diff base/results.sarif head/results.sarif --fail-on-new-priority P1
draugr diff base/results.sarif head/results.sarif --format markdown  # ready-made PR comment
```

## Suggested "fix it" exercise

Try driving the numbers down and confirm `draugr diff` reports them as **fixed**:
- Bump `Flask`/`requests`/`PyYAML`/`Jinja2` in `app/requirements.txt` to current versions (`sca`).
- Replace `os.popen`/`eval`/`shell=True` in `app/app.py` with safe equivalents (`sast`).
- Remove `app/config.example.pem` (`secrets`).
- Add a non-root `USER`, pin the base image; fix `deploy/pod.yaml`'s securityContext (`iac`).
