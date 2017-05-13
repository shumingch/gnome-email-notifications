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
const extension = Me.imports.extension;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;
const console = Me.imports.console.console;

function GmailNotificationSource() {
    this._init();
}

GmailNotificationSource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function () {
        try {
            MessageTray.Source.prototype._init.call(this, _("New gmail message"), "mail-unread");
            this._nbNotifications = 0;
        }
        catch (err) {
            console.error(err);
        }
    },

    notify: function (notification) {
        try {
            MessageTray.Source.prototype.notify.call(this, notification);
            this._nbNotifications += 1;
            // Display the source while there is at least one notification
            // notification.connect('destroy', () => {
            //     this._nbNotifications -= 1;
            //     if (this._nbNotifications === 0)
            //         this.destroy();
            // });
        }
        catch (err) {
            console.error(err);
        }
    }
};
