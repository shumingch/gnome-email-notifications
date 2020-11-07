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
"use strict";
const Gettext = imports.gettext;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const {Gio, GLib} = imports.gi;

/**
 * Controls configuration for extension.
 */
var Conf = class {
    /**
     * Creates a new conf for an extension
     * @param {Extension} extension - the extension to control
     */
    constructor(extension) {

        this.settings = Conf.getSettings();
        if (extension === undefined) return;
        this.settings.connect("changed::timeout", () => {
            extension.stopTimeout();
            extension.startTimeout();
        });
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
    static getSettings() {
        let schemaName = 'org.gnome.shell.extensions.gmailmessagetray';
        let schemaDir = Me.dir.get_child('schemas').get_path();

        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
            Gio.SettingsSchemaSource.get_default(),
            false);
        let schema = schemaSource.lookup(schemaName, false);

        return new Gio.Settings({settings_schema: schema});
    }

    /**
     * Sets up translations from locale directory.
     */
    static setupTranslations() {
        const localeDir = Me.dir.get_child('locale').get_path();
        Gettext.bindtextdomain('gmail_notify', localeDir);
    }
};
