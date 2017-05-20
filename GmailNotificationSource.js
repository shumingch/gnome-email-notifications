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
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;

const GmailNotificationSource = new Lang.Class({
    Name: 'GmailNotificationSource',
    Extends: MessageTray.Source,

    _init: function () {
        this.parent("Gmail Message Tray", "mail-read");
    },

    notify: function (notification) {
        this.parent(notification);
    }
});
