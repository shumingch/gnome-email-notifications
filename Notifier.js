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
const Lang = imports.lang;
const Source = imports.ui.messageTray.Source;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const MailClientFocuser = Me.imports.MailClientFocuser.MailClientFocuser;
const NotificationFactory = Me.imports.NotificationFactory.NotificationFactory;

/**
 * Controls notifications in message tray.
 * @class
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
        this._notificationFactory = new NotificationFactory(emailAccount);
        this._mailClientFocuser = new MailClientFocuser();
    },
    /**
     * Destroys all sources for the email account
     */
    destroySources: function () {
        this._notificationFactory.destroySources();
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
                const callback = () => {
                    this._openEmail(msg.link);
                };
                this._notificationFactory.createEmailNotification(msg, callback);
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
        this.removeErrors();
        const content = {
            from: error,
            date: new Date(),
            subject: this._mailbox
        };
        this._notificationFactory.createErrorNotification(content);
    },
    /**
     * Creates notification summarizing all unread emails
     * @param inboxURL - the URL to open when the notification is clicked
     * @param numUnread - the number of unread mail
     */
    showEmailSummaryNotification: function (inboxURL, numUnread) {
        if (this._config.getShowSummary() === this._config.SHOWSUMMARY_NO) {
            return
        }
        const cb = () => {
            this._openEmail(inboxURL);
        };
        const summary = this._createEmailSummary(numUnread);
        this._notificationFactory.createSummaryNotification(summary, cb);
    },
    /**
     * Shows the "no messages" notification if the user sets this in the config
     * @param {string} inboxURL - the URL to open when the notification is clicked
     */
    showNoMessage: function (inboxURL) {
        if (!this._config.getNoMail()) {
            return;
        }
        const content = {
            from: this._mailbox,
            date: new Date(),
            subject: _('No new messages')
        };
        const cb = () => {
            this._openEmail(inboxURL);
        };
        this._notificationFactory.createNoMailNotification(content, cb);
    },
    /**
     * Removes all errors currently displaying for this email account
     */
    removeErrors: function () {
        this._notificationFactory.removeErrors();
    },
    /**
     * Removes summary notification
     */
    removeSummary: function () {
        this._notificationFactory.removeSummary();
    },
    /**
     * Returns non-empty sources
     * @returns {Source[]} array of sources
     */
    getNonEmptySources: function () {
        return this._notificationFactory.getNonEmptySources();
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
            this._mailClientFocuser.open();
        }
    }
});
