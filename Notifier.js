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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import { NotificationFactory } from './NotificationFactory.js';
import { Console } from './console.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Controls notifications in message tray.
 */
export class Notifier {
    /**
     * Creates new notifier for an email account.
     * @param {EmailAccount} emailAccount
     */
    constructor(emailAccount) {
        this._config = emailAccount.config;
        this._mailbox = emailAccount.mailbox;
        this._notificationFactory = new NotificationFactory(emailAccount);

        // Get extension metadata from the injected config object
        this._extensionMetadata = { url: 'https://github.com/shumingch/gnome-email-notifications' };
        if (this._config && this._config._extension) {
            this._extensionMetadata = this._config._extension.metadata;
        }
        this._console = new Console();
    }

    /**
     * Destroys all sources for the email account
     */
    destroySources() {
        this._notificationFactory.destroySources();
    }

    /**
     * Creates a notification for each unread email
     * @param content - a list of unread emails
     */
    displayUnreadMessages(content) {
        const messagesShown = new Set(this._config.getMessagesShown());
        for (let msg of content) {
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
     * @param {Error} error - the error to display
     */
    showError(error) {
        const content = {
            from: error.message,
            date: new Date(),
            subject: this._mailbox
        };
        const cb = () => {
            this._openBrowser(this._extensionMetadata["url"]);
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
     * @param {undefined | string} link - the URL to open
     * @private
     */
    _openBrowser(link) {
        if (!link) {
            link = 'https://' + this._mailbox.match(/@(.*)/)[1];
        }

        this._console.log("Opening URI: " + link);

        const timestamp = global.get_current_time();
        const context = global.create_app_launch_context(timestamp, -1);

        try {
            // Standard GNOME way to open a URI with focus context
            Gio.AppInfo.launch_default_for_uri(link, context);
            this._console.log("Successfully launched using launch_default_for_uri");
        } catch (e) {
            this._console.log("launch_default_for_uri failed: " + e.message);
            try {
                // Fallback 1: Get default app for https and launch uris
                const appInfo = Gio.AppInfo.get_default_for_uri_scheme("https");
                if (appInfo) {
                    appInfo.launch_uris([link], context);
                    this._console.log("Successfully launched using launch_uris");
                } else {
                    throw new Error("No default app found for https");
                }
            } catch (e2) {
                this._console.log("launch_uris failed: " + e2.message);
                // Fallback 2: xdg-open (no focus context, but reliable)
                // Use shell_quote for safety
                Util.trySpawnCommandLine(`xdg-open ${GLib.shell_quote(link)}`);
            }
        }
    }

    /**
     * Opens email using either browser or email client
     * @param {undefined | string} link - the link to open
     * @private
     */
    _openEmail(link) {
        if (this._config.getReader() === 0) {
            this._openBrowser(link);
        } else {
            this._openBrowser('mailto:');
        }
    }
};
