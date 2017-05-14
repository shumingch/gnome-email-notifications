/*
 * Copyright (c) 2012 Adam Jabłoński
 *
 * Gmail Message Tray Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Message Tray Extension is distributed in the hope that it will be useful, but
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
const St = imports.gi.St;
const Main = imports.ui.main;
const Utils = imports.misc.util;
const _DEBUG = true;
const extension = Me.imports.extension;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const GmailNotificationSource = Me.imports.GmailNotificationSource.GmailNotificationSource;
const console = Me.imports.console.console;

function GmailMessageTray(extensionPath) {
    this._init(extensionPath);
}

GmailMessageTray.prototype = {
    _init: function () {
        this.source = new GmailNotificationSource();
        Main.messageTray.add(this.source);
    },
    _notify: function(from, date, subject, iconName){
        const content = {
            from,
            date,
            subject
        };
        const notification = new GmailNotification(this.source, content, iconName);
        notification.setResident(true);
        this.source.pushNotification(notification);
    },
    _browseGn: function () {
        const config = extension.config;
        if (config._browser === "") {
            console.log("gmail notify: no default browser")
        }
        else {
            Utils.trySpawnCommandLine(config._browser + " http://gn.makrodata.org");
        }
    },

    _showNoMessage: function (from) {
        try {
            const date = new Date();
            const subject = _('No new messages');
            this._notify(from, date, subject, "mail-read");
        } catch (err) {
            console.error(err);
        }
    },
    _showError: function (err) {
        const subject = _(err);
        this._notify("", new Date(), subject, "mail-mark-important");
    }
};

GmailMessageTray.prototype.setContent = function (content, mailbox, numMessages, numUnread) {
    console.log("SET CONTENT");
    mailbox = mailbox === undefined ? '' : mailbox;
    try {
        if (content !== undefined) {
            if (content.length > 0) {
                for (let msg of content) {
                    this._notify(msg.from, msg.date, msg.subject, "mail-unread");
                    console.json(msg);
                }
            }
            else {
                this._showNoMessage(mailbox);
            }
            const subject = `${numMessages} messages (${numUnread} unread)`;
            this._notify(mailbox, new Date(), subject, "network-server");
        }
        else {
            this._showNoMessage(mailbox);
        }
        if (extension.nVersion > extension._version) {
            const from = "Gmail Notify";
            const subject = _('There is newer version of this extension: %s - click to download').format(extension.nVersion);
            this._notify(from, new Date(), subject, "mail-mark-important");
        }

    } catch (err) {
        console.error(err);
    }
};
