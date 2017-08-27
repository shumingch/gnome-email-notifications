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
const GLib = imports.gi.GLib;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const GmailConf = Me.imports.GmailConf.GmailConf;
const EmailAccount = Me.imports.EmailAccount.EmailAccount;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const console = Me.imports.console.console;

const _version = Me.metadata['version'];

let extension;
let Soup, sSes, Gio, Goa;
try {
    Soup = imports.gi.Soup;
    Gio = imports.gi.Gio;
    Goa = imports.gi.Goa;
    sSes = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(sSes, new Soup.ProxyResolverDefault());
}
catch (err) {
    console.error(err);
}

/**
 * Initializes translations for the extension
 * @param extensionMeta - information about the extension
 */
function init(extensionMeta) {
    console.log('Init version ' + _version);
    const extensionPath = extensionMeta.path;
    let userExtensionLocalePath = extensionPath + '/locale';
    imports.gettext.bindtextdomain('gmail_notify', userExtensionLocalePath);
}

const supportedProviders = new Set(["google", "windows_live"]);

/**
 * An instance of this gnome extension
 * @type {Lang.Class}
 */
const Extension = new Lang.Class({
    Name: "Extension",
    _init: function () {
        console.log('Enabling ' + _version);
        this.config = new GmailConf(this);
        this.checkMailTimeout = null;
        this._libCheck();
        this.goaAccounts = this._getGoaAccounts();
        this.startTimeout();
        this.initialCheckMail = GLib.timeout_add_seconds(0, 5, () => {
            this._checkMail();
            return false;
        });
    },
    /**
     * Checks the mail for each account available
     * @private
     */
    _checkMail: function () {
        console.log("Checking mail");
        for (let account of this.goaAccounts) {
            account.scanInbox();
        }
    },

    /**
     * Returns a list of all Gnome Online Accounts
     * @returns {Array} - the list of accounts
     * @private
     */
    _getGoaAccounts: function () {
        const goaAccounts = [];
        const aClient = Goa.Client.new_sync(null);
        const accounts = aClient.get_accounts();

        for (let account of accounts) {
            const provider = account.get_account().provider_type;
            if (supportedProviders.has(provider)) {
                goaAccounts.push(new EmailAccount(this.config, account));
            }
        }
        if (goaAccounts.length === 0) {
            Main.notifyError("No email accounts found");
            throw new Error("No email accounts found");
        }
        return goaAccounts;
    },
    /**
     * Checks if required libraries are installed
     * @private
     */
    _libCheck: function () {
        if (Goa === undefined) {
            Main.notifyError(_("Install gir1.2-goa"));
            throw new Error("No Goa found");
        }
    },
    /**
     * Checks mail using timeout from config
     */
    startTimeout: function () {
        this.checkMailTimeout = GLib.timeout_add_seconds(0, this.config.getTimeout(), () => {
            this._checkMail();
            return true;
        });
    },
    /**
     * Stops checking mail
     */
    stopTimeout: function () {
        Mainloop.source_remove(this.checkMailTimeout);
        Mainloop.source_remove(this.initialCheckMail);
    },
    /**
     * Stops and cleans up extension
     */
    destroy: function () {
        this.stopTimeout();
        for (let account of this.goaAccounts) {
            account.destroySources();
        }
    }
});

/**
 * Sets up the extension
 */
function enable() {
    try {
        extension = new Extension();
    }
    catch (err) {
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
    }
    catch (err) {
        console.error(err);
    }
}
