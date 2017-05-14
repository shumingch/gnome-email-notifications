/*
 * Copyright (c) 2012 Adam Jabłoński
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
const GConf = imports.gi.GConf;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const extension = Me.imports.extension;
const console = Me.imports.console.console;
const Lib = Me.imports.lib;
const Lang = imports.lang;

const GMAILNOTIFY_SETTINGS_KEY_TIMEOUT = 'timeout';
const GMAILNOTIFY_SETTINGS_KEY_BTEXT = 'btext';
const GMAILNOTIFY_SETTINGS_KEY_POSITION = 'position';
const GMAILNOTIFY_SETTINGS_KEY_NOTIFY = 'notify';
const GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY = 'showsummary';
const GMAILNOTIFY_SETTINGS_KEY_SAFEMODE = 'safemode';
const GMAILNOTIFY_SETTINGS_KEY_USEMAIL = 'usemail';

const GmailConf = new Lang.Class({
    Name: 'GmailConf',
    _init: function () {
        this.settings = Lib.getSettings(Me);
        this.settings.connect("change-event", ()=>{
            extension.stopTimeout();
            extension.startTimeout();
        });
        const Gio = extension.Gio;
        this._client = GConf.Client.get_default();
        try {
            this._browser = Gio.app_info_get_default_for_uri_scheme("http").get_executable();
        }
        catch (err) {
            this._browser = "firefox";
            console.error(err);
        }
        try {
            const mailto = Gio.app_info_get_default_for_uri_scheme("mailto");
            if (mailto === null) {
                this._mail = "";
            }
            else {
                this._mail = mailto.get_executable();
            }

        }
        catch (err) {
            console.error(err);
            this._mail = "";
        }

    },

    getTimeout(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_TIMEOUT);
    },
    getReader(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_USEMAIL);
    },
    getPosition(){
        return this.settings.get_string(GMAILNOTIFY_SETTINGS_KEY_POSITION);
    },
    getNumbers(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY);
    },
    getNotify(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_NOTIFY);
    },
    getSafeMode(){
        return this.settings.get_int(GMAILNOTIFY_SETTINGS_KEY_SAFEMODE);
    },
    getBText(){
        return this.settings.get_string(GMAILNOTIFY_SETTINGS_KEY_BTEXT);
    },
    set_int: function (key, val) {
        return this._client.set_int(key, val)
    },
    get_int: function (key) {
        return this._client.get_int(key)
    },
    set_string: function (key, val) {
        return this._client.set_string(key, val)
    },
    get_string: function (key) {
        return this._client.get_string(key)
    },
    _onNotify: function (client, object, p0) {
        return true;
    },
    _onDestroy: function (client, object, p0) {
        return true;
    },
    _onValueChanged: function (client, key, p0) {
        return true;
    },
    _disconnectSignals: function () {
        //this._client.notify_remove(this.np);
        //this._client.remove_dir(GCONF_DIR);
        //this._client.disconnect(this.pid);
        //settings.disconnect(sigid);
    }
});
