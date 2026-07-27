## Draugr — ❌ FAIL

**Release:** draugr-demo 1.0

| Priority | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| Findings | 99 | 174 | 166 | 0 |

### Controls

| Control | Verdict | Critical | High | Medium | Low |
|---|---|---:|---:|---:|---:|
| secrets | **FAIL** | 0 | 1 | 0 | 0 |
| iac | **FAIL** | 0 | 4 | 5 | 12 |
| images | **FAIL** | 10 | 68 | 152 | 153 |
| sast | **FAIL** | 0 | 7 | 9 | 0 |
| sca | **FAIL** | 3 | 6 | 8 | 1 |

### Fix first

| Priority | Severity | Score | Rule | Control | Scanner | Location |
|---|---|---|---|---|---|---|
| P1 | critical | 9.8 | `CVE-2026-42010` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2026-31789` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2026-31789` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2026-8376` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2023-45853` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.8 | `CVE-2019-20477` | sca | Trivy | app/requirements.txt:4 |
| P1 | critical | 9.8 | `CVE-2020-14343` | sca | Trivy | app/requirements.txt:4 |
| P1 | critical | 9.8 | `CVE-2020-1747` | sca | Trivy | app/requirements.txt:4 |
| P1 | critical | 9.5 | `CVE-2026-57433` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-33845` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2025-7458` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-13221` | images | Trivy | python:3.8-slim |
| P1 | critical | 9.1 | `CVE-2026-42496` | images | Trivy | python:3.8-slim |
| P1 | high | 8.8 | `CVE-2024-6345` | images | Trivy | python:3.8-slim |
| P1 | high | 8.6 | `CVE-2019-10906` | sca | Trivy | app/requirements.txt:5 |
| P1 | high | 8.4 | `CVE-2026-57432` | images | Trivy | python:3.8-slim |
| P1 | high | 8.2 | `CVE-2025-32988` | images | Trivy | python:3.8-slim |
| P1 | high | 8.2 | `CVE-2025-32990` | images | Trivy | python:3.8-slim |
| P1 | high | 8.1 | `CVE-2026-28387` | images | Trivy | python:3.8-slim |
| P1 | high | 8.1 | `CVE-2026-28387` | images | Trivy | python:3.8-slim |
| P1 | high | 8.1 | `CVE-2023-31484` | images | Trivy | python:3.8-slim |
| P1 | high | 8.0 | `DS-0002` | iac | Trivy | app/Dockerfile:1 |
| P1 | high | 8.0 | `KSV-0014` | iac | Trivy | deploy/pod.yaml:8 |
| P1 | high | 8.0 | `KSV-0017` | iac | Trivy | deploy/pod.yaml:8 |
| P1 | high | 8.0 | `KSV-0118` | iac | Trivy | deploy/pod.yaml:6 |

_…and 414 more finding(s)._
