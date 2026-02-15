
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import system from 'system';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

class Assert {
    equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion Failed: ${message}\n  Actual: ${actual}\n  Expected: ${expected}`);
        }
        print(`  PASS: ${message}`);
    }
}

async function run() {
    print("Starting tests...");
    let failures = 0;

    const assert = (condition, message) => {
        if (!condition) {
            throw new Error(`Assertion Failed: ${message}`);
        }
        print(`  PASS: ${message}`);
    };
    // Backward compatibility for .equal()
    assert.equal = (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`Assertion Failed: ${message}\n  Actual: ${actual}\n  Expected: ${expected}`);
        }
        print(`  PASS: ${message}`);
    };

    // Mock global object for Shell environment
    Object.assign(globalThis, {
        global: {
            get_current_time: () => Date.now(),
            create_app_launch_context: () => ({
                set_timestamp: () => { }
            })
        }
    });

    let canRunGtk = false;
    try {
        const Gtk = (await import('gi://Gtk?version=4.0')).default;
        const Adw = (await import('gi://Adw')).default;
        if (Gtk.init()) {
            Adw.init();
            canRunGtk = true;
            print("GTK/Adw initialized successfully.");
        } else {
            print("Warning: Gtk.init() returned false. Skipping GTK tests.");
        }
    } catch (e) {
        print("Warning: Could not initialize GTK/Adw: " + e + ". Skipping GTK tests.");
    }

    const replaceImports = (source) => {
        return source
            .replace(/import\s+.*\s+from\s+['"]resource:\/\/\/org\/gnome\/[Ss]hell\/ui\/main\.js['"];/g,
                "import * as Main from './mocks/shell.js';")
            .replace(/import\s+.*\s+from\s+['"]resource:\/\/\/org\/gnome\/[Ss]hell\/ui\/messageTray\.js['"];/g,
                "import { MsgTray, messageTray } from './mocks/shell.js';")
            .replace(/import\s+.*\s+from\s+['"]resource:\/\/\/org\/gnome\/[Ss]hell\/extensions\/extension\.js['"];/g,
                "import { gettext as _ } from './mocks/shell.js';")
            .replace(/import\s+.*\s+from\s+['"]resource:\/\/\/org\/gnome\/[Ss]hell\/misc\/util\.js['"];/g,
                "import * as Util from './mocks/shell.js';")
            .replace(/import\s+Gio\s+from\s+['"]gi:\/\/Gio['"];/g,
                "import Gio from './mocks/Gio.js';")
            .replace(/import\s+GLib\s+from\s+['"]gi:\/\/GLib['"];/g,
                "import GLib from './mocks/GLib.js';")
            .replace(/import\s+Soup\s+from\s+['"]gi:\/\/Soup\?version=3\.0['"];/g,
                "import Soup from './mocks/Soup.js';")
            .replace(/import\s+{.*Conf.*}\s+from\s+['"][\.\/]+Conf\.js['"];/g,
                "import { Conf } from './mocks/Conf.js';")
            // Fix relative imports to use temp files
            .replace(/import\s+(.*)\s+from\s+['"][\.\/]+(.*)\.js['"];/g, (match, p1, p2) => {
                if (p2.startsWith('mocks/')) return match;
                const lowP2 = p2.split('/').pop().toLowerCase();
                if (lowP2 === 'conf' || lowP2 === 'shell' || lowP2 === 'resource_prefs' || lowP2 === 'gio' || lowP2 === 'glib' || lowP2 === 'soup') return match;
                return `import ${p1} from './temp_${lowP2}.js';`;
            });
    };

    const mockify = (filename) => {
        const file = Gio.File.new_for_path(filename);
        const [success, contents] = file.load_contents(null);
        if (success) {
            let source = textDecoder.decode(contents);
            source = replaceImports(source);
            const baseName = filename.split('/').pop().split('.')[0].toLowerCase();
            const tempFile = Gio.File.new_for_path(`tests/temp_${baseName}.js`);
            tempFile.replace_contents(textEncoder.encode(source), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        }
    };

    // Mockify everything including tests
    const files = [
        'Conf.js', 'InboxScanner.js', 'Notifier.js', 'NotificationFactory.js',
        'EmailAccount.js', 'GmailScanner.js', 'OutlookScanner.js', 'console.js', 'rexml.js', 'prefs.js',
        'tests/test_gmail_scanner.js', 'tests/test_outlook_scanner.js', 'tests/test_inbox_scanner.js',
        'tests/test_conf.js', 'tests/test_notification_factory.js', 'tests/test_email_account.js',
        'tests/test_notifier.js'
    ];
    files.forEach(mockify);

    const runTestSuite = async (name, testModulePath, ...args) => {
        print(`\n--- Running ${name} ---`);
        try {
            const module = await import(testModulePath);
            await module.runTests(assert, ...args);
        } catch (e) {
            print(`  FAIL: ${name}: ${e}`);
            print(e.stack);
            failures++;
        }
    };

    try {
        // 1. Prefs Test
        if (canRunGtk) {
            print("\n--- Running Prefs Tests ---");
            try {
                const module = await import('./temp_prefs.js');
                const Adw = (await import('gi://Adw')).default;
                const GmailNotificationPreferences = module.default;
                const prefs = new GmailNotificationPreferences();
                const window = new Adw.PreferencesWindow();
                prefs.fillPreferencesWindow(window);
                print("  PASS: fillPreferencesWindow executed without error.");
            } catch (e) {
                print("  FAIL: Prefs Test: " + e);
                failures++;
            }
        } else {
            print("\n--- Skipping Prefs Tests (No GTK) ---");
        }

        // 2. Scanners
        await runTestSuite('GmailScanner Tests', './temp_test_gmail_scanner.js');
        await runTestSuite('OutlookScanner Tests', './temp_test_outlook_scanner.js');

        // 3. InboxScanner
        try {
            const tempModule = await import('./temp_inboxscanner.js');
            await runTestSuite('InboxScanner Tests', './temp_test_inbox_scanner.js', tempModule.InboxScanner);
        } catch (e) { failures++; print(`  FAIL: InboxScanner Load: ${e}`); }

        // 4. Conf
        try {
            const tempModule = await import('./temp_conf.js');
            await runTestSuite('Conf Tests', './temp_test_conf.js', tempModule.Conf);
        } catch (e) { failures++; print(`  FAIL: Conf Load: ${e}`); }

        // 5. NotificationFactory
        try {
            const tempModule = await import('./temp_notificationfactory.js');
            await runTestSuite('NotificationFactory Tests', './temp_test_notification_factory.js', tempModule.NotificationFactory, tempModule._unescapeXML);
        } catch (e) { failures++; print(`  FAIL: NotificationFactory Load: ${e}`); }

        // 6. EmailAccount
        try {
            const tempModule = await import('./temp_emailaccount.js');
            await runTestSuite('EmailAccount Tests', './temp_test_email_account.js', tempModule.EmailAccount);
        } catch (e) { failures++; print(`  FAIL: EmailAccount Load: ${e}`); }

        // 7. Notifier
        try {
            const tempModule = await import('./temp_notifier.js');
            await runTestSuite('Notifier Tests', './temp_test_notifier.js', tempModule.Notifier);
        } catch (e) { failures++; print(`  FAIL: Notifier Load: ${e}`); }

        print("\nTests complete.");
        if (failures > 0) {
            print(`FAILED with ${failures} error(s).`);
            system.exit(1);
        }
    } catch (err) {
        print("An unexpected error occurred during tests: " + err);
        print(err.stack);
        system.exit(1);
    }
}

run();
