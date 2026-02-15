/*
 * Copyright (c) 2012-2017 Gnome Email Notifications contributors
 *
 * Gnome Email Notifications is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gnome Email Notifications is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Authors:
 * Adam Jabłoński <jablona123@gmail.com>
 * Shuming Chan <shuming0207@gmail.com>
 *
 */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/**
 * Controls configuration for extension.
 */
export class Conf {
    /**
     * Creates a new conf for an extension
     * @param {Extension} extension - the extension to control (optional)
     */
    constructor(extension) {
        this._extension = extension;
        this.settings = this._getSettings(extension);
        if (extension === undefined || extension === null) return;
        // Only set up timeout listeners if the extension has these methods
        // (true for main extension, false for preferences extension)
        if (typeof extension.stopTimeout === 'function' && typeof extension.startTimeout === 'function') {
            this.settings.connect("changed::timeout", () => {
                extension.stopTimeout();
                extension.startTimeout();
            });
        }
    }

    /**
     * Gets time between calls to email server.
     * @returns {number}
     */
    getTimeout() {
        return this.settings.get_int('timeout');
    }

    /**
     * Sets time between calls to email server.
     * @param {number} timeout
     */
    setTimeout(timeout) {
        this.settings.set_int('timeout', timeout);
    }

    /**
     * Returns 1 if we should use default email client instead of browser. 0 otherwise.
     * @returns {number}
     */
    getReader() {
        return this.settings.get_int('usemail');
    }

    /**
     * Sets 1 if we should use default email client instead of browser. 0 otherwise.
     * @param {number} reader
     */
    setReader(reader) {
        return this.settings.set_int('usemail', reader);
    }

    /**
     * Returns an array of ids of messages already shown
     * @returns {Array} array of ids
     */
    getMessagesShown() {
        const val = this.settings.get_value('messagesshown');
        return val.deep_unpack();
    }

    /**
     * Replaces the array of ids of messages already shown
     * @param {Array} array - array of ids
     */
    setMessagesShown(array) {
        const gVariant = new GLib.Variant('as', array);
        this.settings.set_value('messagesshown', gVariant);
    }

    /**
     * Returns the Gmail system label for the mailbox to read
     * @returns {string}
     */
    getGmailSystemLabel() {
        return this.settings.get_string('gmailsystemlabel');
    }

    /**
     * Sets the Gmail system label for the mailbox to read
     * @param {number} reader
     */
    setGmailSystemLabel(gmail_system_label) {
        return this.settings.set_string('gmailsystemlabel', gmail_system_label);
    }

    /**
     * Gets the settings from Gio.
     * @returns {Gio.Settings}
     */
    _getSettings(extension) {
        let schemaDir;
        
        // Try to get schema directory from extension object (works with both Extension and ExtensionPreferences)
        if (extension && extension.dir) {
            schemaDir = extension.dir.get_child('schemas').get_path();
        } else {
            // Fallback: try using imports.misc.extensionUtils if available
            try {
                const extUtils = imports.misc.extensionUtils;
                const ext = extUtils.getCurrentExtension();
                if (ext && ext.dir) {
                    schemaDir = ext.dir.get_child('schemas').get_path();
                }
            } catch (err) {
                schemaDir = null;
            }
        }
        
        let schemaName = 'org.gnome.shell.extensions.gmailmessagetray';
        
        if (schemaDir) {
            try {
                let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
                    Gio.SettingsSchemaSource.get_default(),
                    false);
                let schema = schemaSource.lookup(schemaName, false);
                
                if (schema) {
                    return new Gio.Settings({settings_schema: schema});
                }
            } catch (err) {
                console.log("Error loading schema from " + schemaDir + ": " + err);
            }
        }
        
        // Fallback to system schema if available (should not be needed if schema dir is found)
        try {
            return new Gio.Settings({schema_id: schemaName});
        } catch (err) {
            console.error("Failed to load settings schema: " + err);
            throw err;
        }
    }
};
