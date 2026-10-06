# dsh-background-nakfaai

A self-contained background skin for DeepSeek Harness: paints the **left bar**,
**main chat**, and **right bar** with the image and strength you pick, per zone.

## Where images come from

1. **Bundled** — `plugin/assets/sidebar.webp` is always available as the default.
2. **`~/.dsh/background`** — drop images here and they appear automatically.
   This is the only *writable* group and always the first one.
3. **Extra folders** — list any other folders in `~/.dsh/sidebar-bg.json`:

   ```json
   { "dirs": ["~/Pictures", "~/Downloads", "~/Desktop"] }
   ```

   `~` is expanded, duplicates are ignored, and a missing folder is silently
   skipped. A bare JSON array (`["~/Pictures"]`) is also accepted. The picker
   shows one group per folder, so images with the same name stay distinguishable.

   `SIDEBAR_BG_DIRS` (OS path-separator separated) is honoured too, for scripted
   use — but the config file is the supported route, because a bundle patch
   cannot set environment variables for the host process.

Supported formats: `.webp`, `.png`, `.jpg`, `.jpeg`, `.avif`, `.gif`. Hidden
files are skipped. Only image extensions are ever served, from the configured
roots only — no directory traversal outside them.

## Host compatibility

The zone selectors match minified CSS-module class fragments, which DeepSeek
recompiles in most releases. They are listed newest-first so one file works
across host lines:

| Zone  | Fragments matched                                    |
|-------|------------------------------------------------------|
| left  | `sidebarCol`                                          |
| main  | `centerCol`, `frame`                                  |
| right | `rightbarCol` (0.2.0), `sidebarRight`, `rightCol` (0.1.7), `workbench` / `bottomPanel` (≤0.1.7-rc.1, now dead) |

If a background stops appearing after an app update, dump the live class names
from `app.asar` and add the new fragment — do not delete the old ones.

> **Note:** a client plugin that throws during activation can gate the whole
> app, so keep slot/DOM work wrapped in `try/catch`.
