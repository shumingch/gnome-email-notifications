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
const InboxScanner = Me.imports.InboxScanner.InboxScanner;
const Notifier = Me.imports.Notifier.Notifier;
const console = Me.imports.console.console;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;


/**
 * Controls a single Gnome Online Account
 * @class
 */
const EmailAccount = new Lang.Class({
    Name: 'EmailAccount',
    /**
     * Creates a new EmailAccount with a Gnome Online Account
     * @param {GmailConf} config
     * @param account - the Gnome Online Account
     * @private
     */
    _init: function (config, account) {
        this.config = config;
        this.mailbox = account.get_account().presentation_identity;
        if (this.mailbox === undefined) this.mailbox = '';
        this._scanner = new InboxScanner(account, this.config);
        this._notifier = new Notifier(this);
    },
    /**
     * Creates a notification for an error and logs it to the console
     * @param {Error} error - the error to display
     */
    _showError: function (error) {
        console.error(error);
        this._notifier.showError(error);
    },
    /**
     * Scans the current account for emails
     */
    scanInbox: function () {
        try {
            this._notifier.removeErrors();
            this._scanner.scanInbox(Lang.bind(this, this._processData));
        } catch (err) {
            this._showError(err);
        }
    },
    /**
     * Displays error or emails to message tray.
     * @param {Error} err - the error to display
     * @param folders - a list of folders which contain unread emails
     * @private
     */
    _processData: function (err, folders) {
        if (err) {
            this._showError(err);
        } else {
            try {
                const content = folders[0].list;
                this.updateContent(content);
            } catch (err) {
                this._showError(err);
            }
        }
    },
    /**
     * Displays notifications for unread emails
     * @param content - a list of unread emails
     */
    updateContent: function (content) {
        content.reverse();
        if (content !== undefined) {
            this._notifier.displayUnreadMessages(content);
        }
    },
    /**
     * Destroys all sources for the email account
     */
    destroySources: function () {
        this._notifier.destroySources();
    }
});

