# Security Scan Reference

Comprehensive security validation for commerce apps before PR submission.

## Two-phase security validation

### Phase 1: Automated scan script

```bash
bash .github/scripts/security-scan.sh commerce-<appName>-app-v<version>/
```

**Blocking issues (21 checks — must fix):**
- S1: Dynamic code evaluation constructs — code injection sinks
- S2: Dynamic module loading with concatenation
- S3: Unsafe innerHTML assignment — XSS risk
- S4: Hardcoded secrets (API keys, AWS keys, GitHub PATs, Slack tokens, private keys)
- S5: Hardcoded credentials in impex XML
- S7: Inline Authorization headers — must use service framework
- S8: Additional DOM sinks — outerHTML assignment, document.write, insertAdjacentHTML
- S9: ISML `<isprint>` with `encoding="off"` — template injection
- S10: Secret files in package (.env, .key, .pem, .p12, .pfx, .jks)
- S11: Direct HTTPClient usage — must use service framework
- S13: setTimeout/setInterval in hook scripts — blocking calls
- S14: Unbounded loops (while(true)/for(;;)) without break/return
- S15: Service profiles missing rate-limit-enabled AND circuit-breaker-enabled
- P1: Service profile XML missing timeout-millis
- Q1: Hook scripts referenced in hooks.json that don't exist
- Q2: Hook scripts missing expected function exports
- Q3: Missing error handling (try/catch) in hook scripts
- Q4: Missing uninstall/services.xml or missing mode="delete" (including service ID mismatches)
- Q5: Hardcoded site-id instead of SITEID placeholder
- Q6: Absolute file paths in code
- Q7: Console logging in cartridge code — use dw.system.Logger

**Warnings (3 checks — should review):**
- S6: Non-cryptographic random number generation (Math.random)
- S12: PII field names in Logger calls (may be false positive — requires context)
- S16: Session object access in hook scripts (dw.system.Session, session.privacy)

### Phase 2: AI-powered semantic review

After the script runs, perform semantic analysis:

**Data exfiltration patterns:**
- Review hook scripts and service calls for unauthorized data collection
- Does the app send basket, customer, or order data to endpoints unrelated to its declared domain?
- Example violation: Tax app sending customer emails to external analytics service

**Permission scope creep:**
- Does the app access Script API objects or customer data beyond its stated purpose?
- Example violation: Shipping app reading dw.customer.Profile payment instruments

**Business logic vulnerabilities:**
- Could hook implementations be manipulated? (negative tax values, price overrides)
- Race conditions in shared state access?
- Improper input validation that could affect calculations?

**Service call patterns:**
- Are external API calls batched efficiently, or one call per line item?
- Are service responses validated before use?
- Is retry logic present that could cause duplicate side effects (double-charging)?

**Impex safety:**
- Do install impex files create overly broad permissions?
- Do custom object definitions expose sensitive data without access controls?
- Are retention policies appropriate for data sensitivity?

## Reporting findings

**Blocking findings:**
- Mark validation as **FAIL**
- Provide specific file paths and line numbers
- Explain the security risk
- Recommend specific fixes

**Warnings from semantic review:**
- Include in validation report with clear explanations
- Mark as warnings (non-blocking)
- Explain potential risks and recommended improvements
