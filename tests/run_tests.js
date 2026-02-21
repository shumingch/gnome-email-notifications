
/* global PROJECT_ROOT_INJECTED Meta */

(async () => {
    const GLib = (await import('gi://GLib')).default;

    async function run() {
        print('Running in GNOME Shell environment.');
        print('Starting tests...');
        let failures = 0;

        const assert = (condition, message) => {
            if (!condition)
                throw new Error(`Assertion Failed: ${message}`);

            print(`  PASS: ${message}`);
        };
        assert.equal = (actual, expected, message) => {
            if (actual !== expected)
                throw new Error(`Assertion Failed: ${message}\n  Actual: ${actual}\n  Expected: ${expected}`);

            print(`  PASS: ${message}`);
        };

        const projectRoot = typeof PROJECT_ROOT_INJECTED !== 'undefined' ? PROJECT_ROOT_INJECTED : GLib.get_current_dir();

        const getModulePath = baseName => `file://${projectRoot}/${baseName}.js`;

        const runTestSuite = async (name, testFileName, ...args) => {
            print(`\n--- Running ${name} ---`);
            try {
                const path = `file://${projectRoot}/tests/${testFileName}`;
                const module = await import(path);
                await module.runTests(assert, ...args);
            } catch (e) {
                print(`  FAIL: ${name}: ${e}`);
                print(e.stack);
                failures++;
            }
        };

        try {
            // 1. Prefs Test (skipped in headless Shell - no GTK)
            print('\n--- Skipping Prefs Tests (Headless Shell) ---');

            // 2. Scanners
            await runTestSuite('GmailScanner Tests', 'test_gmail_scanner.js');
            await runTestSuite('OutlookScanner Tests', 'test_outlook_scanner.js');
            await runTestSuite('GraphScanner Tests', 'test_graph_scanner.js');

            // 3. InboxScanner
            try {
                const inboxModule = await import(getModulePath('InboxScanner'));
                await runTestSuite('InboxScanner Tests', 'test_inbox_scanner.js', inboxModule.InboxScanner);
            } catch (e) {
                failures++;
                print(`  FAIL: InboxScanner Load: ${e}`);
            }

            // 4. Conf
            try {
                const confModule = await import(getModulePath('Conf'));
                await runTestSuite('Conf Tests', 'test_conf.js', confModule.Conf);
            } catch (e) {
                failures++;
                print(`  FAIL: Conf Load: ${e}`);
            }

            // 5. NotificationFactory
            try {
                const nfModule = await import(getModulePath('NotificationFactory'));
                await runTestSuite('NotificationFactory Tests', 'test_notification_factory.js', nfModule.NotificationFactory, nfModule._unescapeXML);
            } catch (e) {
                failures++;
                print(`  FAIL: NotificationFactory Load: ${e}`);
            }

            // 6. EmailAccount
            try {
                const emailModule = await import(getModulePath('EmailAccount'));
                await runTestSuite('EmailAccount Tests', 'test_email_account.js', emailModule.EmailAccount);
            } catch (e) {
                failures++;
                print(`  FAIL: EmailAccount Load: ${e}`);
            }

            // 7. Notifier
            try {
                const notifierModule = await import(getModulePath('Notifier'));
                await runTestSuite('Notifier Tests', 'test_notifier.js', notifierModule.Notifier);
            } catch (e) {
                failures++;
                print(`  FAIL: Notifier Load: ${e}`);
            }

            // 8. Extension (_mergeAccounts)
            await runTestSuite('Extension Tests', 'test_extension.js');

            print('\nTests complete.');
            if (failures > 0)
                print(`FAILED with ${failures} error(s).`);
        } catch (err) {
            print(`An unexpected error occurred during tests: ${err}`);
            print(err.stack);
        }

        Meta.quit();
    }

    try {
        await run();
    } catch (e) {
        print(`FATAL UNHANDLED ERROR: ${e}`);
        if (e?.stack)
            print(e.stack);
        Meta.quit();
    }
})();
