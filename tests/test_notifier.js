
/**
 *
 * @param {object} assert
 * @param {Function} Notifier
 */
export function runTests(assert, Notifier) {
    console.log('--- Running Notifier Tests ---');

    const mockEmailAccount = {
        config: {
            getMessagesShown: () => ['id1'],
            setMessagesShown: val => {
                mockEmailAccount.messagesShownSet = val;
            },
            getReader: () => 0,
        },
        mailbox: 'test@gmail.com',
    };

    const notifier = new Notifier(mockEmailAccount);

    // Mock NotificationFactory
    notifier._notificationFactory = {
        createEmailNotification: (msg, cb) => {
            notifier.lastNotification = msg;
            notifier.lastCallback = cb;
        },
        createErrorNotification: (content, _cb) => {
            notifier.lastError = content;
        },
        destroySources: () => {
            notifier.destroyed = true;
        },
        removeErrors: () => {
            notifier.errorsRemoved = true;
        },
    };

    // Test 1: Should not notify for already shown message
    console.log('  Testing duplicate notification prevention...');
    const messages = [{id: 'id1', subject: 'Old'}, {id: 'id2', subject: 'New'}];
    notifier.displayUnreadMessages(messages);

    if (notifier.lastNotification.id !== 'id2')
        throw new Error('Should have only notified for id2');
    if (!mockEmailAccount.messagesShownSet.includes('id2'))
        throw new Error('id2 should be added to shown set');
    if (mockEmailAccount.messagesShownSet.length !== 2)
        throw new Error('Should have 2 messages in shown set');
    console.log('  PASS: Duplicate notifications prevented.');

    // Test 2: Error notification
    console.log('  Testing error notification preparation...');
    const testError = new Error('Auth failed');
    notifier.showError(testError);
    if (notifier.lastError.from !== 'Auth failed')
        throw new Error("Error message should be 'from'");
    if (notifier.lastError.subject !== 'test@gmail.com')
        throw new Error("Mailbox should be 'subject' in error");
    console.log('  PASS: Error content prepared correctly.');

    // Test 3: removeErrors
    console.log('  Testing removeErrors...');
    notifier.removeErrors();
    if (!notifier.errorsRemoved)
        throw new Error('Should call factory.removeErrors');
    console.log('  PASS: removeErrors called.');

    // Test 4: _openBrowser logic
    console.log('  Testing _openBrowser execution...');
    const isNative = typeof Meta !== 'undefined';

    if (!isNative) {
        // Only mock if not native
        global.get_current_time = () => 123;
        global.create_app_launch_context = () => {
            notifier.launchContextCalled = true;
            return {
                set_timestamp: () => { },
                get_environment: () => [], // Standard GIO context has this
            };
        };
    } else {
        // In native, we wrap the existing one if we want to spy
        const originalCreate = global.create_app_launch_context;
        global.create_app_launch_context = (...args) => {
            notifier.launchContextCalled = true;
            return originalCreate.apply(global, args);
        };
    }

    // We use a dummy link to avoid opening real apps if possible,
    // but Gio might still try. Since we are in headless, it's mostly safe.
    try {
        notifier._openBrowser('https://example.com/test-notification');
    } catch (e) {
        console.log(`    (Expected) Note: Native launch might fail in headless: ${e}`);
    }

    if (!notifier.launchContextCalled)
        throw new Error('Should have created launch context');
    console.log('  PASS: _openBrowser logic checked.');

    // Test 5: destroySources
    console.log('  Testing destroySources...');
    notifier.destroySources();
    if (notifier.destroyed !== true)
        throw new Error('Should call factory.destroySources');
    console.log('  PASS: destroySources called.');
}
