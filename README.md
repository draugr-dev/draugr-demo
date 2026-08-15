# draugr-demo — an intentionally-vulnerable app for testing security scanners

A small Python app with **planted, reproducible vulnerabilities** across every layer a scanner
looks at: injection and unsafe `eval` in the source, known-vulnerable dependencies, a fake
private key, a root-running Dockerfile, and a privileged Kubernetes pod.

It exists to exercise [Draugr](https://github.com/draugr-dev/draugr) end to end — every control,
every report format, the publishers, and `draugr diff`. **It is equally useful for evaluating any
scanner**: the findings are the point, they are stable, and each one is documented below with the
class of tool that should catch it. If you are comparing SAST or SCA tools and want a fixture
where you already know the answer, this is one.

Point Draugr at it and you get a verdict in two commands:

```bash
git clone https://github.com/draugr-dev/draugr-demo && cd draugr-demo
curl -fsSL https://draugr.dev/install.sh | sh
draugr scan .
```

> ⚠️ **This repo is deliberately insecure.** The vulnerabilities, misconfigurations, and the
> "secret" are planted and fake. Do **not** use any of this as a template or deploy it.

## What's planted (and which control catches it)

| File | Planted issue | Control | Scanner |
|------|---------------|---------|---------|
| `app/app.py` | command injection, `eval`, `shell=True`, debug bind | `sast` | Semgrep |
| `app/requirements.txt` | old, vulnerable dependencies | `sca` | Trivy fs |
| `app/static/js/jquery.min.js` | a vendored library in no lockfile | `sca` | retire.js |
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

### Fragments — the descriptor is not one file

This descriptor is assembled from three:

```
draugr.saga.yaml                                         ← the service, and what to run
  fragments:
    - path: ".draugr/exclusions/*.saga-fragment.yaml"
    - path: ".draugr/components/*.saga-fragment.yaml"

.draugr/exclusions/cve-2018-1000656.saga-fragment.yaml   ← an accepted risk: why, who, when it lapses
.draugr/components/platform.saga-fragment.yaml           ← a component, described by the team that owns it
```

Two different reasons to split, and both are about **who reviews what**.

A descriptor that has been running a while is a structural account of a system *and* a log of dated
decisions about findings somebody accepted. Those change at different times: a developer adding a
repository and a security owner accepting a CVE should not be the same review.

And a descriptor does not have to be written by one person who knows the whole system. The platform
team knows what the platform team runs, so `platform` is described in its own file — with its own
`exposure` and `criticality`, which are that team's claim about what it runs.

```bash
draugr validate draugr.saga.yaml --resolved   # the three files merged into one, as Draugr sees it
```

A fragment can be pulled from **another repository** too — `fragments:` takes a `url` as well as a
`path` — which is how several teams contribute to one product's descriptor without sharing a
checkout. Worth knowing before you need it: a component may then hold repositories from anywhere,
and every finding records which one it came from, so the same file in two projects is two findings
rather than one.

The finding is **not deleted**. It stays in the report marked suppressed:

```
1 finding suppressed by config.exclude — 1 accepted by demo@example.com
```

The question an auditor asks is never "did the scanner run" — it is who decided this was
acceptable, and when. Delete the fragment and re-scan: the finding comes back, which is the point.

### Prioritization
```bash
draugr classify draugr.saga.yaml     # set component exposure/criticality via a wizard
draugr scan draugr.saga.yaml --min-priority P2   # focus on what matters now
```
Change `exposure`/`criticality` in the Saga and watch the P1–P4 banding shift.

### Diff — the PR story

**Three example pull requests are permanently open on this repo, on purpose.** They aren't
neglected work — each one shows the pull-request gate on a real change, in the two places it
appears, without your having to set it up:

| PR | What it shows |
|---|---|
| [#3 Add /download endpoint](https://github.com/draugr-dev/draugr-demo/pull/3) | A change that **introduces** a new finding — what the gate is for |
| [#2 Bump vulnerable dependencies](https://github.com/draugr-dev/draugr-demo/pull/2) | Findings reported as **fixed** |
| [#1 Harden the API](https://github.com/draugr-dev/draugr-demo/pull/1) | Source fixes clearing `sast` findings |

Open one and you get both surfaces:

- **A sticky comment** — new, fixed and unchanged counts, updated in place on every push rather
  than added to.
- **Annotations on the Files changed tab** — and only for the findings *that pull request
  introduced*. This repository is deliberately full of vulnerabilities, so an upload of everything
  would bury a reviewer under hundreds they did not cause; the workflow sets `code-scanning: new`,
  so the diff is what reaches the Security tab. `main` is unaffected — code scanning scopes an
  upload to the ref it was made against — and a push to `main` uploads the complete scan.

Their checks are re-run against each new Draugr release, so both stay current.

To do the same locally — compare two scans and gate only on *new* findings:
```bash
# Baseline the current state.
draugr scan draugr.saga.yaml -o base/

# Make a change (e.g. fix app/app.py or bump a dependency), then:
draugr scan draugr.saga.yaml -o head/
draugr diff base/results.sarif head/results.sarif                    # new / fixed / unchanged
draugr diff base/results.sarif head/results.sarif --fail-on-new-priority P1
draugr diff base/results.sarif head/results.sarif --format sarif     # just the new findings, for code scanning
draugr diff base/results.sarif head/results.sarif --format markdown  # ready-made PR comment
```

## Suggested "fix it" exercise

Try driving the numbers down and confirm `draugr diff` reports them as **fixed**:
- Bump `Flask`/`requests`/`PyYAML`/`Jinja2` in `app/requirements.txt` to current versions (`sca`).
- Replace `os.popen`/`eval`/`shell=True` in `app/app.py` with safe equivalents (`sast`).
- Remove `app/config.example.pem` (`secrets`).
- Add a non-root `USER`, pin the base image; fix `deploy/pod.yaml`'s securityContext (`iac`).
