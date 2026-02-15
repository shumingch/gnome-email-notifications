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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MsgTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Console } from './console.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

// Helper function to unescape XML in notification content
function _unescapeXML(xmlString) {
    if (xmlString === null) return "";
    const escaped_one_to_xml_special_map = {
        '&amp;': '&',
        '&#39;': "'",
        '&quot;': '"',
        '&lt;': '<',
        '&gt;': '>'
    };
    const unescape_regex = /(&quot;|&#39;|&lt;|&gt;|&amp;)/g;
    return xmlString.replace(unescape_regex,
        (str, item) => escaped_one_to_xml_special_map[item]);
}

/**
 * Creates and displays notifications.
 */
export class NotificationFactory {

    /**
     * Creates new notifier for an email account.
     * @param {EmailAccount} emailAccount
     */
    constructor(emailAccount) {
        this._mailbox = emailAccount.mailbox;
        this.sources = new Set();
        this._addedToTray = new Set();
        this._emailSource = new MsgTray.Source({ title: this._mailbox });
        this.sources.add(this._emailSource);
        this._errorSource = this._newErrorSource();
        this._console = new Console();
        this._isDestroyed = false;
    }

    /**
     * Creates a notification for a single unread email
     * @param msg - the information about the email
     * @param {function} cb - callback that runs when notification is clicked
     */
    createEmailNotification(msg, cb) {
        if (this._isDestroyed) return;
        this._createNotificationWithSource(this._emailSource, msg, 'mail-unread', true, false, cb);
    }

    /**
     * Creates a notification for an error
     * @param content - the information about the error
     * @param {function} cb - callback that runs when notification is clicked
     */
    createErrorNotification(content, cb) {
        if (this._isDestroyed) return;
        this._createNotificationWithSource(this._errorSource, content, 'dialog-error', false, false, cb);
    }

    /**
     * Destroys all sources for the email account
     */
    destroySources() {
        this._isDestroyed = true;
        for (let source of [...this.sources]) {
            source.destroy();
        }
        this.sources.clear();
        this._addedToTray.clear();
    }

    /**
     * Removes all errors currently displaying for this email account
     */
    removeErrors() {
        if (this._isDestroyed) return;

        // If _errorSource is not null, it means it hasn't been destroyed yet
        // (thanks to the signal handler in _newErrorSource)
        if (this._errorSource) {
            this._errorSource.destroy();
            this._errorSource = null;
        }

        this._errorSource = this._newErrorSource();
    }

    /**
     * Creates a new source with an error icon
     * @returns {Source} - the error source
     * @private
     */
    _newErrorSource() {
        if (this._isDestroyed) return null;
        const source = new MsgTray.Source({ title: this._mailbox });

        // Connect to destroy signal to clean up references if destroyed by Shell
        source.connect('destroy', () => {
            this.sources.delete(source);
            this._addedToTray.delete(source);
            if (this._errorSource === source) {
                this._errorSource = null;
            }
        });

        this.sources.add(source);
        return source;
    }

    /**
     * Creates a notification with the given source
     * @param {Source} source - the source used to create the notification
     * @param content - an object containing all information about the email
     * @param {string} iconName - the name of the icon that will display
     * @param {boolean} popUp - true if notification should display outside the message tray
     * @param {boolean} permanent - true if notification should not go away if you click on it
     * @param {function} cb - callback that runs when notification is clicked
     * @returns {Notification} - the notification created
     * @private
     */
    _createNotificationWithSource(source, content, iconName, popUp, permanent, cb) {
        if (this._isDestroyed || !source) return null;

        if (!this._addedToTray.has(source)) {
            Main.messageTray.add(source);
            this._addedToTray.add(source);
        }

        try {
            // Prepare content data
            const date = new Date(content.date);
            const title = _unescapeXML(content.subject);
            const banner = _unescapeXML(content.from);

            // Create a notification with source, title, and banner using property map
            const notification = new MsgTray.Notification({
                source: source,
                title: title,
                body: banner
            });

            // Set optional properties
            if (iconName) {
                const gicon = new Gio.ThemedIcon({ name: iconName });
                notification.gicon = gicon;
            }

            if (date) {
                const unix_local = date.getTime() / 1000;
                notification.datetime = GLib.DateTime.new_from_unix_local(unix_local);
            }

            if (permanent) {
                notification.setResident(true);
            }

            // Connect signals
            notification.connect('activated', () => {
                try {
                    cb();
                } catch (err) {
                    this._console.error(err);
                }
            });

            notification.connect('destroy', (destroyed_notification) => {
                // Remove from our source tracking
                if (!this._isDestroyed && source === this._errorSource) {
                    // Error source - just track it
                    this.sources.delete(source);
                }
            });

            // Add notification to source using the proper method
            if (source.addNotification) {
                source.addNotification(notification);
            } else if (source.pushNotification) {
                source.pushNotification(notification);
            } else if (source.showNotification) {
                source.showNotification(notification);
            }

            return notification;
        } catch (err) {
            this._console.error("Error creating notification:", err);
            throw err;
        }
    }
};
