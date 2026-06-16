---
name: app-rebrand
description: Editable app name + auto-colored brand text rendering
type: feature
---
The app name lives in `public.app_settings` (singleton row id=1). Admins edit it at `/admin/app-settings`. The `BrandProvider` (src/contexts/BrandContext.tsx) exposes `useBrand()` → `{ name, mainPart, accentPart }` and a `splitBrandName()` helper. Coloring rule: last syllable (from last vowel back through preceding consonants) is rendered in brownish `#8B5A2B`; the rest in near-black `#0a0a0a`. The `Logo` component and `Footer` copyright pull from `useBrand()` so renames apply app-wide instantly. Realtime subscription on `app_settings` UPDATE keeps tabs in sync.
