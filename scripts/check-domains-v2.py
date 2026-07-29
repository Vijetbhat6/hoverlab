#!/usr/bin/env python3
"""Re-verify hoverlab.css availability through multiple authoritative paths,
   and scan additional TLDs for good alternatives."""
import json
import urllib.request
from urllib.error import HTTPError, URLError

UA = "Mozilla/5.0 (Hoverlab domain re-check)"

# Public RDAP gateways + per-TLD authoritative servers
GATEWAYS = [
    "https://rdap.org/domain/",
    "https://www.rdap.net/domain/",
]

# Authoritative servers for specific TLDs we care about
RDAP_DIRECT = {
    "css": "https://rdap.nic.css",
    "dev": "https://rdap.nic.google",
    "app": "https://rdap.nic.google",
    "io": "https://rdap.nic.io",
    "sh": "https://rdap.nic.sh",
    "co": "https://rdap.nic.co",
    "tools": "https://rdap.nic.tools",
    "design": "https://rdap.nic.design",
    "so": "https://rdap.nic.so",
    "xyz": "https://rdap.centralnic.com/xyz",
    "tech": "https://rdap.centralnic.com/tech",
    "com": "https://rdap.verisign.com/com/v1",
    "net": "https://rdap.verisign.com/net/v1",
}


def check_one(domain: str) -> str:
    """Returns a status string. Returns 'FREE' if 404 from any RDAP source."""
    tld = domain.rsplit(".", 1)[-1]
    urls_to_try = []
    if tld in RDAP_DIRECT:
        urls_to_try.append(f"{RDAP_DIRECT[tld].rstrip('/')}/domain/{domain}")
    for gw in GATEWAYS:
        urls_to_try.append(f"{gw}{domain}")

    for url in urls_to_try:
        req = urllib.request.Request(
            url, headers={"User-Agent": UA, "Accept": "application/rdap+json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code == 404:
                return f"FREE  ✓  (404 via {url.split('//')[1].split('/')[0]})"
            if e.code in (401, 403, 429):
                continue
            continue
        except (URLError, Exception):
            continue
        try:
            d = json.loads(body)
        except json.JSONDecodeError:
            continue
        # Found a registration record
        registrar = None
        for entity in d.get("entities", []):
            roles = [r.lower() for r in entity.get("roles", [])]
            if "registrar" in roles:
                vcard = entity.get("vcardArray", [None, []])
                if isinstance(vcard, list) and len(vcard) > 1:
                    for item in vcard[1]:
                        if item and item[0] == "fn":
                            registrar = item[3]
                            break
                break
        expiry = None
        for event in d.get("events", []):
            if event.get("eventAction") == "expiration":
                expiry = event.get("eventDate", "")[:10]
                break
        return f"TAKEN  ✗  registrar: {registrar or '?'}  exp: {expiry or '?'}"
    return "UNKNOWN (all sources failed)"


# Re-check the original 14 + add a bunch more good TLDs
candidates = [
    # Re-verify the ones the user said were "not available"
    "hoverlab.css",
    # Strong dev-oriented TLDs to consider instead
    "hoverlab.dev",
    "hoverlab.io",
    "hoverlab.app",
    "hoverlab.sh",
    "hoverlab.co",
    "hoverlab.tools",
    "hoverlab.design",
    "hoverlab.so",
    "hoverlab.software",
    "hoverlab.codes",
    "hoverlab.codes",
    "hoverlab.run",
    "hoverlab.world",
    "hoverlab.zone",
    "hoverlab.studio",
    "hoverlab.build",
    "hoverlab.components",
    "hoverlab.effects",
    "hoverlab.ui",
    "hoverlab.graphics",
    "hoverlab.art",
    # Hyphenated variations if base names are taken
    "hover-lab.css",
    "hover-lab.dev",
    "hover-lab.io",
    "hoverlabs.css",
    "hoverlabs.dev",
    "hoverlabs.io",
    "hover-labs.css",
    "hover-labs.dev",
    # Prefix/suffix alternatives
    "usehoverlab.com",
    "gethoverlab.com",
    "hoverlabapp.com",
    "hoverlabfx.com",
    "tryhoverlab.com",
]

print(f"{'DOMAIN':<28} {'STATUS':<80}")
print("-" * 108)
for d in candidates:
    print(f"{d:<28} {check_one(d)}")
