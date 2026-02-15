import { Notifier } from '../Notifier.js';

export function run_tests(assert) {
    console.log("--- Running Notifier Tests ---");

    const mockEmailAccount = {
        config: {
            getMessagesShown: () => ["id1"],
            setMessagesShown: (val) => { mockEmailAccount.messagesShownSet = val; },
            getReader: () => 0
        },
        mailbox: "test@gmail.com"
    };

    const notifier = new Notifier(mockEmailAccount);

    // Mock NotificationFactory
    notifier._notificationFactory = {
        createEmailNotification: (msg, cb) => {
            notifier.lastNotification = msg;
            notifier.lastCallback = cb;
        },
        createErrorNotification: (content, cb) => {
            notifier.lastError = content;
        },
        destroySources: () => { notifier.destroyed = true; }
    };

    // Test: Should not notify for already shown message
    const messages = [{ id: "id1", subject: "Old" }, { id: "id2", subject: "New" }];
    notifier.displayUnreadMessages(messages);

    assert(notifier.lastNotification.id === "id2", "Should have only notified for id2");
    assert(mockEmailAccount.messagesShownSet.includes("id1"), "id1 should still be in shown set");
    assert(mockEmailAccount.messagesShownSet.includes("id2"), "id2 should be added to shown set");

    // Test: Error notification
    const testError = new Error("Auth failed");
    notifier.showError(testError);
    assert(notifier.lastError.from === "Auth failed", "Error message should be 'from'");
    assert(notifier.lastError.subject === "test@gmail.com", "Mailbox should be 'subject' in error");

    // Test: destroySources
    notifier.destroySources();
    assert(notifier.destroyed === true, "Should call factory.destroySources");
}
