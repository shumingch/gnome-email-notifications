/*
 * Copyright (c) 2012-2017 Gmail Message Tray contributors
 *
 * Gmail Notify Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Notify Extension is distributed in the hope that it will be useful, but
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

const GMAILNOTIFY_SETTINGS_KEY_TIMEOUT = 'timeout';
const GMAILNOTIFY_SETTINGS_KEY_USEMAIL = 'usemail';
const GMAILNOTIFY_SETTINGS_KEY_SHOWNOMAIL = 'shownomail';

const GmailConf = new Lang.Class({
    Name: 'GmailConf',
    _init: function (extension) {
        this.settings = getSettings(Me);
        this.settings.connect("change-event", () => {
            extension.stopTimeout();
            extension.startTimeout();
        });
    },

    getTimeout: function(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_TIMEOUT);
    },
    getReader: function(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_USEMAIL);
    },
    getNoMail: function(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_SHOWNOMAIL);
    }
});
const getSettings = function () {
    let schemaName = 'org.gnome.shell.extensions.gmailmessagetray';
    let schemaDir = Me.dir.get_child('schemas').get_path();

    let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
        Gio.SettingsSchemaSource.get_default(),
        false);
    let schema = schemaSource.lookup(schemaName, false);

    return new Gio.Settings({settings_schema: schema});
};
