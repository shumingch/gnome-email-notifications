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
/** @external imports*/
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const console = Me.imports.console.console;
const Conf = Me.imports.Conf.Conf;
const EmailAccount = Me.imports.EmailAccount.EmailAccount;

const _version = Me.metadata['version'];

let extension;
let Goa;
try {
    Goa = imports.gi.Goa;
} catch (err) {
    console.error(err);
}

/**
 * Initializes translations for the extension
 */
function init() {
    console.log('Init version ' + _version);
    Conf.setupTranslations();
}

const supportedProviders = new Set(["google", "windows_live"]);

/**
 * An instance of this gnome extension
 */
var Extension = class {
    constructor() {
        console.log('Enabling ' + _version);
        /** @type Conf */
        this.config = new Conf(this);
        this.checkMailTimeout = null;
        Extension._libCheck();
        this._getEmailAccounts(emailAccounts => {
            this.goaAccounts = emailAccounts;
            this.startTimeout();
            this.initialCheckMail = GLib.timeout_add_seconds(0, 5, () => {
                this._checkMail();
                return false;
            });
        });
    }

    /**
     * Checks the mail for each account available
     * @private
     */
    _checkMail() {
        console.log("Checking mail");
        for (let account of this.goaAccounts) {
            account.scanInbox();
        }
    }

    /**
     * Returns a list of all Gnome Online Accounts
     * @param callback - callback that is called with {EmailAccount[]} as parameter
     * @private
     */
    _getEmailAccounts(callback) {
        const emailAccounts = [];
        Goa.Client.new(null, (proxy, asyncResult) => {
                const aClient = Goa.Client.new_finish(asyncResult);
                const accounts = aClient.get_accounts();

                for (let account of accounts) {
                    const provider = account.get_account().provider_type;
                    if (supportedProviders.has(provider)) {
                        emailAccounts.push(new EmailAccount(this.config, account));
                    }
                }
                if (emailAccounts.length === 0) {
                    Main.notifyError(_("No email accounts found"));
                    throw new Error("No email accounts found");
                }
                callback(emailAccounts);
            }
        );
    }

    /**
     * Checks if required libraries are installed
     * @private
     */
    static _libCheck() {
        if (Goa === undefined) {
            Main.notifyError(_("Install gir1.2-goa"));
            throw new Error("No Goa found");
        }
    }

    /**
     * Checks mail using timeout from config
     */
    startTimeout() {
        this.checkMailTimeout = GLib.timeout_add_seconds(0, this.config.getTimeout(), () => {
            this._checkMail();
            return true;
        });
    }

    /**
     * Stops checking mail
     */
    stopTimeout() {
        Mainloop.source_remove(this.checkMailTimeout);
        Mainloop.source_remove(this.initialCheckMail);
    }

    /**
     * Stops and cleans up extension
     */
    destroy() {
        this.stopTimeout();
        for (let account of this.goaAccounts) {
            account.destroySources();
        }
    }
};

/**
 * Sets up the extension
 */
function enable() {
    try {
        extension = new Extension();
    } catch (err) {
        console.error(err);
    }
}

/**
 * Stops and cleans up extension
 */
function disable() {
    try {
        extension.destroy();
        extension = null;
    } catch (err) {
        console.error(err);
    }
}
