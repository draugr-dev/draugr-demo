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
| `checkout/go.mod` | a Go library with four CVEs — two the code calls, two it does not | `sca` | Trivy fs + govulncheck |

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
formats to `./.draugr/out/`, where everything a run writes belongs — reports beside the
fragments, one directory to gitignore or to keep:
```bash
draugr scan draugr.saga.yaml
ls .draugr/out/           # results.sarif, report.md, report.html, openvex.json
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

### Reachability — which vulnerabilities this code can actually reach

`checkout/` is a small Go service pinned to a library carrying four known vulnerabilities. It calls
a function two of them are about, and never touches the parts the other two are in. A manifest
scanner reports all four identically; `govulncheck` says which two matter here.

```bash
draugr scan draugr.saga.yaml --top 0 | grep -A1 'checkout/go.mod'
```

```console
P1  high  7.5  CVE-2022-32149  sca  trivy  api  checkout/go.mod
    → reachable: main → ListenAndServe → Serve → serve → ServeHTTP → handler → preferred → ParseAcceptLanguage
P2  high  7.5  CVE-2020-14040  sca  trivy  api  checkout/go.mod
    ↓ ranked as medium — the vulnerable code is never called
```

Two things to notice. The **severity is unchanged** on all four — reachability feeds the priority
band and never rewrites what the scanner reported. And the two nothing calls are **still in the
report**, one band lower, not removed: a call graph does not see reflection or dynamic dispatch, so
an unreachable finding is ranked down rather than excused. Excusing one is
[`config.exclude`](draugr.saga.yaml) or a VEX document, both of which carry an author.

The run summary says how it went, including how much it could not determine:

```console
Reachability:
  govulncheck  2 reachable, 2 unreachable
  Unreachable findings are ranked down in priority, not removed from the report.
```

The other two repositories in this component are Python and YAML, and the report says so rather
than leaving them looking unexamined:

```console
Measured against:
  sca  govulncheck — coverage this repository has no go.mod, so its findings carry no verdict
```

Go only, today. Needs `govulncheck` on your PATH —
`go install golang.org/x/vuln/cmd/govulncheck@latest`; `draugr doctor` will tell you.

### Fix list — actions, not just findings

```bash
draugr scan draugr.saga.yaml --group action   # one row per thing to do
draugr scan draugr.saga.yaml                  # the default: one row per finding
```

Grouped, this sandbox's 474 findings become ten things to do:

```
Fix first — 10 actions clear 419 findings:
  P1  Update python:3.8-slim  images · 394 findings · upstream
      CVE-2026-42010 +393
  P1  Upgrade Jinja2 2.10  sca · 6 findings
      app/requirements.txt · CVE-2019-10906 +5
```

A library carrying six CVEs is one upgrade, not six rows, and each row says what it clears.
Ungrouped is the default because grouping is only right once a descriptor says which images you
build and which infrastructure you operate; without that it can state a fix nobody can apply.

This descriptor says. `python:3.8-slim` is declared `builtBy: upstream`, which is why 394 findings
collapse into one action — *take a newer image* — rather than a list of libraries nobody here can
upgrade. Delete that line and run it again: the same 394 findings come back as packages, and the
tip at the foot of the report tells you why.

### Explain — what a finding means and how to fix it

```bash
draugr scan draugr.saga.yaml
draugr explain CVE-2019-20477
```

Prints the description and the remediation the scanner published, so understanding a finding does
not mean searching for its identifier. It reads the report the scan just wrote — no path needed —
and takes the part of an id that is unambiguous, so `4.3.1` finds `kube-bench/cis/4.3.1`.

### Evidence — what stands behind the verdict

```bash
draugr scan draugr.saga.yaml --evidence                   # on the console
draugr scan draugr.saga.yaml --report evidence            # as a document
```

Which build of which tool produced each finding, the revision each repository was scanned at, and
what the run cost. Out of the default view because a developer is asking what to fix; an auditor
is a real reader, just not the default one — and both render from the same code, so they cannot
disagree about what the run did.

What a control was **measured against** stays in the default view either way. It says what a scan
did *not* cover, and a partial scan reading as a complete one is worse than a verbose one.

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
