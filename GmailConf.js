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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;


/**
 * Controls configuration for extension.
 * @class
 */
const GmailConf = new Lang.Class({
    Name: 'GmailConf',
    GMAILNOTIFY_SETTINGS_KEY_TIMEOUT: 'timeout',
    GMAILNOTIFY_SETTINGS_KEY_USEMAIL: 'usemail',
    GMAILNOTIFY_SETTINGS_KEY_MESSAGESSHOWN: 'messagesshown',
    GMAILNOTIFY_SETTINGS_KEY_GMAILACCOUNTNUMBER: 'gmailaccountnumber',
    SHOWSUMMARY_YES: 'yes',
    SHOWSUMMARY_NO: 'no',
    MESSAGES_SHOWN_TYPE: 'as',
    /**
     * Creates a new conf for an extension
     * @param {Extension} extension - the extension to control
     * @private
     */
    _init: function (extension) {
        if (extension === undefined) return;
        this.settings = this.getSettings();
        this.settings.connect("changed::timeout", () => {
            extension.stopTimeout();
            extension.startTimeout();
        });
    },

    getTimeout: function () {
        return this.settings.get_int(this.GMAILNOTIFY_SETTINGS_KEY_TIMEOUT);
    },
    getReader: function () {
        return this.settings.get_int(this.GMAILNOTIFY_SETTINGS_KEY_USEMAIL);
    },
    /**
     * Returns an array of ids of messages already shown
     * @returns {Array} array of ids
     */
    getMessagesShown: function () {
        const val = this.settings.get_value(this.GMAILNOTIFY_SETTINGS_KEY_MESSAGESSHOWN, this.MESSAGES_SHOWN_TYPE);
        return val.deep_unpack();
    },
    /**
     * Replaces the array of ids of messages already shown
     * @param {Array} array - array of ids
     */
    setMessagesShown: function (array) {
        const gVariant = new GLib.Variant(this.MESSAGES_SHOWN_TYPE, array);
        this.settings.set_value(this.GMAILNOTIFY_SETTINGS_KEY_MESSAGESSHOWN, gVariant, this.MESSAGES_SHOWN_TYPE);
    },
    getGmailAccountNumber: function () {
        return this.settings.get_int(this.GMAILNOTIFY_SETTINGS_KEY_GMAILACCOUNTNUMBER);
    },
    /**
     * Gets the settings from Gio.
     * @returns {Gio.Settings}
     */
    getSettings: function () {
        let schemaName = 'org.gnome.shell.extensions.gmailmessagetray';
        let schemaDir = Me.dir.get_child('schemas').get_path();

        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
            Gio.SettingsSchemaSource.get_default(),
            false);
        let schema = schemaSource.lookup(schemaName, false);

        return new Gio.Settings({settings_schema: schema});
    }
});
