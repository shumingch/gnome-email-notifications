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
"use strict";
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const Lang = imports.lang;
const Notification = Me.imports.Notification.Notification;
const Source = imports.ui.messageTray.Source;
const console = Me.imports.console.console;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;
const Conf = Me.imports.Conf;
const MailClientFocuser = Me.imports.MailClientFocuser.MailClientFocuser;


/**
 * Creates and displays notifications.
 * @class
 */
var NotificationFactory = new Lang.Class({
    Name: 'NotificationFactory',
    DIALOG_ERROR: 'dialog-error',
    MAIL_READ: 'mail-read',
    MAIL_UNREAD: 'mail-unread',
    MAIL_MARK_IMPORTANT: 'mail-mark-important',
    /**
     * Creates new notifier for an email account.
     * @param {EmailAccount} emailAccount
     * @private
     */
    _init: function (emailAccount) {
        this._config = emailAccount.config;
        this._mailbox = emailAccount.mailbox;
        this.sources = new Set();
        this._errorSource = this._newErrorSource();
        this._mailClientFocuser = new MailClientFocuser();
    },
    /**
     * Creates a notification for a single unread email
     * @param msg - the information about the email
     * @param {function} cb - callback that runs when notification is clicked
     */
    createEmailNotification: function (msg, cb) {
        this._createNotification(msg, this.MAIL_UNREAD, true, false, cb);
    },
    /**
     * Creates a notification for an error
     * @param content - the information about the error
     * @param {function} cb - callback that runs when notification is clicked
     */
    createErrorNotification: function (content, cb) {
        this._createNotificationWithSource(this._errorSource, content, this.DIALOG_ERROR, false, false, cb);
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
     * Removes all errors currently displaying for this email account
     */
    removeErrors: function () {
        this._errorSource = this._newErrorSource();
    },
    /**
     * Returns non-empty sources
     * @returns {Source[]} array of sources
     */
    getNonEmptySources: function () {
        return [...this.sources].filter(source => source.count > 0);
    },
    /**
     * Creates a new source with an error icon
     * @returns {Source} - the error source
     * @private
     */
    _newErrorSource: function () {
        if (this._errorSource !== undefined) this._errorSource.destroy();
        const source = new Source(this._mailbox, this.DIALOG_ERROR);
        this.sources.add(source);
        return source;
    },
    /**
     * Creates a new notification with it's own source
     * @param content - an object containing all information about the email
     * @param {string} iconName - the name of the icon that will display
     * @param {boolean} popUp - true if notification should display outside the message tray
     * @param {boolean} permanent - true if notification should not go away if you click on it
     * @param {function} cb - callback that runs when notification is clicked
     * @returns {Notification} - the notification created
     */
    _createNotification: function (content, iconName, popUp, permanent, cb) {
        const source = new Source(this._mailbox, this.MAIL_READ);
        return this._createNotificationWithSource(source, content, iconName, popUp, permanent, cb);
    },
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
    _createNotificationWithSource: function (source, content, iconName, popUp, permanent, cb) {
        Main.messageTray.add(source);
        const notification = new Notification(source, content, iconName);
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

        this.sources.add(source);
        return notification;
    },
});
