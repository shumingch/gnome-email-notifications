
export class ExtensionPreferences {
    getPreferencesWidget() {
        return null;
    }

    fillPreferencesWindow(_window) {
        // Implement in subclass
    }
}

/**
 *
 * @param {string} str
 */
export function gettext(str) {
    return str;
}
