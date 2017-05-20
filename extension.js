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
const GConf = imports.gi.GConf;
const GmailFeed = Me.imports.GmailFeed.GmailFeed;
const GmailConf = Me.imports.GmailConf.GmailConf;
const GmailMessageTray = Me.imports.GmailMessageTray.GmailMessageTray;
const Mainloop = imports.mainloop;
const console = Me.imports.console.console;

const _version = "0.1";

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

function init(extensionMeta) {
    console.log('Init Gmail Message Tray version ' + _version);
    const extensionPath = extensionMeta.path;
    let userExtensionLocalePath = extensionPath + '/locale';
    imports.gettext.bindtextdomain('gmail_notify', userExtensionLocalePath);
}

const Extension = new Lang.Class({
    Name: "Extension",
    _init: function () {
        console.log('Enabling Gmail Message Tray version ' + _version);
        this.config = new GmailConf(this);
        this.messageTray = new GmailMessageTray(this);
        this.checkMailTimeout = null;
        this.goaAccounts = this._initData();
        this.startTimeout();
        this._libCheck();
        this.initialCheckMail = GLib.timeout_add_seconds(0, 5, () => {
            this._checkMail();
            return false;
        });
    },
    _checkMail: function () {
        try {
            console.log("Checking mail");
            for (let i = 0; i < this.goaAccounts.length; i++) {
                this.goaAccounts[i].scanInbox(Lang.bind(this, this._processData));
            }
        }
        catch (err) {
            console.error(err);
            this.messageTray.showError(err.message);
        }
    },

    _processData: function (err, folders, _conn) {
        if(err){
            throw err;
        }
        let sU = 0;
        for (let i = 0; i < folders.length; i++) {
            sU += folders[i].unseen;
        }
        const content = folders[0].list;
        let mailbox = _conn.get_account().presentation_identity;
        mailbox = mailbox === undefined ? '' : mailbox;
        this.messageTray.updateContent(content, sU, mailbox);
    },
    _initData: function () {
        const goaAccounts = [];
        const aClient = Goa.Client.new_sync(null);
        const accounts = aClient.get_accounts();

        for (let i = 0; i < accounts.length; i++) {
            let sprovider = accounts[i].get_account().provider_type;
            if (sprovider === "google") {
                goaAccounts.push(new GmailFeed(accounts[i]));
            }
        }
        return goaAccounts;
    },
    _libCheck: function () {
        if (Goa === undefined || Soup === undefined || Gio === undefined || GConf === undefined) {
            this.messageTray.showLibError();
        }
    },
    startTimeout: function () {
        this.checkMailTimeout = GLib.timeout_add_seconds(0, this.config.getTimeout(), () => {
            this._checkMail();
            return true;
        });
    },

    stopTimeout: function () {
        Mainloop.source_remove(this.checkMailTimeout);
        if(this.initialCheckMail !== null){
            Mainloop.source_remove(this.initialCheckMail);
            this.initialCheckMail = null;
        }
    },
    destroy: function () {
        this.stopTimeout();
        this.goaAccounts = null;
        this.messageTray.destroySources();
    }
});

function enable() {
    try {
        extension = new Extension();
    }
    catch (err) {
        console.error(err);
    }
}


function disable() {
    try{
        extension.destroy();
        extension = null;
    }
    catch (err) {
        console.error(err);
    }
}
