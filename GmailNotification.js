/*
 * Copyright (c) 2012-2017 Email Message Tray contributors
 *
 * Email Message Tray is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Email Message Tray is distributed in the hope that it will be useful, but
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
const console = Me.imports.console.console;
const MessageTray = imports.ui.messageTray;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Config = imports.misc.config;

const escaped_one_to_xml_special_map = {
    '&amp;': '&',
    '&#39;': "'",
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>'
};
const unescape_regex = /(&quot;|&#39;|&lt;|&gt;|&amp;)/g;

/**
 * A single notification in the message tray.
 * @class
 */
const GmailNotification = new Lang.Class({
    Name: 'GmailNotification',
    Extends: MessageTray.Notification,
    /**
     * Creates a notification in the specified source
     * @param {Source} source - the source to create the notification in
     * @param content - information to display in notification
     * @param iconName - the name of the icon to display in the notification
     * @private
     */
    _init: function (source, content, iconName) {
        try {
            const date = new Date(content.date);
            const title = this._unescapeXML(content.subject);
            const gicon = new Gio.ThemedIcon({name: iconName});
            let banner = this._unescapeXML(content.from);
            const params = {
                gicon: gicon
            };

            if (Config.PACKAGE_VERSION.startsWith("3.22")) {
                banner = this._addDateTimeToBanner(date, banner);
            }
            else {
                this._addDateTimeToParams(date, params);
            }

            this.parent(source, title, banner, params);
        }
        catch (err) {
            console.error(err);
        }
    },
    /**
     * Unescapes special characters found in XML
     * @param {string} string - the string to unescape
     * @returns {string} - the unescaped string
     * @private
     */
    _unescapeXML: function (string) {
        if(string === null) return "";
        return string.replace(unescape_regex,
            (str, item) => escaped_one_to_xml_special_map[item]);
    },
    /**
     * Adds date and time to the banner
     * @param {Date} date - the date to format into a string
     * @param {string} banner - the string to prepend the date to
     * @returns {string} - the final string
     * @private
     */
    _addDateTimeToBanner: function (date, banner) {
        const locale_date = date.toLocaleFormat("%b %d %H:%M %p");
        return locale_date + " " + banner;
    },
    /**
     * Adds date and time to the params object as unix local time
     * @param {Date} date - the date  to add
     * @param params - parameters for creating a {@link MessageTray.Notification}
     * @private
     */
    _addDateTimeToParams: function (date, params) {
        const unix_local = date.getTime() / 1000;
        params.datetime = GLib.DateTime.new_from_unix_local(unix_local);
    }

});
