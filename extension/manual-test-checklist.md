# Manual test checklist

Use reserved test addresses as **scan inputs**, not live phishing sites. Scores below are the URL heuristic contribution; AI or known-bad matching can raise the final score. The automated warning test serves a harmless localhost fixture.

| Sample scan input | Heuristic risk | Signal |
| --- | ---: | --- |
| `https://paypal.com.attacker.test/login-verify` | 85 | Brand impersonation + verification bait |
| `https://paypa1.test/login-verify` | 85 | Typosquatting + verification bait |
| `http://sbi-verify.test/update-kyc` | 100 | Impersonation + HTTP + KYC bait |
| `https://xn--pple-43d.test` | 95 | Punycode + impersonation |
| `http://192.0.2.10/login-verify` | 90 | Reserved IP host + HTTP + bait |
| `https://example.zip/claim-prize` | 45 | Suspicious TLD + prize bait |
| `https://paypal.com@evil.test/login-verify` | 55 | Embedded credentials + bait |
| `https://hdfc-support.test` | 60 | Bank impersonation |
| `https://microsoft-security.test/login-verify` | 85 | Brand impersonation + bait |
| `http://amazon-prize.test/claim-prize` | 100 | Brand impersonation + HTTP + prize bait |

- [ ] Chrome and Edge: load `dist`; Firefox 140+: load `dist-firefox`. No extension errors; dark text/background contrast is readable. Firefox sidebar opens.
- [ ] Confirm installation requires backend-only host access. Decline site access: no automatic injection. Grant a single fixture site: navigation scans, badge and overlay work. Remove that grant: automatic protection stops there.
- [ ] Open the popup on a safe fixture, then a dangerous localhost `/login-verify` fixture: score/reasons agree with API; danger overlay traps keyboard focus; Go back and Proceed anyway work. Suspicious result produces a dismissible banner. Internal browser pages fail clearly.
- [ ] Enable link scanning; hover a dangerous fixture link: warning icon appears. Safe links remain plain; at most 20 links are queued per document and requests occur in batches of four.
- [ ] Check a link and selected message through the context menu. Each notification opens its result. Checking a link does not replace the source tab's current-page badge.
- [ ] Toggle auto-scan, notifications and severity threshold; verify preferences persist. Add allowlist and blocklist entries: subdomain boundary matching is correct and blocklist wins.
- [ ] Sign in, submit a prefilled report, verify receipt. Anonymous reporting is rejected. No screenshots or page-body collection. Official portal and 1930 links work. Change backend and confirm JWT is cleared.
- [ ] Stop/restart the service worker in extension developer tools: session cache remains available and the persisted two-minute alarm resumes polling. First poll sets a baseline; a newly ingested high-severity incident notifies once; low-severity incidents do not notify at threshold 4.
- [ ] Disconnect backend: explicit offline state with no SAFE verdict; reconnect and refresh. Exceed anonymous quota: 429 message, no automatic retry storm. Recheck a cached URL and confirm no duplicate classification request within TTL.
- [ ] Open side panel/sidebar: India state heatmap and recent feed populate; resizing has no clipping. Inspect requests: backend scans carry URL only, selected text/report fields appear only on explicit actions, map tiles go to OpenStreetMap, and no remote JavaScript is loaded.

Automated Chromium coverage does not replace these Chrome/Edge/Firefox native UI, notification-delivery and browser-store signing checks.

Regression: `http://example.test` must be at least SUSPICIOUS (30), and `http://www.dghjdgf.com/paypal.co.uk/cyc` must be DANGEROUS (90+). Never visit that domain to test: submit the URL string to the scan endpoint. A DNS/connection failure must clear any previous green badge and show analysis unavailable.
