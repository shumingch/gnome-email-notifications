
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk?version=4.0';

try {
    const app = new Adw.Application({ application_id: 'test.app' });
    print("Successfully imported Adw and Gtk");
} catch (e) {
    print("Failed to use Adw/Gtk: " + e);
}
