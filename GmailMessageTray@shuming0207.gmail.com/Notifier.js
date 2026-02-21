/*
 * Copyright (c) 2012-2017 Gnome Email Notifications contributors
 *
 * Gnome Email Notifications Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gnome Email Notifications Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */
import Gio from 'gi://Gio';
import {NotificationFactory} from './NotificationFactory.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Controls notifications in message tray.
 */
export class Notifier {
    /**
     * Creates new notifier for an email account.
     *
     * @param {EmailAccount} emailAccount
     */
    constructor(emailAccount) {
        this._config = emailAccount.config;
        this._mailbox = emailAccount.mailbox;
        this._notificationFactory = new NotificationFactory(emailAccount);
    }

    /**
     * Destroys all sources for the email account
     */
    destroySources() {
        this._notificationFactory.destroySources();
    }

    /**
     * Creates a notification for each unread email
     *
     * @param {Array} content - a list of unread emails
     */
    displayUnreadMessages(content) {
        const messagesShown = new Set(this._config.getMessagesShown());
        for (const msg of content) {
            if (!messagesShown.has(msg.id)) {
                messagesShown.add(msg.id);
                const _msg = msg; // need this because variables aren't scoped properly in Gnome Shell 3.24
                const callback = () => {
                    this._openEmail(_msg.link);
                };
                this._notificationFactory.createEmailNotification(msg, callback);
            }
        }
        this._config.setMessagesShown([...messagesShown]);
    }

    /**
     * Creates a notification for an error
     *
     * @param {Error} error - the error to display
     */
    showError(error) {
        const content = {
            from: error.message,
            date: new Date(),
            subject: this._mailbox,
        };
        const cb = () => {
            this._openBrowser('https://github.com/shumingch/gnome-email-notifications');
        };
        this._notificationFactory.createErrorNotification(content, cb);
    }

    /**
     * Removes all errors currently displaying for this email account
     */
    removeErrors() {
        this._notificationFactory.removeErrors();
    }

    /**
     * Opens the default browser with the given link
     *
     * @param {undefined | string} link - the URL to open
     * @private
     */
    _openBrowser(link) {
        if (!link)
            link = `https://${this._mailbox.match(/@(.*)/)[1]}`;

        const timestamp = global.get_current_time();
        const context = global.create_app_launch_context(timestamp, -1);
        Gio.AppInfo.launch_default_for_uri(link, context);
    }

    /**
     * Opens email using either browser or email client
     *
     * @param {undefined | string} link - the link to open
     * @private
     */
    _openEmail(link) {
        if (this._config.getReader() === 0)
            this._openBrowser(link);
        else
            this._openBrowser('mailto:');
    }
};
