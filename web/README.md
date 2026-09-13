# storefront

A component that exists for one thing the rest of the sandbox cannot show: **two scanners reporting
the same flaw**.

jQuery 1.8.3 is here twice over. `package-lock.json` names it, which is what a manifest scanner
reads, and `static/js/jquery.min.js` is the file itself, which retire.js fingerprints. Both report
the same CVEs.

Draugr counts the flaw once and keeps the other scanner's rating beside it:

```console
  P2  medium  CVE-2020-11023  trivy  web/package-lock.json:7  jquery 1.8.3 → 3.5.0
      also found by retirejs · Untrusted code execution via <option> tag in HTML passed to DOM…
```

The copy is still in `results.sarif`, carrying `correlation.countedUnder`, and the one that counts
carries the other tool's own rating. Trivy calls that CVE 6.9 and retire.js calls it 5, and keeping
both is the point: two scanners rating one flaw differently have said something about coverage that
neither says alone.

Reporting five vulnerabilities as ten is the arithmetic this prevents, and it is the test worth
running against any tool that offers to combine scanners: point two at one target and count the
tickets.
