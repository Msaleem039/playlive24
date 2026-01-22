# Position API Response Specification

## Current Issue
- **Match Detail API** provides runners with selectionIds: `681460`, `63361` (these are shown in UI)
- **Position API** returns selectionIds: `"7337"`, `"10301"` (from odds data)
- **Mismatch**: They don't match, so positions can't be displayed

## Required Response Format

The Position API should return selectionIds that **match the Match Detail API selectionIds** (the ones displayed in the UI).

### Ideal Response Structure:

```json
{
  "success": true,
  "data": {
    "eventId": "32547891",
    "matchOdds": {
      "681460": 80,    // ← selectionId from Match Detail API (Paarl Royals)
      "63361": -200    // ← selectionId from Match Detail API (Joburg Super Kings)
    },
    "bookmaker": {
      "681460": 120,   // ← same selectionIds as matchOdds
      "63361": -150
    },
    "fancy": {
      "fancyId_1": {
        "YES": 50,
        "NO": -100
      }
    }
  }
}
```

## Key Points:

1. **selectionIds in Position API must match Match Detail API selectionIds**
   - Match Detail API: `681460` (Paarl Royals), `63361` (Joburg Super Kings)
   - Position API should use: `"681460"`, `"63361"` (as string keys)

2. **Structure is already correct** - just need correct selectionIds:
   ```json
   {
     "matchOdds": {
       "[matchDetailSelectionId]": [netValue]
     }
   }
   ```

3. **No marketId needed** - we ignore it completely

4. **Each match is independent** - scoped by eventId

## Alternative: If you can't change selectionIds

If Position API must use odds selectionIds (`7337`, `10301`), then provide a mapping:

```json
{
  "success": true,
  "data": {
    "eventId": "32547891",
    "matchOdds": {
      "681460": 80,    // Match Detail selectionId -> net
      "63361": -200
    },
    "mapping": {       // Optional: mapping between odds and match selectionIds
      "7337": "681460",
      "10301": "63361"
    }
  }
}
```

But the **simplest solution** is to use Match Detail API selectionIds directly in Position API response.

