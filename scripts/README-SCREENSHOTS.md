# 📸 Automated Screenshot Capture

## Quick Start

1. **Start the app:**

   ```bash
   npm run start:vfs
   ```

2. **Wait for app to fully load** (metrics should be working)

3. **Run the automation script:**

   ```bash
   ./scripts/auto-capture-screenshots.sh
   ```

4. **Verify screenshots** in `website/screenshots/`

## What It Does

The script automatically:

- ✅ Checks if app is running
- ✅ Activates the app window
- ✅ Dismisses onboarding tour if present
- ✅ Navigates to each tab (Files → Metrics → Settings)
- ✅ **Waits for metrics to load** (checks for "Metrics Unavailable" error)
- ✅ Captures high-quality window screenshots
- ✅ Saves to `website/screenshots/` with correct filenames

## Requirements

- macOS (uses AppleScript and `screencapture`)
- App must be running (`npm run start:vfs`)
- App must have permissions (System Preferences > Privacy > Screen Recording)

## Troubleshooting

### "Metrics Unavailable" in screenshot

- **Cause**: Metrics didn't load in time
- **Fix**: Increase `METRICS_LOAD_WAIT` in script, or manually verify metrics are loading before running script

### Script can't find window

- **Cause**: App name mismatch or window not ready
- **Fix**: Check app name matches `APP_NAME` variable in script

### Screenshots are blank

- **Cause**: Missing screen recording permissions
- **Fix**: System Preferences > Privacy > Screen Recording > Enable for Terminal/iTerm

## Manual Alternative

If automation doesn't work, use the detailed guide:

```bash
cat scripts/capture-perfect-screenshots.md
```

## Files Created

- `vfs-main-dark-latest.png` - Files tab with file browser
- `vfs-performance-metrics-latest.png` - Metrics dashboard (MUST show actual metrics!)
- `vfs-settings-dark-latest.png` - Settings page
- `vfs-keyboard-shortcuts-latest.png` - Shortcuts dialog
- `vfs-add-storage-dark-latest.png` - Add Storage modal
