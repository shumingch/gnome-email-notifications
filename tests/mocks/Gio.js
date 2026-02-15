
export const Settings = class {
    constructor(params) {
        this.store = new Map();
        // Default values
        this.store.set('timeout', 60);
        this.store.set('usemail', 0);
        this.store.set('messagesshown', []);
        this.store.set('gmailsystemlabel', '^i');
    }

    get_int(key) { return this.store.get(key); }
    set_int(key, val) { this.store.set(key, val); return true; }

    get_string(key) { return this.store.get(key); }
    set_string(key, val) { this.store.set(key, val); return true; }

    get_value(key) {
        const val = this.store.get(key);
        return {
            deep_unpack: () => val
        };
    }
    set_value(key, variant) {
        // Mock GLib.Variant by just taking the value if it's a mock variant or the object itself
        this.store.set(key, variant.value || variant);
    }

    connect() { }
};

export const SettingsSchemaSource = {
    get_default: () => ({}),
    new_from_directory: () => ({
        lookup: () => ({})
    })
};

export const ThemedIcon = class {
    constructor(params) {
        this.name = params.name;
    }
};

export default {
    Settings,
    SettingsSchemaSource,
    ThemedIcon
};
