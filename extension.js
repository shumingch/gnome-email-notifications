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
import GLib from 'gi://GLib';
import Goa from 'gi://Goa';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {Conf} from './Conf.js';
import {EmailAccount} from './EmailAccount.js';

const supportedProviders = new Set(['google', 'windows_live', 'ms_graph']);

export default class GmailNotificationExtension extends Extension {
    enable() {
        this.config = new Conf(this);
        this.checkMailTimeout = null;
        this.goaAccounts = [];

        this._getEmailAccounts(emailAccounts => {
            this.goaAccounts = emailAccounts;
            this.startTimeout();
        });

        this.initialCheckMail = GLib.timeout_add_seconds(0, 5, () => {
            this._checkMail();
            this.initialCheckMail = null;
            return false;
        });
    }

    disable() {
        try {
            this.destroy();
        } catch (err) {
            const prefix = '[Gnome Email Notifications] ';
            console.error(prefix + err);
        }
    }

    /**
     * Checks the mail for each account available
     *
     * @private
     */
    _checkMail() {
        for (const account of this.goaAccounts)
            account.scanInbox();
    }

    /**
     * Returns a list of all Gnome Online Accounts
     *
     * @param {Function} callback - callback that is called with {EmailAccount[]} as parameter
     * @private
     */
    _getEmailAccounts(callback) {
        const emailAccounts = [];
        Goa.Client.new(null, (proxy, asyncResult) => {
            try {
                const aClient = Goa.Client.new_finish(asyncResult);
                const accounts = aClient.get_accounts();

                for (const account of accounts) {
                    const provider = account.get_account().provider_type;
                    if (supportedProviders.has(provider))
                        emailAccounts.push(new EmailAccount(this.config, account));
                }
                if (emailAccounts.length === 0) {
                    Main.notifyError('Gnome Email Notifications', _('No email accounts found'));
                    throw new Error('No email accounts found');
                }
                callback(emailAccounts);
            } catch (err) {
                const prefix = '[Gnome Email Notifications] ';
                console.error(prefix + err);
            }
        });
    }



    /**
     * Checks mail using timeout from config
     */
    startTimeout() {
        const timeout = this.config.getTimeout();
        this.checkMailTimeout = GLib.timeout_add_seconds(0, timeout, () => {
            this._checkMail();
            return true;
        });
    }

    /**
     * Stops checking mail
     */
    stopTimeout() {
        if (this.checkMailTimeout)
            GLib.source_remove(this.checkMailTimeout);
        if (this.initialCheckMail !== null && this.initialCheckMail !== undefined)
            GLib.source_remove(this.initialCheckMail);
    }

    /**
     * Stops and cleans up extension
     */
    destroy() {
        this.stopTimeout();
        if (this.config)
            this.config.destroy();

        for (const account of this.goaAccounts)
            account.destroySources();
    }
}
