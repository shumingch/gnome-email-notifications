
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import system from 'system';

// Simple D-Bus proxy for the Shell
const ShellProxy = Gio.DBusProxy.makeProxyWrapper(
    '<node> \
        <interface name="org.gnome.Shell"> \
            <method name="Eval"> \
                <arg type="s" direction="in" name="script"/> \
                <arg type="b" direction="out" name="success"/> \
                <arg type="s" direction="out" name="result"/> \
            </method> \
        </interface> \
    </node>'
);

async function main() {
    if (ARGV.length < 1) {
        console.error("Usage: gjs send_eval.js <filename>");
        system.exit(1);
    }

    const filename = ARGV[0];
    const file = Gio.File.new_for_path(filename);
    const [success, contents] = file.load_contents(null);
    if (!success) {
        console.error(`Could not read file: ${filename}`);
        system.exit(1);
    }

    const scriptContent = new TextDecoder().decode(contents);
    const projectRoot = GLib.get_current_dir();
    const script = `const PROJECT_ROOT_INJECTED = "${projectRoot}";\n${scriptContent}`;

    const proxy = new ShellProxy(
        Gio.DBus.session,
        'org.gnome.Shell',
        '/org/gnome/Shell'
    );

    try {
        console.log(`Calling Eval with script from ${filename}...`);
        const [evalSuccess, result] = await new Promise((resolve, reject) => {
            proxy.EvalRemote(script, (res, error) => {
                if (error) reject(error);
                else resolve(res);
            });
        });

        console.log(`Eval Success: ${evalSuccess}`);
        console.log(`Eval Result: ${result}`);

        if (!evalSuccess) {
            system.exit(1);
        }
    } catch (e) {
        console.error(`Error calling Eval: ${e}`);
        system.exit(1);
    }
}

main();
