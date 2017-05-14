"use strict";
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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lang = imports.lang;
const console = Me.imports.console.console;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;
const GLib = imports.gi.GLib;

const GmailNotification = new Lang.Class({
    Name: 'GmailNotification',
    Extends: MessageTray.Notification,

    _init: function (source, content, iconName) {
        try {
            const title = content.subject;
            const unix_local = new Date(content.date).getTime() / 1000;
            const glib_datetime = GLib.DateTime.new_from_unix_local(unix_local);

            const Gio = imports.gi.Gio;
            let gicon=Gio.icon_new_for_string(iconName);
            const params = {
                datetime: glib_datetime,
                gicon
            };
           this.parent(source, title, content.from, params);
        }
        catch (err) {
            console.error(err);
        }
    }
});
