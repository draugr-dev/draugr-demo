## Draugr — ❌ FAIL

**Release:** draugr-demo 1.0

| Priority | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| Findings | 10 | 7 | 0 | 0 |

### Controls

| Control | Verdict | Critical | High | Medium | Low |
|---|---|---:|---:|---:|---:|
| sca | **FAIL** | 4 | 6 | 7 | 0 |

**Scanned**

- `https://github.com/draugr-dev/draugr-demo.git` at `b292c384` — 7 uncommitted files not included

### Components

| Component | Verdict | P1 | P2 | P3 | P4 | Failing controls |
|---|---|---:|---:|---:|---:|---|
| api | **FAIL** | 10 | 7 | 0 | 0 | sca |
| platform | pass | 0 | 0 | 0 | 0 | - |

**1 finding suppressed by config.exclude — 1 accepted by demo@example.com**

_SBOM: 1 document (cyclonedx-json)._

### Fix first

| Priority | Severity | Score | Rule | Control | Scanner | Component | Location |
|---|---|---|---|---|---|---|---|
| P1 | critical | 9.8 | `CVE-2019-20477` | sca | trivy | api | app/requirements.txt |
| P1 | critical | 9.8 | `CVE-2020-14343` | sca | trivy | api | app/requirements.txt |
| P1 | critical | 9.8 | `CVE-2020-1747` | sca | trivy | api | app/requirements.txt |
| P1 | critical | 9.0 | `CVE-2019-10906` | sca | trivy | api | app/requirements.txt |
| P1 | high | 8.8 | `CVE-2025-27516` | sca | trivy | api | app/requirements.txt |
| P1 | high | 8.7 | `CVE-2019-1010083` | sca | trivy | api | app/requirements.txt |
| P1 | high | 8.7 | `CVE-2023-30861` | sca | trivy | api | app/requirements.txt |
| P1 | high | 7.8 | `CVE-2024-56326` | sca | trivy | api | app/requirements.txt |
| P1 | high | 7.5 | `CVE-2018-18074` | sca | trivy | api | app/requirements.txt |
| P1 | high | 7.5 | `CVE-2020-28493` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 6.1 | `CVE-2024-22195` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 6.1 | `CVE-2023-32681` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 5.6 | `CVE-2024-35195` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 5.5 | `CVE-2026-25645` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 5.4 | `CVE-2024-34064` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 5.3 | `CVE-2024-47081` | sca | trivy | api | app/requirements.txt |
| P2 | medium | 4.3 | `CVE-2026-27205` | sca | trivy | api | app/requirements.txt |
