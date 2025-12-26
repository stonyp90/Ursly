#!/bin/bash

# Automated Screenshot Capture for Ursly VFS
# Uses macOS automation to capture perfect screenshots

set -e

SCREENSHOT_DIR="website/screenshots"
APP_NAME="Ursly VFS"
DELAY_BETWEEN_ACTIONS=3
METRICS_LOAD_WAIT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📸 Automated Screenshot Capture${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if app is running
check_app_running() {
    if ! pgrep -f "Ursly VFS" > /dev/null; then
        echo -e "${RED}❌ Error: $APP_NAME is not running${NC}"
        echo -e "${YELLOW}   Please start the app first: npm run start:vfs${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ App is running${NC}"
}

# Wait for app window to be ready
wait_for_window() {
    echo -e "${BLUE}⏳ Waiting for app window to be ready...${NC}"
    sleep 2
}

# Activate app and bring to front
activate_app() {
    osascript <<EOF
tell application "$APP_NAME"
    activate
    delay 1
end tell
EOF
    sleep 1
}

# Click on a tab in the header
click_tab() {
    local tab_name=$1
    echo -e "${BLUE}📋 Switching to $tab_name tab...${NC}"
    
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        -- Find and click the tab
        try
            set tabButton to button "$tab_name" of group 1 of window 1
            click tabButton
            delay 1
        on error
            -- Try alternative method: click by position or accessibility
            keystroke "$tab_name" using {command down, shift down}
            delay 1
        end try
    end tell
end tell
EOF
    sleep $DELAY_BETWEEN_ACTIONS
}

# Wait for metrics to load (check for error state)
wait_for_metrics() {
    echo -e "${BLUE}⏳ Waiting for metrics to load (this may take up to ${METRICS_LOAD_WAIT}s)...${NC}"
    
    # Wait and check if "Metrics Unavailable" text exists
    for i in {1..10}; do
        sleep 1
        # Check if error state exists (we want it to NOT exist)
        if ! osascript -e "tell application \"System Events\" to tell process \"$APP_NAME\" to exists (static text \"Metrics Unavailable\" of window 1)" 2>/dev/null; then
            echo -e "${GREEN}✅ Metrics loaded successfully${NC}"
            sleep 2  # Extra wait for charts to render
            return 0
        fi
        echo -e "${YELLOW}   Still waiting... ($i/${METRICS_LOAD_WAIT}s)${NC}"
    done
    
    echo -e "${YELLOW}⚠️  Warning: Metrics may not have loaded fully${NC}"
    echo -e "${YELLOW}   Please verify the screenshot shows actual metrics, not 'Metrics Unavailable'${NC}"
    sleep 2
}

# Dismiss onboarding tour if present
dismiss_onboarding() {
    echo -e "${BLUE}🔍 Checking for onboarding tour...${NC}"
    
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        try
            -- Try to find and click "Skip tour" button
            set skipButton to button "Skip tour" of window 1
            click skipButton
            delay 1
        on error
            -- No onboarding tour found, continue
        end try
    end tell
end tell
EOF
    sleep 1
}

# Take screenshot of current window
capture_screenshot() {
    local filename=$1
    local description=$2
    
    echo -e "${GREEN}📸 Capturing: $description${NC}"
    
    # Get window ID
    WINDOW_ID=$(osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        set frontWindow to window 1
        return id of frontWindow
    end tell
end tell
EOF
)
    
    # Capture window screenshot
    screencapture -l$WINDOW_ID -x "$SCREENSHOT_DIR/$filename"
    
    if [ -f "$SCREENSHOT_DIR/$filename" ]; then
        echo -e "${GREEN}   ✅ Saved: $SCREENSHOT_DIR/$filename${NC}"
    else
        echo -e "${RED}   ❌ Failed to save screenshot${NC}"
        exit 1
    fi
    
    sleep 1
}

# Main execution
main() {
    echo -e "${BLUE}Starting automated screenshot capture...${NC}"
    echo ""
    
    # Pre-flight checks
    check_app_running
    wait_for_window
    activate_app
    dismiss_onboarding
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Capturing Screenshots${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # 1. Main Files view
    echo -e "${YELLOW}[1/5] Main Files View${NC}"
    click_tab "Files"
    sleep 2  # Wait for files to load
    capture_screenshot "vfs-main-dark-latest.png" "Main file browser (Files tab)"
    echo ""
    
    # 2. Metrics Dashboard (CRITICAL - must show actual metrics)
    echo -e "${YELLOW}[2/5] Metrics Dashboard${NC}"
    click_tab "Metrics"
    wait_for_metrics  # Wait for metrics to load
    capture_screenshot "vfs-performance-metrics-latest.png" "Performance metrics dashboard"
    echo ""
    
    # 3. Settings Page
    echo -e "${YELLOW}[3/5] Settings Page${NC}"
    click_tab "Settings"
    sleep 2
    capture_screenshot "vfs-settings-dark-latest.png" "Settings page"
    echo ""
    
    # 4. Keyboard Shortcuts Dialog
    echo -e "${YELLOW}[4/5] Keyboard Shortcuts${NC}"
    click_tab "Files"  # Go back to Files tab
    sleep 1
    # Press ? key to open shortcuts
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        keystroke "?"
        delay 2
    end tell
end tell
EOF
    sleep 2
    capture_screenshot "vfs-keyboard-shortcuts-latest.png" "Keyboard shortcuts dialog"
    # Close dialog
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        key code 53  -- Escape key
        delay 1
    end tell
end tell
EOF
    echo ""
    
    # 5. Add Storage Modal
    echo -e "${YELLOW}[5/5] Add Storage Modal${NC}"
    click_tab "Files"
    sleep 1
    # Click "+ Add Storage" button (try to find it)
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        try
            -- Try to find and click "Add Storage" button
            set addButton to button "Add Storage" of window 1
            click addButton
            delay 2
        on error
            -- Try alternative: click by text
            keystroke "a" using {command down}
            delay 2
        end try
    end tell
end tell
EOF
    sleep 2
    capture_screenshot "vfs-add-storage-dark-latest.png" "Add Storage modal"
    # Close modal
    osascript <<EOF
tell application "System Events"
    tell process "$APP_NAME"
        key code 53  -- Escape key
        delay 1
    end tell
end tell
EOF
    echo ""
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ All screenshots captured successfully!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please verify screenshots:${NC}"
    echo -e "   1. Metrics screenshot shows ACTUAL metrics (not 'Metrics Unavailable')"
    echo -e "   2. Files screenshot shows files/folders (not empty)"
    echo -e "   3. Bottom toolbar shows: Shortcuts | Search (2 buttons)"
    echo -e "   4. Header shows: Files | Metrics | Settings tabs"
    echo ""
    echo -e "${BLUE}📁 Screenshots saved to: $SCREENSHOT_DIR/${NC}"
    echo ""
}

# Run main function
main

