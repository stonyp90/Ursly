# How to Take Spotlight Search Screenshot

## Steps

1. **Start the app in dev mode:**

   ```bash
   cd apps/vfs-desktop
   npm run tauri:dev
   ```

2. **Open Spotlight Search:**
   - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
   - Or trigger it programmatically if you have a test button

3. **Show search results:**
   - Type a query like "test" or "file" to show various result types
   - Make sure you can see:
     - Search input field
     - AI search options (Search by Content, Search Video Transcripts)
     - Operator hints (tag:, type:, ext:, etc.)
     - File/folder results if available
     - Footer with keyboard shortcuts

4. **Take screenshot:**
   - **macOS:** `Cmd+Shift+4`, then drag to select the Spotlight overlay
   - **Windows:** `Win+Shift+S`, then select the overlay area
   - **Linux:** Use your system screenshot tool

5. **Save the screenshot:**
   - Save as `vfs-spotlight-search.png`
   - Place it in `website/screenshots/` directory
   - Recommended size: 640x400px or similar (matches other screenshots)

6. **Verify the image:**
   - Check that it shows the Spotlight overlay clearly
   - Ensure text is readable
   - Make sure the dark theme is visible (or light theme if preferred)

## Tips

- Use a dark background/theme for better visual appeal
- Make sure the search shows multiple result types for a complete view
- The screenshot should show the modal overlay with backdrop blur effect
- Include the footer with keyboard shortcuts if possible
