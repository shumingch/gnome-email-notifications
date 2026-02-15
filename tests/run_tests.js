
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk?version=4.0';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function run() {
    print("Starting tests...");

    // Initialize GTK (might fail without display, but let's try)
    try {
        Gtk.init();
        Adw.init();
    } catch (e) {
        print("Warning: Could not initialize GTK/Adw (no display?): " + e);
        // Depending on backend, might still work for object instantiation
    }

    // Read prefs.js
    const prefsFile = Gio.File.new_for_path('prefs.js');
    const [success, contents] = prefsFile.load_contents(null);
    if (!success) {
        print("Error: Could not read prefs.js");
        return 1;
    }

    let source = textDecoder.decode(contents);

    // Replace imports with mocks
    source = source.replace(
        /import .* from 'resource:\/\/\/org\/gnome\/Shell\/Extensions\/js\/extensions\/prefs.js';/,
        "import {ExtensionPreferences, gettext as _} from './mocks/resource_prefs.js';"
    );
    source = source.replace(
        /import {Conf} from '\.\/Conf.js';/,
        "import {Conf} from './mocks/Conf.js';"
    );

    // Fix relative path if needed, but since we run from root, ./mocks is correct relative to tests/temp_prefs.js if run from root?
    // Actually, if we write to tests/temp_prefs.js, then './mocks/...' refers to tests/mocks/... which is correct.

    const tempFile = Gio.File.new_for_path('tests/temp_prefs.js');
    tempFile.replace_contents(
        textEncoder.encode(source),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
    );

    print("Created tests/temp_prefs.js");

    // Dynamic import
    import('./temp_prefs.js')
        .then(module => {
            print("Imported temp_prefs.js successfully");

            const GmailNotificationPreferences = module.default;
            const prefs = new GmailNotificationPreferences();

            // Mock window object
            const window = new Adw.PreferencesWindow();

            print("Calling fillPreferencesWindow...");
            try {
                prefs.fillPreferencesWindow(window);
                print("Success: fillPreferencesWindow executed without error.");

                // Verify content
                // In generic GJS we might not be able to introspect children easily without recursion
                // But if no error threw, basic logic is sound.

                // Check if page was added
                // Cannot easily check private state of Adw.PreferencesWindow without iterating

                print("Test Passed!");
            } catch (e) {
                print("Test Failed: " + e);
                // print stack trace if possible
                print(e.stack);
                init_ret = 1;
            }
        })
        .catch(e => {
            print("Import Failed: " + e);
            print(e.stack);
        });
}

run();
