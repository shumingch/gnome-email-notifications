#!/bin/bash

# Configuration
JS_TEST_RUNNER="${JS_TEST_RUNNER:-tests/run_tests.js}"
export GJS_PATH=".:$GJS_PATH"

run_in_shell() {
    echo "Starting GNOME Shell..."
    # --unsafe-mode is required for D-Bus Eval in newer GNOME versions
    # We also use --mode=user to ensure it's a regular shell session
    gnome-shell --headless --virtual-monitor=1024x768 --unsafe-mode > shell.log 2>&1 &
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
    grep -E "JS LOG|PASS:|FAIL:|Native Shell|GNOME Shell started|Running in" shell.log || true
    
    if [ $RESULT_CODE -ne 0 ]; then
        echo "Test evaluation failed."
        kill $SHELL_PID
        return 1
    fi
    
    if grep -q "FAIL:" shell.log; then
        echo "One or more tests failed in log."
        kill $SHELL_PID
        return 1
    fi
    
    echo "All tests passed (inside Shell environment)!"
    kill $SHELL_PID
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
    rm -f shell.log
fi

exit $EXIT_CODE
