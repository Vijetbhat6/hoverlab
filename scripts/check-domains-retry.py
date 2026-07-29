#!/usr/bin/env python3
"""Retry failed domains using alternative public RDAP gateways."""
import json
import urllib.request
from urllib.error import HTTPError, URLError

UA = "Mozilla/5.0 (Hoverlab domain checker)"

# Public RDAP gateways that proxy to the authoritative servers
GATEWAYS = [
    "https://rdap.org/domain/",
    "https://www.rdap.net/domain/",
]

CANDIDATES = [
    "hoverlab.dev",
    "hoverlab.io",
    "hoverlab.app",
    "hoverlab.css",
    "hoverlab.sh",
    "hoverlab.co",
    "hoverlab.tools",
]


def check(domain: str) -> str:
    for gw in GATEWAYS:
        url = f"{gw}{domain}"
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rdap+json"})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                body = resp.read().decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code == 404:
                return f"FREE ✓  (via {gw})"
            if e.code in (401, 403, 429):
                continue  # try next gateway
            return f"HTTP {e.code} (via {gw})"
        except (URLError, Exception) as e:
            continue  # try next gateway
        try:
            d = json.loads(body)
        except json.JSONDecodeError:
            continue
        # Found it — registered
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
                expiry = event.get("eventDate", "")
                break
        return f"TAKEN — registrar: {registrar or '?'} — expires: {expiry or '?'}  (via {gw})"
    return "ALL GATEWAYS FAILED"


print(f"{'DOMAIN':<22} {'STATUS':<100}")
print("-" * 122)
for d in CANDIDATES:
    print(f"{d:<22} {check(d)}")
