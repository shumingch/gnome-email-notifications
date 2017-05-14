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
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const GmailNotificationSource = Me.imports.GmailNotificationSource.GmailNotificationSource;
const console = Me.imports.console.console;


const GmailMessageTray = new Lang.Class({
    Name: 'GmailMessageTray',
    _init: function (extension) {
        this.numUnread = 0;
        this.emailSummaryNotification = null;
        this.extension = extension;
        this.config = extension.config;
        this.sources = [];
        this.messageTray = Main.panel.statusArea.dateMenu.menu;
    },
    _createNotification: function (content, iconName, popUp, permanent, cb) {
        const source = new GmailNotificationSource();
        Main.messageTray.add(source);
        const notification = new GmailNotification(source, content, iconName);
        notification.connect('activated', cb);

        if (permanent) {
            notification.setResident(true);
        }
        if (popUp) {
            source.notify(notification);
        } else {
            source.pushNotification(notification);
        }

        this.sources.push(source);
        return notification;
    },

    _showNoMessage: function () {
        const content = {
            from: this.mailbox,
            date: new Date(),
            subject: _('No new messages')
        };
        const callback = ()=>{
            this._openEmail("");
            this.messageTray.close();
        };
        this._createNotification(content, "mail-read", false, true, callback);
    },
    showLibError: function () {
        const content = {
            from: "",
            date: new Date(),
            subject: _('Extension requires Goa,Soup,Gio,Gconf typelibs - click for instructions how to install')
        };
        const callback = ()=>{
            this._openEmail("http://gn.makrodata.org");
        };
        this._createNotification(content, "mail-mark-important", true, true, callback);
    },
    _createEmailSummary(){
        return {
            from: this.mailbox,
            date: new Date(),
            subject: _('%s unread messages').format(this.numUnread)
        };
    },
    _showEmailSummaryNotification(popUp){
        const callback = () => {
            if (this.messageTray.isOpen) {
                this._openEmail("");
                this.messageTray.close();
            }
            this.messageTray.open();
        };
        const summary = this._createEmailSummary();
        return this._createNotification(summary, "mail-mark-important", popUp, true, callback);
    },
    destroySources(){
        for (let source of this.sources) {
            source.destroy();
        }
    },
    _createEMailNotification(msg){
        const callback = ()=>{
            this.numUnread--;
            const emailSummary = this._createEmailSummary(this.mailbox);
            this.emailSummaryNotification.update(emailSummary.subject, emailSummary.from);
            this._openEmail(msg.link);
            this.messageTray.close();
        };
        this._createNotification(msg, "mail-unread", false, false, callback);
    },
    updateContent: function (content, numUnread, mailbox) {
        const popUp = numUnread > this.numUnread;
        this.numUnread = numUnread;
        this.mailbox = mailbox;

        this.destroySources();
        if (content !== undefined) {
            if (content.length > 0) {
                for (let msg of content) {
                    this._createEMailNotification(msg)
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

