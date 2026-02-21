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
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Helper function to unescape XML in notification content
/**
 * Unescape common XML entities in strings.
 *
 * @param {string} xmlString
 * @returns {string}
 */
export function _unescapeXML(xmlString) {
    if (xmlString === null)
        return '';
    const escapedOneToXmlSpecialMap = {
        '&amp;': '&',
        '&#39;': "'",
        '&quot;': '"',
        '&lt;': '<',
        '&gt;': '>',
    };
    const unescapeRegex = /(&quot;|&#39;|&lt;|&gt;|&amp;)/g;
    return xmlString.replace(unescapeRegex,
        (str, item) => escapedOneToXmlSpecialMap[item]);
}

/**
 * Creates and displays notifications.
 */
export class NotificationFactory {
    /**
     * Creates new notifier for an email account.
     *
     * @param {EmailAccount} emailAccount
     */
    constructor(emailAccount) {
        this._mailbox = emailAccount.mailbox;
        this._prefix = '[Gnome Email Notifications] ';
        this.sources = new Set();
        this._addedToTray = new Set();
        this._emailSource = this._newEmailSource();
        this._errorSource = this._newErrorSource();
    }

    /**
     * Creates a notification for a single unread email
     *
     * @param {object} msg - the information about the email
     * @param {Function} cb - callback that runs when notification is clicked
     */
    createEmailNotification(msg, cb) {
        if (!this._emailSource)
            this._emailSource = this._newEmailSource();
        this._createNotificationWithSource(this._emailSource, msg, 'mail-unread', true, false, cb);
    }

    /**
     * Creates a notification for an error
     *
     * @param {object} content - the information about the error
     * @param {Function} cb - callback that runs when notification is clicked
     */
    createErrorNotification(content, cb) {
        if (!this._errorSource)
            this._errorSource = this._newErrorSource();
        this._createNotificationWithSource(this._errorSource, content, 'dialog-error', false, false, cb);
    }

    /**
     * Destroys all sources for the email account
     */
    destroySources() {
        for (const source of [...this.sources])
            source.destroy();

        this.sources.clear();
        this._addedToTray.clear();
        this._emailSource = null;
        this._errorSource = null;
    }

    /**
     * Removes all errors currently displaying for this email account
     */
    removeErrors() {
        // If _errorSource is not null, it means it hasn't been destroyed yet
        // (thanks to the signal handler in _newErrorSource)
        if (this._errorSource) {
            this._errorSource.destroy();
            this._errorSource = null;
        }

        this._errorSource = this._newErrorSource();
    }

    /**
     * Creates a new source for email notifications
     *
     * @returns {Source} - the email source
     * @private
     */
    _newEmailSource() {
        const source = new MsgTray.Source({title: this._mailbox});

        source.connect('destroy', () => {
            this.sources.delete(source);
            this._addedToTray.delete(source);
            if (this._emailSource === source)
                this._emailSource = null;
        });

        this.sources.add(source);
        return source;
    }

    /**
     * Creates a new source with an error icon
     *
     * @returns {Source} - the error source
     * @private
     */
    _newErrorSource() {
        const source = new MsgTray.Source({title: this._mailbox});

        // Connect to destroy signal to clean up references if destroyed by Shell
        source.connect('destroy', () => {
            this.sources.delete(source);
            this._addedToTray.delete(source);
            if (this._errorSource === source)
                this._errorSource = null;
        });

        this.sources.add(source);
        return source;
    }

    /**
     * Creates a notification with the given source
     *
     * @param {Source} source - the source used to create the notification
     * @param {object} content - an object containing all information about the email
     * @param {string} iconName - the name of the icon that will display
     * @param {boolean} popUp - true if notification should display outside the message tray
     * @param {boolean} permanent - true if notification should not go away if you click on it
     * @param {Function} cb - callback that runs when notification is clicked
     * @returns {Notification} - the notification created
     * @private
     */
    _createNotificationWithSource(source, content, iconName, popUp, permanent, cb) {
        if (!source)
            return null;

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
                source,
                title,
                body: banner,
            });

            // Set optional properties
            if (iconName) {
                const gicon = new Gio.ThemedIcon({name: iconName});
                notification.gicon = gicon;
            }

            if (date && !isNaN(date.getTime())) {
                const unixLocal = date.getTime() / 1000;
                notification.datetime = GLib.DateTime.new_from_unix_local(unixLocal);
            }

            if (permanent)
                notification.setResident(true);


            // Connect signals
            notification.connect('activated', () => {
                try {
                    cb();
                } catch (err) {
                    console.error(this._prefix + err);
                }
            });



            // Add notification to source using the proper method
            if (source.addNotification)
                source.addNotification(notification);
            else if (source.pushNotification)
                source.pushNotification(notification);
            else if (source.showNotification)
                source.showNotification(notification);


            return notification;
        } catch (err) {
            console.error(`${this._prefix}Error creating notification: ${err}`);
            throw err;
        }
    }
};
