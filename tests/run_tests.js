
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

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
    const assert = (condition, message) => {
        if (!condition) {
            throw new Error(`Assertion Failed: ${message}`);
        }
        print(`  PASS: ${message}`);
    };

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
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/ui\/main.js';/g,
                "import * as Main from './mocks/shell.js';")
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/ui\/messageTray.js';/g,
                "import { MsgTray, messageTray } from './mocks/shell.js';")
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/extensions\/extension.js';/g,
                "import { gettext as _ } from './mocks/shell.js';")
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/misc\/util.js';/g,
                "import * as Util from './mocks/shell.js';")
            .replace(/import Gio from 'gi:\/\/Gio';/g,
                "import Gio from './mocks/Gio.js';")
            .replace(/import GLib from 'gi:\/\/GLib';/g,
                "import GLib from './mocks/GLib.js';")
            .replace(/import { Conf } from '[\./]+Conf.js';/g,
                "import { Conf } from './mocks/Conf.js';")
            .replace(/import {Conf} from '[\./]+Conf.js';/g,
                "import { Conf } from './mocks/Conf.js';")
            // Fix relative imports to use temp files
            .replace(/import (.*) from '\.\/(.*)\.js';/g, (match, p1, p2) => {
                if (p2.startsWith('mocks/')) return match;
                if (p2 === 'Conf' || p2 === 'shell' || p2 === 'resource_prefs' || p2 === 'Gio' || p2 === 'GLib') return match;
                return `import ${p1} from './temp_${p2.toLowerCase()}.js';`;
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

    // Mockify everything
    const files = [
        'Conf.js', 'InboxScanner.js', 'Notifier.js', 'NotificationFactory.js',
        'EmailAccount.js', 'GmailScanner.js', 'OutlookScanner.js', 'console.js', 'rexml.js', 'prefs.js'
    ];
    files.forEach(mockify);

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
                print(e.stack);
            }
        } else {
            print("\n--- Skipping Prefs Tests (No GTK) ---");
        }

        // 2. Scanners
        print("\n--- Running GmailScanner Tests ---");
        try {
            const gmailModule = await import('./test_gmail_scanner.js');
            gmailModule.runTests(assert);
        } catch (e) { print("  FAIL: GmailScanner Test: " + e); }

        print("\n--- Running OutlookScanner Tests ---");
        try {
            const outlookModule = await import('./test_outlook_scanner.js');
            outlookModule.runTests(assert);
        } catch (e) { print("  FAIL: OutlookScanner Test: " + e); }

        // 3. InboxScanner
        print("\n--- Running InboxScanner Tests ---");
        try {
            const tempModule = await import('./temp_inboxscanner.js');
            const testModule = await import('./test_inbox_scanner.js');
            testModule.runTests(assert, tempModule.InboxScanner);
        } catch (e) {
            print("  FAIL: InboxScanner Test: " + e);
            print(e.stack);
        }

        // 4. Conf
        print("\n--- Running Conf Tests ---");
        try {
            const tempModule = await import('./temp_conf.js');
            const testModule = await import('./test_conf.js');
            testModule.runTests(assert, tempModule.Conf);
        } catch (e) {
            print("  FAIL: Conf Test: " + e);
            print(e.stack);
        }

        // 5. NotificationFactory
        print("\n--- Running NotificationFactory Tests ---");
        try {
            const tempModule = await import('./temp_notificationfactory.js');
            const testModule = await import('./test_notification_factory.js');
            testModule.runTests(assert, tempModule.NotificationFactory, tempModule._unescapeXML);
        } catch (e) {
            print("  FAIL: NotificationFactory Test: " + e);
            print(e.stack);
        }

        // 6. EmailAccount
        print("\n--- Running EmailAccount Tests ---");
        try {
            const tempModule = await import('./temp_emailaccount.js');
            const testModule = await import('./test_email_account.js');
            testModule.runTests(assert, tempModule.EmailAccount);
        } catch (e) {
            print("  FAIL: EmailAccount Test: " + e);
            print(e.stack);
        }

        // 7. Notifier
        print("\n--- Running Notifier Tests ---");
        try {
            const tempModule = await import('./temp_notifier.js');
            const testModule = await import('./test_notifier.js');
            testModule.runTests(assert, tempModule.Notifier);
        } catch (e) {
            print("  FAIL: Notifier Test: " + e);
            print(e.stack);
        }

        console.log("\nTests complete.");
    } catch (err) {
        console.error("An unexpected error occurred during tests:", err);
        console.error(err.stack);
    }
}

run();
