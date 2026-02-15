
export function runTests(assert, Notifier) {
    console.log("--- Running Notifier Tests ---");

    const mockEmailAccount = {
        config: {
            getMessagesShown: () => ["id1"],
            setMessagesShown: (val) => { mockEmailAccount.messagesShownSet = val; },
            getReader: () => 0
        },
        mailbox: "test@gmail.com"
    };

    const notifier = new NotifierClass(mockEmailAccount);

    // Mock NotificationFactory
    notifier._notificationFactory = {
        createEmailNotification: (msg, cb) => {
            notifier.lastNotification = msg;
            notifier.lastCallback = cb;
        },
        createErrorNotification: (content, cb) => {
            notifier.lastError = content;
        },
        destroySources: () => { notifier.destroyed = true; },
        removeErrors: () => { notifier.errorsRemoved = true; }
    };

    // Test 1: Should not notify for already shown message
    console.log("  Testing duplicate notification prevention...");
    const messages = [{ id: "id1", subject: "Old" }, { id: "id2", subject: "New" }];
    notifier.displayUnreadMessages(messages);

    if (notifier.lastNotification.id !== "id2") throw new Error("Should have only notified for id2");
    if (!mockEmailAccount.messagesShownSet.includes("id2")) throw new Error("id2 should be added to shown set");
    if (mockEmailAccount.messagesShownSet.length !== 2) throw new Error("Should have 2 messages in shown set");
    console.log("  PASS: Duplicate notifications prevented.");

    // Test 2: Error notification
    console.log("  Testing error notification preparation...");
    const testError = new Error("Auth failed");
    notifier.showError(testError);
    if (notifier.lastError.from !== "Auth failed") throw new Error("Error message should be 'from'");
    if (notifier.lastError.subject !== "test@gmail.com") throw new Error("Mailbox should be 'subject' in error");
    console.log("  PASS: Error content prepared correctly.");

    // Test 3: removeErrors
    console.log("  Testing removeErrors...");
    notifier.removeErrors();
    if (!notifier.errorsRemoved) throw new Error("Should call factory.removeErrors");
    console.log("  PASS: removeErrors called.");

    // Test 4: _openBrowser logic (simulating success)
    console.log("  Testing _openBrowser success...");
    notifier.launchContextCalled = false;
    global.get_current_time = () => 123;
    global.create_app_launch_context = () => {
        notifier.launchContextCalled = true;
        return "context";
    };

    // We can't easily test Gio.AppInfo.launch_default_for_uri without deep mocks,
    // but we can verify it doesn't crash.
    notifier._openBrowser("https://example.com");
    if (!notifier.launchContextCalled) throw new Error("Should have created launch context");
    console.log("  PASS: _openBrowser executed.");

    // Test 5: destroySources
    console.log("  Testing destroySources...");
    notifier.destroySources();
    if (notifier.destroyed !== true) throw new Error("Should call factory.destroySources");
    console.log("  PASS: destroySources called.");
}
