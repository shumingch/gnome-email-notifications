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
const Util = imports.misc.util; const Lang = imports.lang;
const extension = Me.imports.extension;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const GmailNotificationSource = Me.imports.GmailNotificationSource.GmailNotificationSource;
const MessageTray = imports.ui.messageTray;
const console = Me.imports.console.console;


const GmailMessageTray = new Lang.Class({
    Name: 'GmailMessageTray',
    _init: function () {
        this.numUnread = 0;
        this.emailSummaryNotification = null;
        this.config = extension.config;
        this.sources = [];
    },
    _createNotification: function (content, iconName, popUp, permanent) {
        const source = new GmailNotificationSource();
        Main.messageTray.add(source);
        const notification = new GmailNotification(source, content, iconName);
        notification.connect('activated', () => {
            const messageTray = Main.panel.statusArea.dateMenu.menu;
            if (notification === this.emailSummaryNotification) {
                if (messageTray.isOpen) {
                    this._openEmail("");
                    messageTray.close();
                }
                messageTray.open();
            } else if (this.emailSummaryNotification) {
                this.numUnread--;
                const emailSummary = this._createEmailSummary(this.mailbox);
                this.emailSummaryNotification.update(emailSummary.subject, emailSummary.from);
                this._openEmail(content.link);
                messageTray.close();
            }
            else {
                this._openEmail("");
                messageTray.close();
            }
        });
        if (permanent) {
            notification.setResident(true);
        }
        if (popUp) {
            notification.setUrgency(MessageTray.Urgency.HIGH);
            source.notify(notification);
        } else {
            source.pushNotification(notification);
        }
        this.sources.push(source);
        return notification;
    },
    _browseGn: function () {
        if (this.config._browser === "") {
            console.log("gmail notify: no default browser")
        }
        else {
            Util.trySpawnCommandLine(this.config._browser + " http://gn.makrodata.org");
        }
    },

    _showNoMessage: function () {
        try {
            const content = {
                from: this.mailbox,
                date: new Date(),
                subject: _('No new messages')
            };
            this._createNotification(content, "mail-read", false, true);
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
        this._createNotification(content, "mail-mark-important", true, true);
    },
    _createEmailSummary(){
        return {
            from: this.mailbox,
            date: new Date(),
            subject: _('%s unread messages').format(this.numUnread)
        };
    },
    _showEmailSummaryNotification(popUp){
        return this._createNotification(this._createEmailSummary(), "mail-mark-important", popUp, true);
    },
    destroySources(){
        for (let source of this.sources) {
            source.destroy();
        }
    },
    _checkVersion(){
        if (extension.nVersion > extension._version) {
            const content = {
                from: "Gmail Message Tray",
                date: new Date(),
                subject: _('There is newer version of this extension: %s - click to download').format(extension.nVersion)
            };
            this._createNotification(content, "mail-mark-important", true, true);
        }
    },
    updateContent: function (content, numUnread, mailbox) {
        const popUp = numUnread > this.numUnread;
        this.numUnread = numUnread;
        this.mailbox = mailbox;

        this.destroySources();
        if (content !== undefined) {
            if (content.length > 0) {
                for (let msg of content) {
                    this._createNotification(msg, "mail-unread", false, false);
                }
                this.emailSummaryNotification = this._showEmailSummaryNotification(popUp);
            }
            else {
                this._showNoMessage();
            }
        }
        else {
            this._showNoMessage();
        }
        this._checkVersion();
    },
    _openBrowser: function (link) {
        if (this.config._browser === "") {
            console.log("no default browser")
        }
        else {
            console.log("link: " + link);
            if (link === '' || link === undefined) {
                link = 'https://www.gmail.com';
            }
            Util.trySpawnCommandLine(`${this.config._browser} ${link}`);
        }
    },
    _openEmail: function (link) {
        if (this.config.getReader() === 0) {
            this._openBrowser(link);
        } else {
            if (this.config._mail === "") {
                console.log("no default mail reader")
            }
            else {
                Util.trySpawnCommandLine(this.config._mail);
            }
        }

    }
});

