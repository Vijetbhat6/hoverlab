#!/usr/bin/env python3
"""Authoritative domain availability checker using RDAP (modern WHOIS)."""
import json
import sys
import urllib.request
from urllib.error import HTTPError, URLError

# Known RDAP servers per TLD (hardcoded to avoid the IANA bootstrap parsing issue)
RDAP_SERVERS = {
    "com": "https://rdap.verisign.com/com/v1",
    "net": "https://rdap.verisign.com/net/v1",
    "org": "https://rdap.publicinterestregistry.org/rdap",
    "io": "https://rdap.nic.io",
    "dev": "https://rdap.nic.google",
    "app": "https://rdap.nic.google",
    "sh": "https://rdap.nic.sh",
    "so": "https://rdap.nic.so",
    "co": "https://rdap.nic.co",
    "xyz": "https://rdap.centralnic.com/xyz",
    "tech": "https://rdap.centralnic.com/tech",
    "tools": "https://rdap.nic.tools",
    "design": "https://rdap.nic.design",
    "css": "https://rdap.nic.css",
}

UA = "Mozilla/5.0 (Hoverlab domain checker)"


def check(domain: str) -> str:
    tld = domain.rsplit(".", 1)[-1]
    server = RDAP_SERVERS.get(tld)
    if not server:
        return f"UNKNOWN (no RDAP server mapped for .{tld})"
    url = f"{server.rstrip('/')}/domain/{domain}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rdap+json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="replace")
    except HTTPError as e:
        if e.code == 404:
            return "FREE"
        if e.code == 401 or e.code == 403:
            return f"RATE-LIMITED/RESTRICTED ({e.code})"
        return f"HTTP {e.code}"
    except URLError as e:
        return f"NETWORK ERROR ({e.reason})"
    except Exception as e:
        return f"ERROR ({e})"

    try:
        d = json.loads(body)
    except json.JSONDecodeError:
        return "PARSE ERROR"

    status = ", ".join(d.get("status", [])) or "n/a"

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

    # Look for expiry date
    expiry = None
    for event in d.get("events", []):
        if event.get("eventAction") == "expiration":
            expiry = event.get("eventDate", "")
            break

    return f"TAKEN — registrar: {registrar or '?'} — expires: {expiry or '?'} — status: {status}"


if __name__ == "__main__":
    candidates = [
        "hoverlab.com",
        "hoverlab.dev",
        "hoverlab.io",
        "hoverlab.app",
        "hoverlab.css",
        "hoverlab.design",
        "hoverlab.sh",
        "hoverlab.so",
        "hoverlab.co",
        "hoverlab.tools",
        "hoverlab.xyz",
        "hoverlab.tech",
        "hoverlab.net",
        "hoverlab.org",
    ]
    print(f"{'DOMAIN':<22} {'STATUS':<90}")
    print("-" * 112)
    for d in candidates:
        print(f"{d:<22} {check(d)}")
