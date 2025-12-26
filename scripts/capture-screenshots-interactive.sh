#!/bin/bash

# Interactive Screenshot Capture with Verification
# Guides user through capturing perfect screenshots

set -e

SCREENSHOT_DIR="website/screenshots"
APP_NAME="Ursly VFS"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  📸 Interactive Screenshot Capture${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if app is running
if ! pgrep -f "$APP_NAME" > /dev/null; then
    echo -e "${RED}❌ $APP_NAME is not running${NC}"
    echo ""
    echo -e "${YELLOW}Please start the app first:${NC}"
    echo -e "   ${BLUE}npm run start:vfs${NC}"
    echo ""
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ App is running${NC}"
echo ""

# Function to capture screenshot with instructions
capture_with_instructions() {
    local filename=$1
    local description=$2
    local instructions=$3
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}📸 Capturing: $description${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Instructions:${NC}"
    echo "$instructions"
    echo ""
    echo -e "${YELLOW}Press ENTER when ready to capture...${NC}"
    read -r
    
    # Get window ID
    WINDOW_ID=$(osascript <<EOF 2>/dev/null
tell application "System Events"
    tell process "$APP_NAME"
        if exists window 1 then
            return id of window 1
        end if
    end tell
end tell
EOF
)
    
    if [ -z "$WINDOW_ID" ]; then
        echo -e "${RED}❌ Could not find app window${NC}"
        echo -e "${YELLOW}   Please ensure the app window is visible${NC}"
        return 1
    fi
    
    # Capture screenshot
    screencapture -l$WINDOW_ID -x "$SCREENSHOT_DIR/$filename"
    
    if [ -f "$SCREENSHOT_DIR/$filename" ]; then
        SIZE=$(stat -f%z "$SCREENSHOT_DIR/$filename" 2>/dev/null || stat -c%s "$SCREENSHOT_DIR/$filename" 2>/dev/null)
        SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
        echo -e "${GREEN}✅ Captured: $filename (${SIZE_MB}MB)${NC}"
        
        # Open screenshot for verification
        echo -e "${BLUE}📂 Opening screenshot for verification...${NC}"
        open "$SCREENSHOT_DIR/$filename"
        
        echo ""
        echo -e "${YELLOW}Does this screenshot look correct? (y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⚠️  You may want to retake this screenshot${NC}"
        fi
        echo ""
    else
        echo -e "${RED}❌ Failed to capture screenshot${NC}"
        return 1
    fi
}

# Main capture sequence
echo -e "${BLUE}Starting screenshot capture sequence...${NC}"
echo ""

# 1. Main Files View
capture_with_instructions \
    "vfs-main-dark-latest.png" \
    "Main File Browser (Files Tab)" \
    "1. Navigate to Files tab (should be active by default)
2. Ensure files/folders are visible in main area
3. Bottom toolbar should show: Shortcuts | Search (2 buttons)
4. Header should show: Files | Metrics | Settings tabs
5. Dismiss any onboarding tour (press Escape or click Skip)
6. Dark theme should be active"

# 2. Metrics Dashboard (CRITICAL)
capture_with_instructions \
    "vfs-performance-metrics-latest.png" \
    "Performance Metrics Dashboard" \
    "1. Click Metrics tab in header
2. ⚠️  CRITICAL: Wait until metrics dashboard shows ACTUAL data
   - Should see CPU usage charts
   - Should see GPU metrics
   - Should see RAM usage
   - Should see Disk I/O
   - Should see Network stats
   - Should NOT see 'Metrics Unavailable' error
3. Wait 5-10 seconds for charts to populate
4. Bottom toolbar: Shortcuts | Search
5. Header: Files | Metrics | Settings (Metrics highlighted)"

# 3. Settings Page
capture_with_instructions \
    "vfs-settings-dark-latest.png" \
    "Settings Page" \
    "1. Click Settings tab in header
2. Should see Theme Mode toggle (Dark/Light)
3. Should see Accent Color grid (10 color swatches)
4. Should see Onboarding section
5. Bottom toolbar: Shortcuts | Search
6. Header: Files | Metrics | Settings (Settings highlighted)"

# 4. Keyboard Shortcuts Dialog
capture_with_instructions \
    "vfs-keyboard-shortcuts-latest.png" \
    "Keyboard Shortcuts Dialog" \
    "1. Go to Files tab
2. Press ? key to open shortcuts dialog
3. Dialog should be visible with all shortcuts listed
4. App should be visible behind dialog (blurred)
5. Press Escape after capturing to close dialog"

# 5. Add Storage Modal
capture_with_instructions \
    "vfs-add-storage-dark-latest.png" \
    "Add Storage Modal" \
    "1. Go to Files tab
2. Click '+ Add Storage' button in sidebar
3. Modal should be visible with storage provider options
4. App should be visible behind modal (blurred)
5. Press Escape after capturing to close modal"

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All screenshots captured!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📁 Screenshots saved to: $SCREENSHOT_DIR/${NC}"
echo ""
echo -e "${YELLOW}⚠️  Final Verification Checklist:${NC}"
echo "   [ ] Metrics screenshot shows ACTUAL metrics (not error)"
echo "   [ ] Files screenshot shows files/folders (not empty)"
echo "   [ ] All screenshots show current UI (Settings tab, 2-button toolbar)"
echo "   [ ] No onboarding tour overlays"
echo "   [ ] Dark theme active in all screenshots"
echo ""
echo -e "${GREEN}Ready to commit! 🎉${NC}"

