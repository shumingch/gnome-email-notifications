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
const Util = imports.misc.util;
const Lang = imports.lang;
const _DEBUG = true;
const extension = Me.imports.extension;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const GmailNotificationSource = Me.imports.GmailNotificationSource.GmailNotificationSource;
const console = Me.imports.console.console;


const GmailMessageTray = new Lang.Class({
    Name: 'GmailMessageTray',
    _init: function () {
    },
    _notify: function (content, iconName, popUp) {
        const source = new GmailNotificationSource();
        Main.messageTray.add(source);
        const notification = new GmailNotification(source, content, iconName);
        notification.setResident(true);
        if (popUp) {
            source.notify(notification);
        } else {
            source.pushNotification(notification);
        }
    },
    _browseGn: function () {
        const config = extension.config;
        if (config._browser === "") {
            console.log("gmail notify: no default browser")
        }
        else {
            Util.trySpawnCommandLine(config._browser + " http://gn.makrodata.org");
        }
    },

    _showNoMessage: function (from) {
        try {
            const content = {
                from,
                date: new Date(),
                subject: _('No new messages')
            };
            this._notify(content, "mail-read", false);
        } catch (err) {
            console.error(err);
        }
    },
    _showError: function (err) {
        const subject = _(err);
        const content = {
            from: "",
            date: new Date(),
            subject
        };
        this._notify(content, "mail-mark-important", true);
    },
    _showUnread(mailbox, numMessages, numUnread){
        const notify_content = {
            from: mailbox,
            date: new Date(),
            subject: `${numMessages} messages (${numUnread} unread)`
        };
        this._notify(notify_content, "mail-mark-important", true);
    },
    setContent: function (content, mailbox, numMessages, numUnread) {
        mailbox = mailbox === undefined ? '' : mailbox;
        try {
            if (content !== undefined) {
                if (content.length > 0) {
                    for (let msg of content) {
                        this._notify(msg, "mail-unread", false);
                    }
                    this._showUnread(mailbox, numMessages, numUnread);
                }
                else {
                    this._showNoMessage(mailbox);
                }
            }
            else {
                this._showNoMessage(mailbox);
            }
            if (extension.nVersion > extension._version) {
                const content = {
                    from: "Gmail Message Tray",
                    date: new Date(),
                    subject: _('There is newer version of this extension: %s - click to download').format(extension.nVersion)
                };
                this._notify(content, "mail-mark-important", true);
            }

        } catch (err) {
            console.error(err);
        }
    }
});

