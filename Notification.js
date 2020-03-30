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
const console = Me.imports.console.console;
const MessageTray = imports.ui.messageTray;
const {Gio, GLib, GObject} = imports.gi;

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
 * @class Notification
 */
var Notification = GObject.registerClass(
    class extends MessageTray.Notification {
    /**
     * Creates a notification in the specified source
     * @param {Source} source - the source to create the notification in
     * @param content - information to display in notification
     * @param iconName - the name of the icon to display in the notification
     */
    _init(source, content, iconName) {
        try {
            const date = new Date(content.date);
            const title = Notification._unescapeXML(content.subject);
            const gicon = new Gio.ThemedIcon({name: iconName});
            let banner = Notification._unescapeXML(content.from);
            const params = {
                gicon: gicon
            };

            Notification._addDateTimeToParams(date, params);
            
            super._init(source, title, banner, params);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Unescapes special characters found in XML
     * @param {?string} xmlString - the string to unescape
     * @returns {string} - the unescaped string
     * @private
     */
    static _unescapeXML(xmlString) {
        if (xmlString === null) return "";
        return xmlString.replace(unescape_regex,
            (str, item) => escaped_one_to_xml_special_map[item]);
    }

    /**
     * Adds date and time to the params object as unix local time
     * @param {Date} date - the date  to add
     * @param params - parameters for creating a {@link MessageTray.Notification}
     * @private
     */
    static _addDateTimeToParams(date, params) {
        const unix_local = date.getTime() / 1000;
        params.datetime = GLib.DateTime.new_from_unix_local(unix_local);
    }

});
