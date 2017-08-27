/*
 * Copyright (c) 2012-2017 Email Message Tray contributors
 *
 * Email Message Tray Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Email Message Tray Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */
"use strict";
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const Lang = imports.lang;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const Source = imports.ui.messageTray.Source;
const console = Me.imports.console.console;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;
const GmailConf = Me.imports.GmailConf;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;

const DIALOG_ERROR = 'dialog-error';
const MAIL_READ = 'mail-read';
const MAIL_UNREAD = 'mail-unread';
const MAIL_MARK_IMPORTANT = 'mail-mark-important';
/**
 * Controls a single Gnome Online Account
 * @type {Lang.Class}
 */
const Notifier = new Lang.Class({
    Name: 'Notifier',
    /**
     * Creates new notifier for an email account.
     * @param {EmailAccount} emailAccount
     * @private
     */
    _init: function (emailAccount) {
        this._config = emailAccount.config;
        this._mailbox = emailAccount.mailbox;
        this.sources = [];
        this._errorSource = this._newErrorSource();
        this._summarySource = this._newSummarySource();
    },
    /**
     * Creates a notification with the given source
     * @param {Source} source - the source used to create the notification
     * @param content - an object containing all information about the email
     * @param {string} iconName - the name of the icon that will display
     * @param {boolean} popUp - true if notification should display outside the message tray
     * @param {boolean} permanent - true if notification should not go away if you click on it
     * @param {function} cb - callback that runs when notification is clicked
     * @returns {GmailNotification} - the notification created
     * @private
     */
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
    /**
     * Creates a notification for a single unread email
     * @param msg - the information about the email
     * @private
     */
    _createEmailNotification: function (msg) {
        if (this._config.getShowSummary() === GmailConf.SHOWSUMMARY_YES) {
            return
        }
        this._summarySource.destroy();
        const callback = () => {
            this._openEmail(msg.link);
        };
        this._createNotification(msg, MAIL_UNREAD, true, false, callback);
    },
    /**
     * Destroys all sources for the email account
     */
    destroySources: function () {
        for (let source of this.sources) {
            source.destroy();
        }
    },
    /**
     * Creates a notification for each unread email
     * @param content - a list of unread emails
     * @returns {number} - number of unread emails
     */
    displayUnreadMessages: function (content) {
        let newMessages = 0;
        const messagesShown = new Set(this._config.getMessagesShown());
        for (let msg of content) {
            if (!messagesShown.has(msg.id)) {
                messagesShown.add(msg.id);
                newMessages++;
                this._createEmailNotification(msg);
            }
        }
        this._config.setMessagesShown([...messagesShown]);
        return newMessages;
    },
    /**
     * Creates a notification for an error
     * @param {string} error - the error to display
     */
    showError: function (error) {
        this._errorSource.destroy();
        this._errorSource = this._newErrorSource();
        const content = {
            from: error,
            date: new Date(),
            subject: this._mailbox
        };
        this._createNotificationWithSource(this._errorSource, content, DIALOG_ERROR, false, false, () => {
            this._openBrowser(Me.metadata["url"]);
        });
    },
    /**
     * Creates notification summarizing all unread emails
     * @param inboxURL - the URL to open when the notification is clicked
     * @param numUnread - the number of unread mail
     */
    showEmailSummaryNotification: function (inboxURL, numUnread) {
        if (this._config.getShowSummary() === GmailConf.SHOWSUMMARY_NO) {
            return
        }
        this._summarySource.destroy();
        this._summarySource = this._newSummarySource();
        const callback = () => {
            this._openEmail(inboxURL);
        };
        const summary = this._createEmailSummary(numUnread);
        this._createNotificationWithSource(this._summarySource, summary, MAIL_MARK_IMPORTANT, true, false, callback);
    },
    /**
     * Shows the "no messages" notification if the user sets this in the config
     * @param {string} inboxURL - the URL to open when the notification is clicked
     */
    showNoMessage: function (inboxURL) {
        if (!this._config.getNoMail()) {
            return;
        }
        this._summarySource.destroy();
        this._summarySource = this._newSummarySource();
        const content = {
            from: this._mailbox,
            date: new Date(),
            subject: _('No new messages')
        };
        const callback = () => {
            this._openEmail(inboxURL);
        };
        this._createNotificationWithSource(this._summarySource, content, MAIL_READ, false, true, callback);
    },
    /**
     * Removes all empty sources.
     */
    removeEmptySources: function () {
        this.sources = this.sources.filter(source => source.count > 0);
    },
    /**
     * Creates a new source with an error icon
     * @returns {Source} - the error source
     * @private
     */
    _newErrorSource: function () {
        return new Source(this._mailbox, DIALOG_ERROR);
    },
    /**
     * Create a new source with important icon
     * @returns {Source} - the summary source
     * @private
     */
    _newSummarySource: function () {
        return new Source(this._mailbox, MAIL_MARK_IMPORTANT);
    },
    /**
     * Creates a new notification with it's own source
     * @param content - an object containing all information about the email
     * @param {string} iconName - the name of the icon that will display
     * @param {boolean} popUp - true if notification should display outside the message tray
     * @param {boolean} permanent - true if notification should not go away if you click on it
     * @param {function} cb - callback that runs when notification is clicked
     * @returns {GmailNotification} - the notification created
     * @private
     */
    _createNotification: function (content, iconName, popUp, permanent, cb) {
        const source = new Source(this._mailbox, MAIL_READ);
        return this._createNotificationWithSource(source, content, iconName, popUp, permanent, cb);
    },
    /**
     * Creates an notification information for summary
     * @param {number} unread - number of unread messages
     * @returns {{from: string, date: Date, subject: string}}
     * @private
     */
    _createEmailSummary: function (unread) {
        return {
            from: this._mailbox,
            date: new Date(),
            subject: _('%d unread messages').format(unread)
        };
    },
    /**
     * Opens the default browser with the given link
     * @param {undefined | string} link - the URL to open
     * @private
     */
    _openBrowser: function (link) {
        if (link === '' || link === undefined) {
            link = 'https://' + this._mailbox.match(/@(.*)/)[1];
        }
        const defaultBrowser = Gio.app_info_get_default_for_uri_scheme("http").get_executable();
        Util.trySpawnCommandLine(defaultBrowser + " " + link);
    },
    /**
     * Opens email using either browser or email client
     * @param {undefined | string} link - the link to open
     * @private
     */
    _openEmail: function (link) {
        if (this._config.getReader() === 0) {
            this._openBrowser(link);
        } else {
            MailClientFocuser.open();
        }
    }
});
