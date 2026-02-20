#!/bin/bash

# Configuration
JS_TEST_RUNNER="${JS_TEST_RUNNER:-tests/run_tests.js}"
export GJS_PATH=".:$GJS_PATH"

# Allow running tests locally without starting GNOME Shell.
# Set `SKIP_SHELL=1` in your environment to use the mocked GJS test runner.
if [ "${SKIP_SHELL:-0}" = "1" ]; then
    echo "SKIP_SHELL=1 detected — running tests locally without GNOME Shell."
    # Export the project root so tests/run_tests.js can resolve native paths if needed
    export PROJECT_ROOT_INJECTED="$(pwd)"
    # Run the test runner directly under gjs (mocked mode)
    gjs -m "$JS_TEST_RUNNER"
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "Tests failed in mock mode."
        exit $EXIT_CODE
    fi
    # Clean temporary test artifacts if present
    rm -f tests/temp_*.js || true
    rm -rf share gschemas.compiled shell.log || true
    echo "Tests passed (mock mode)."
    exit 0
fi

# Compile schemas and set data dirs so Shell can find them
PROJECT_ROOT=$(pwd)
mkdir -p "$PROJECT_ROOT/share/glib-2.0/schemas"
cp "$PROJECT_ROOT/schemas/"*.xml "$PROJECT_ROOT/share/glib-2.0/schemas/"
glib-compile-schemas "$PROJECT_ROOT/share/glib-2.0/schemas"

# Robustly prepend local share to XDG_DATA_DIRS, ensuring system paths are preserved
if [ -z "$XDG_DATA_DIRS" ]; then
    export XDG_DATA_DIRS="$PROJECT_ROOT/share:/usr/share:/usr/local/share"
else
    export XDG_DATA_DIRS="$PROJECT_ROOT/share:$XDG_DATA_DIRS"
fi

# Diagnostic info
echo "GNOME Shell version: $(gnome-shell --version)"
echo "XDG_DATA_DIRS: $XDG_DATA_DIRS"

# Ensure /tmp/.X11-unix exists and is writable (required for XWayland in CI containers)
if [ ! -d /tmp/.X11-unix ]; then
    echo "Creating /tmp/.X11-unix..."
    mkdir -p /tmp/.X11-unix || true
fi
chmod 1777 /tmp/.X11-unix || true

# Ensure XDG_RUNTIME_DIR is set and valid (required for Wayland socket)
if [ -z "$XDG_RUNTIME_DIR" ] || [ ! -d "$XDG_RUNTIME_DIR" ]; then
    export XDG_RUNTIME_DIR="/tmp/runtime-dir-$(id -u)"
    echo "Setting XDG_RUNTIME_DIR to $XDG_RUNTIME_DIR"
    mkdir -p "$XDG_RUNTIME_DIR"
    chmod 700 "$XDG_RUNTIME_DIR"
fi

run_in_shell() {
    echo "Starting Xvfb..."
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    XVFB_PID=$!
    
    # Mock system bus with session bus to satisfy LoginManager/systemd checks in CI
    echo "Mocking system bus with session bus..."
    export DBUS_SYSTEM_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS"

    echo "Starting GNOME Shell..."
    # --unsafe-mode is required for D-Bus Eval in newer GNOME versions
    # --mode=user helps skip some GDM/session logic that crashes in CI
    # G_MESSAGES_DEBUG=all adds more verbose logging
    export G_MESSAGES_DEBUG=all
    gnome-shell --headless --virtual-monitor=1024x768 --unsafe-mode --mode=user > shell.log 2>&1 &
    SHELL_PID=$!
    
    echo "Waiting for GNOME Shell to initialize (PID: $SHELL_PID)..."
    sleep 5
    
    # Wait for the Eval method to be available
    MAX_RETRIES=20
    COUNT=0
    while ! gdbus introspect --session --dest org.gnome.Shell --object-path /org/gnome/Shell | grep -q Eval; do
        sleep 1
        COUNT=$((COUNT + 1))
        if [ $COUNT -ge $MAX_RETRIES ]; then
            echo "Error: GNOME Shell Eval method not found within $MAX_RETRIES seconds."
            cat shell.log
            kill $SHELL_PID || true
            return 1
        fi
    done
    
    echo "GNOME Shell is ready. Injecting test runner ($JS_TEST_RUNNER)..."
    
    # Use gjs to send the Eval call robustly
    gjs -m tests/send_eval.js "$JS_TEST_RUNNER"
    RESULT_CODE=$?
    
    echo "--- Shell Log (Full Filtered) ---"
    sleep 2
    grep -E "JS LOG|PASS:|FAIL:|Native Shell|GNOME Shell started|Running in|Starting tests|Tests complete" shell.log || true
    
    if [ $RESULT_CODE -ne 0 ]; then
        echo "Test evaluation failed."
        # No kill here, shell might already be dead
        return 1
    fi
    
    echo "Summary of results captured in log."
    
    if grep -q "FAIL:" shell.log; then
        echo "One or more tests failed in log."
        kill $SHELL_PID 2>/dev/null || true
        kill $XVFB_PID 2>/dev/null || true
        return 1
    fi
    
    echo "All tests passed (inside Shell environment)!"
    kill $SHELL_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    return 0
}

export -f run_in_shell
export JS_TEST_RUNNER

# Run the function inside a new dbus session
dbus-run-session -- bash -c "run_in_shell"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Tests failed. Keeping shell.log for inspection."
else
    # Clean up on success
    rm -rf shell.log share gschemas.compiled
    echo "Tests passed. Cleaned up temporary files."
fi

exit $EXIT_CODE
