
(async () => {
    const Gio = (await import('gi://Gio')).default;
    const GLib = (await import('gi://GLib')).default;

    const textDecoder = new TextDecoder();
    const textEncoder = new TextEncoder();

    // Detect environment
    const isShellNative = typeof Meta !== 'undefined';
    if (isShellNative) {
        print("Running in NATIVE GNOME Shell environment.");
    } else {
        print("Running in MOCKED GJS environment.");
    }

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

        if (!isShellNative) {
            // Mock global object for Shell environment (only if not native)
            Object.assign(globalThis, {
                global: {
                    get_current_time: () => Date.now(),
                    create_app_launch_context: () => ({
                        set_timestamp: () => { }
                    })
                }
            });
        }

        let canRunGtk = false;
        if (!isShellNative) {
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
        } else {
            print("Skipping GTK initialization in native shell environment.");
        }

        const replaceImports = (source) => {
            // ... (rest of replaceImports is fine as it's for non-native mode)
            return source;
        };
        // Skip mockify if native
        if (!isShellNative) {
            const replaceImportsReal = (source) => {
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
                    source = replaceImportsReal(source);
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
        }

        // Get absolute project root for native imports
        // Use injected value if available, fallback to GLib (risky)
        const projectRoot = typeof PROJECT_ROOT_INJECTED !== 'undefined' ? PROJECT_ROOT_INJECTED : GLib.get_current_dir();

        const runTestSuite = async (name, testModulePath, ...args) => {
            print(`\n--- Running ${name} ---`);
            try {
                let path = testModulePath;
                if (isShellNative) {
                    // Use absolute path for native shell to avoid resolution issues
                    path = `file://${projectRoot}/tests/${testModulePath.replace('./temp_', '').replace('./', '')}`;
                }
                const module = await import(path);
                await module.runTests(assert, ...args);
            } catch (e) {
                print(`  FAIL: ${name}: ${e}`);
                print(e.stack);
                failures++;
            }
        };

        // Determine base paths for main modules
        const getModulePath = (baseName) => {
            if (isShellNative) return `file://${projectRoot}/${baseName}.js`;
            return `./temp_${baseName.toLowerCase()}.js`;
        };

        try {
            // 1. Prefs Test
            if (canRunGtk) {
                print("\n--- Running Prefs Tests ---");
                try {
                    const module = await import(getModulePath('prefs'));
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
                const tempModule = await import(getModulePath('InboxScanner'));
                await runTestSuite('InboxScanner Tests', './temp_test_inbox_scanner.js', tempModule.InboxScanner);
            } catch (e) { failures++; print(`  FAIL: InboxScanner Load: ${e}`); }

            // 4. Conf
            try {
                const tempModule = await import(getModulePath('Conf'));
                await runTestSuite('Conf Tests', './temp_test_conf.js', tempModule.Conf);
            } catch (e) { failures++; print(`  FAIL: Conf Load: ${e}`); }

            // 5. NotificationFactory
            try {
                const tempModule = await import(getModulePath('NotificationFactory'));
                await runTestSuite('NotificationFactory Tests', './temp_test_notification_factory.js', tempModule.NotificationFactory, tempModule._unescapeXML);
            } catch (e) { failures++; print(`  FAIL: NotificationFactory Load: ${e}`); }

            // 6. EmailAccount
            try {
                const tempModule = await import(getModulePath('EmailAccount'));
                await runTestSuite('EmailAccount Tests', './temp_test_email_account.js', tempModule.EmailAccount);
            } catch (e) { failures++; print(`  FAIL: EmailAccount Load: ${e}`); }

            // 7. Notifier
            try {
                const tempModule = await import(getModulePath('Notifier'));
                await runTestSuite('Notifier Tests', './temp_test_notifier.js', tempModule.Notifier);
            } catch (e) { failures++; print(`  FAIL: Notifier Load: ${e}`); }

            print("\nTests complete.");
            if (failures > 0) {
                print(`FAILED with ${failures} error(s).`);
                if (!isShellNative) {
                    const system = (await import('system')).default;
                    system.exit(1);
                }
            } else if (!isShellNative) {
                const system = (await import('system')).default;
                system.exit(0);
            }
        } catch (err) {
            print("An unexpected error occurred during tests: " + err);
            print(err.stack);
            if (!isShellNative) {
                const system = (await import('system')).default;
                system.exit(1);
            }
        }
    }

    await run();
    if (isShellNative) {
        Meta.quit();
    }
})();
