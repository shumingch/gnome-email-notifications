/*
 * Copyright (c) 2012-2017 Gmail Message Tray contributors
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
const Main = imports.ui.main;
const Util = imports.misc.util;
const Lang = imports.lang;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const InboxScanner = Me.imports.InboxScanner.InboxScanner;
const MailClientFocuser = new Me.imports.MailClientFocuser.MailClientFocuser();
const Source = imports.ui.messageTray.Source;
const console = Me.imports.console.console;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;
const GmailConf = Me.imports.GmailConf;
const Gio = imports.gi.Gio;

const DIALOG_ERROR = 'dialog-error';
const MAIL_READ = 'mail-read';
const MAIL_UNREAD = 'mail-unread';
const MAIL_MARK_IMPORTANT = 'mail-mark-important';


const EmailAccount = new Lang.Class({
    Name: 'EmailAccount',
    _init: function (config, conn) {
        this.config = config;
        this._conn = conn;
        this._mailbox = this._conn.get_account().presentation_identity;
        if (this._mailbox === undefined) this._mailbox = '';
        this._scanner = new InboxScanner(conn, this.config);
        this.sources = [];
        this.errorSource = this._newErrorSource();
        this.summarySource = this._newSummarySource();
    },
    scanInbox: function () {
        try {
            this._scanner.scanInbox(Lang.bind(this, this._processData));
        } catch (err) {
            console.error(err);
            this.showError(err.message);
        }
    },
    _processData: function (err, folders) {
        if (err) {
            this.showError(err.message);
            throw err;
        }
        const content = folders[0].list;
        const inboxURL = folders[0].inboxURL;
        this.updateContent(content, inboxURL);
    },
    _newErrorSource: function () {
        return new Source(this._mailbox, DIALOG_ERROR);
    },
    _newSummarySource: function () {
        return new Source(MAIL_MARK_IMPORTANT, DIALOG_ERROR);
    },
    _createNotification: function (content, iconName, popUp, permanent, cb) {
        const source = new Source(this._mailbox, MAIL_READ);
        return this._createNotificationWithSource(source, content, iconName, popUp, permanent, cb);
    },
    _createNotificationWithSource: function (source, content, iconName, popUp, permanent, cb) {
        Main.messageTray.add(source);
        const notification = new GmailNotification(source, content, iconName);
        notification.connect('activated', () => {
            try {
                cb();
            } catch (err) {
                console.error(err);
            }
        });

        if (permanent) {
            notification.setResident(true);
        }
        if (popUp) {
            source.notify(notification);
        } else {
            notification.acknowledged = true;
            source.pushNotification(notification);
        }

        this.sources.push(source);
        return notification;
    },

    _showNoMessage: function (inboxURL) {
        if (!this.config.getNoMail()) {
            return;
        }
        this.summarySource.destroy();
        const content = {
            from: this._mailbox,
            date: new Date(),
            subject: _('No new messages')
        };
        const callback = () => {
            this._openEmail(inboxURL);
        };
        return this._createNotificationWithSource(this.summarySource, content, MAIL_READ, false, true, callback);
    },
    showError: function (error) {
        this.errorSource.destroy();
        this.errorSource = this._newErrorSource();
        const content = {
            from: error,
            date: new Date(),
            subject: this._mailbox
        };
        this._createNotificationWithSource(this.errorSource, content, DIALOG_ERROR, false, false, () => {
            this._openBrowser(Me.metadata["url"]);
        });
    },
    _createEmailSummary: function () {
        return {
            from: this._mailbox,
            date: new Date(),
            subject: _('%s unread messages').format(this.numUnread)
        };
    },
    _showEmailSummaryNotification: function (inboxURL) {
        if (this.config.getShowSummary() === GmailConf.SHOWSUMMARY_NO) {
            return
        }
        this.summarySource.destroy();
        const callback = () => {
            this._openEmail(inboxURL);
        };
        const summary = this._createEmailSummary();
        return this._createNotificationWithSource(this.summarySource, summary, MAIL_MARK_IMPORTANT, true, false, callback);
    },
    destroySources: function () {
        for (let source of this.sources) {
            source.destroy();
        }
    },
    _createEmailNotification: function (msg) {
        if (this.config.getShowSummary() === GmailConf.SHOWSUMMARY_YES) {
            return
        }
        this.summarySource.destroy();
        const callback = () => {
            this._openEmail(msg.link);
        };
        this._createNotification(msg, MAIL_UNREAD, true, false, callback);
    },
    _displayUnreadMessages: function (content) {
        let newMessages = 0;
        const messagesShown = new Set(this.config.getMessagesShown());
        for (let msg of content) {
            if (!messagesShown.has(msg.id)) {
                messagesShown.add(msg.id);
                newMessages++;
                this._createEmailNotification(msg);
            }
        }
        this.config.setMessagesShown([...messagesShown]);
        return newMessages;
    },
    _nonEmptySources: function () {
        return this.sources.filter(source => source.count > 0);
    },
    updateContent: function (content, inboxURL) {
        content.reverse();
        this.sources = this._nonEmptySources();
        this.numUnread = 0;

        if (content !== undefined) {
            this.numUnread = this._displayUnreadMessages(content);
            if (this.numUnread > 0) {
                this.summaryNotification = this._showEmailSummaryNotification(inboxURL);
            }
        }
        if (this.numUnread === 0) {
            if (this.sources.length === 0) {
                this.summaryNotification = this._showNoMessage(inboxURL);
            } else {
                if (this.summaryNotification) this.summaryNotification.update(this.summaryNotification.title, this.summaryNotification.bannerBodyText);
            }
        }
    },
    _openBrowser: function (link) {
        if (link === '' || link === undefined) {
            link = 'https://' + this._mailbox.match(/@(.*)/)[1];
        }
        const defaultBrowser = Gio.app_info_get_default_for_uri_scheme("http").get_executable();
        Util.trySpawnCommandLine(defaultBrowser + " " + link);
    },
    _openEmail: function (link) {
        if (this.config.getReader() === 0) {
            this._openBrowser(link);
        } else {
            MailClientFocuser.open();
        }
    }
});

