
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
    const assert = new Assert();

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
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/Extensions\/js\/extensions\/prefs.js';/g,
                "import {ExtensionPreferences, gettext as _} from './mocks/resource_prefs.js';")
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/ui\/main.js';/g,
                "import * as Main from './mocks/shell.js';")
            .replace(/import .* from 'resource:\/\/\/org\/gnome\/[Ss]hell\/extensions\/extension.js';/g,
                "import { gettext as _ } from './mocks/shell.js';")
            .replace(/import { Conf } from '[\./]+Conf.js';/g,
                "import { Conf } from './mocks/Conf.js';")
            .replace(/import {Conf} from '[\./]+Conf.js';/g,
                "import { Conf } from './mocks/Conf.js';")
            // Fix relative imports for files in root when run from tests/
            .replace(/import (.*) from '\.\/(.*)\.js';/g, (match, p1, p2) => {
                if (p2 === 'Conf' || p2 === 'mocks/Conf' || p2 === 'mocks/shell' || p2 === 'mocks/resource_prefs') return match;
                return `import ${p1} from '../${p2}.js';`;
            });
    };

    // 1. Prefs Test
    if (canRunGtk) {
        print("\n--- Running Prefs Tests ---");
        const prefsFile = Gio.File.new_for_path('prefs.js');
        const [success, contents] = prefsFile.load_contents(null);
        if (success) {
            const source = replaceImports(textDecoder.decode(contents));
            const tempFile = Gio.File.new_for_path('tests/temp_prefs.js');
            tempFile.replace_contents(textEncoder.encode(source), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
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

    // 3. InboxScanner Test
    print("\n--- Running InboxScanner Tests ---");
    const inboxFile = Gio.File.new_for_path('InboxScanner.js');
    const [success2, contents2] = inboxFile.load_contents(null);
    if (success2) {
        const source = replaceImports(textDecoder.decode(contents2));
        const tempFile = Gio.File.new_for_path('tests/temp_inbox.js');
        tempFile.replace_contents(textEncoder.encode(source), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        try {
            const tempModule = await import('./temp_inbox.js');
            const testModule = await import('./test_inbox_scanner.js');
            testModule.runTests(assert, tempModule.InboxScanner);
        } catch (e) {
            print("  FAIL: InboxScanner Test: " + e);
            print(e.stack);
        }
    }

    print("\nTests complete.");
}

run();
