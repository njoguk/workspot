# Platform Configuration

This is the single source of truth for platform identity.
**Change values here to rename or rebrand the platform at any time.**

Claude Code reads this file first. Any component, copy, or file that
references the platform name pulls from these values — never hardcoded.

---

## Identity

```
PLATFORM_NAME=RemoSpot
PLATFORM_DOMAIN=remospot.com
PLATFORM_TAGLINE=Find your spot. Do your best work.
PLATFORM_SHORT_DESCRIPTION=Nairobi's curated remote work directory
PLATFORM_LONG_DESCRIPTION=The definitive marketplace where remote workers in Nairobi discover, check in, review, and book workspace sessions at cafés, hotel lobbies, gardens, and coworking spaces.
```

## Scoring

```
SCORE_LABEL=WorkScore
SCORE_LABEL_CREATIVE=SpaceScore
```

## Community

```
COMMUNITY_NAME=Nairobi Remote Workers
COMMUNITY_EVENT_NAME=Workcation
SUBSCRIPTION_NAME=WorkPass
VENUE_PORTAL_NAME=Partner Portal
```

## Brand Colours (reference only — full design system is in DESIGN_SYSTEM.md)

```
PRIMARY_ACCENT=[from DESIGN_SYSTEM.md]
```

---

## How to Rename the Platform

1. Change `PLATFORM_NAME` above to your new name
2. Change `PLATFORM_DOMAIN` to your new domain
3. Open your Claude Project chat and say:
   "Update all components to use the new platform name from CONFIG.md"
4. Claude Code will find and replace all hardcoded instances

You do not need to manually update any code files.
