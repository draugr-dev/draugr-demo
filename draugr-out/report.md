## Draugr — ❌ FAIL

**Release:** draugr-demo 1.0

| Priority | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| Findings | 69 | 111 | 93 | 18 |

### Controls

| Control | Verdict | Critical | High | Medium | Low |
|---|---|---:|---:|---:|---:|
| iac | **FAIL** | 0 | 7 | 10 | 23 |
| images | **FAIL** | 9 | 40 | 92 | 77 |
| licenses | pass | 0 | 0 | 0 | 0 |
| sast | **FAIL** | 0 | 7 | 8 | 0 |
| sca | **FAIL** | 3 | 5 | 8 | 1 |
| secrets | **FAIL** | 0 | 1 | 0 | 0 |

**Scanned**

- `https://github.com/draugr-dev/draugr-demo.git` at `d96052ec` — 6 uncommitted files not included

### Components

| Component | Verdict | P1 | P2 | P3 | P4 | Failing controls |
|---|---|---:|---:|---:|---:|---|
| api | **FAIL** | 69 | 111 | 90 | 0 | iac, images, sast, sca, secrets |
| platform | **FAIL** | 0 | 0 | 3 | 18 | iac |

**1 finding suppressed by config.exclude — 1 accepted by demo@example.com**

_SBOM: 1 document (cyclonedx-json)._

### Fix first

| Priority | Severity | Score | Rule | Control | Scanner | Component | Location |
|---|---|---|---|---|---|---|---|
| P1 | critical | 9.8 | `CVE-2026-42010` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2026-31789` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2026-8376` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2023-45853` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2019-20477` | sca | Trivy | api | app/requirements.txt:4 |
| P1 | critical | 9.8 | `CVE-2020-14343` | sca | Trivy | api | app/requirements.txt:4 |
| P1 | critical | 9.8 | `CVE-2020-1747` | sca | Trivy | api | app/requirements.txt:4 |
| P1 | critical | 9.5 | `CVE-2026-57433` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-33845` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2025-7458` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-13221` | images | Trivy | api | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-42496` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.8 | `CVE-2024-6345` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.6 | `CVE-2019-10906` | sca | Trivy | api | app/requirements.txt:5 |
| P1 | high | 8.4 | `CVE-2026-57432` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.2 | `CVE-2025-32988` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.2 | `CVE-2025-32990` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.1 | `CVE-2026-28387` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.1 | `CVE-2023-31484` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.0 | `KSV-0014` | iac | Trivy | api | deploy/pod.yaml:8 |
| P1 | high | 8.0 | `KSV-0017` | iac | Trivy | api | deploy/pod.yaml:8 |
| P1 | high | 8.0 | `KSV-0118` | iac | Trivy | api | deploy/pod.yaml:6 |
| P1 | high | 8.0 | `DS-0002` | iac | Trivy | api | app/Dockerfile:1 |
| P1 | high | 8.0 | `CVE-2026-53615` | images | Trivy | api | python:3.8-slim |
| P1 | high | 8.0 | `CVE-2026-54369` | images | Trivy | api | python:3.8-slim |

_…and 266 more finding(s)._
