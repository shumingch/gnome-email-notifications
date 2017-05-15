/*
 * Copyright (c) 2012 Adam Jabłoński
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

const St = imports.gi.St;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const GConf = imports.gi.GConf;
const GmailFeed = Me.imports.GmailFeed.GmailFeed;
const GmailConf = Me.imports.GmailConf.GmailConf;
const GmailMessageTray = Me.imports.GmailMessageTray.GmailMessageTray;
const Mainloop = imports.mainloop;
const XML = Me.imports.rexml;
const Gettext = imports.gettext.domain('gmailmessagetray');
const _ = Gettext.gettext;
const console = Me.imports.console.console;

const GCONF_ACC_KEY = "/apps/gmailmessagetray/accounts";
const _DEBUG = false;
const _version = "0.3.6";

let extension;
let extensionPath;
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
    extensionPath = extensionMeta.path;
    let userExtensionLocalePath = extensionPath + '/locale';
    imports.gettext.bindtextdomain('gmailmessagetray', userExtensionLocalePath);
}

const Extension = new Lang.Class({
    Name: "Extension",
    _init: function (extensionPath) {
        console.log('Enabling Gmail Message Tray version ' + _version);
        this.config = new GmailConf(this);
        this.messageTray = new GmailMessageTray(this);
        this.checkMailTimeout = null;
        this.extensionPath = extensionPath;
        this.sM = 0;
        this.sU = 0;
        this.numGoogle = 0;
        this.goaAccounts = this._initData();
        this.startTimeout();
        this._libCheck();
        this.initialCheckMail = GLib.timeout_add_seconds(0, 5, () => {
            this.checkMail();
            return false;
        });
    },
    checkMail: function () {
        try {
            this.sM = 0;
            this.sU = 0;
            this.numGoogle = 0;
            for (let i = 0; i < this.goaAccounts.length; i++) {
                if (_DEBUG) console.log("Running scan: " + i + " " + this.goaAccounts[i]._conn._oAccount.get_account().id);
                this.goaAccounts[i].scanInbox();
            }
            if (_DEBUG) console.log("Post oTimer: " + this.goaAccounts.length);
        }
        catch (err) {
            console.error(err);
        }
    },

    _processData: function (oImap) {
        const config = this.config;
        let maxId = 0;
        let maxSafeId = '';
        for (let i = 0; i < oImap.folders.length; i++) {
            this.sU += oImap.folders[i].unseen;
            this.sM += oImap.folders[i].messages;
            for (let j = 0; j < oImap.folders[i].list.length; j++) {
                if (oImap.folders[i].list[j].id > maxId) maxId = oImap.folders[i].list[j].id;
                if (oImap.folders[i].list[j].safeid > maxSafeId) maxSafeId = oImap.folders[i].list[j].safeid;
            }
        }
        if (_DEBUG) {
            console.log("maxSafeId= " + maxSafeId);
            console.log("total= " + this.sM);
            console.log("unseen= " + this.sU);
            console.log("Getting entry for  " + oImap._conn._oAccount.get_account().id);
        }
        let entry = config.get_int(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id);
        let safeEntry = config.get_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe');
        entry = typeof(entry) !== 'undefined' && entry !== null ? entry : 0;
        safeEntry = typeof(safeEntry) !== 'undefined' && safeEntry !== null ? safeEntry : '';
        if (_DEBUG) {
            console.log("safeentry= " + safeEntry);
            console.log("maxid= " + maxId);
            console.log("entry= " + entry);
        }
        if (maxSafeId > safeEntry) {
            config.set_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe', maxSafeId);
        }
        //todo:get not only from inbox
        if (_DEBUG) {
            console.log("Num google:" + numGoogle);
            console.log("Setting Content 0:" + oImap.folders[0].list.length);
            console.log("Setting Content 1:" + oImap._conn._oAccount.get_account().identity);
        }

        const content = oImap.folders[0].list;
        let mailbox = oImap._conn._oAccount.get_account().presentation_identity;
        mailbox = mailbox === undefined ? '' : mailbox;
        this.messageTray.updateContent(content, this.sU, mailbox);
        oImap._conn._disconnect();
        this.numGoogle++;
        if (_DEBUG) console.log("Post Process Data " + oImap._conn._oAccount.get_account().id);
    },
    _initData: function () {
        const goaAccounts = [];
        const aClient = Goa.Client.new_sync(null);
        const accounts = aClient.get_accounts();

        for (let i = 0; i < accounts.length; i++) {
            let sprovider = accounts[i].get_account().provider_name.toUpperCase();
            if (_DEBUG){
                console.log(sprovider);
                console.log(accounts[i].get_account().id);
            }
            if (sprovider === "GOOGLE") {
                let len = goaAccounts.push(new GmailFeed(accounts[i]));
                goaAccounts[len - 1].connect('inbox-scanned', Lang.bind(this, this._processData));
                goaAccounts[len - 1].connect('inbox-fed', Lang.bind(this, this._processData));
            }
        }

        if (_DEBUG) {
            for (let i = 0; i < goaAccounts.length; i++) {
                console.log("Checking Accounts" + goaAccounts[i]._conn._oAccount.get_account().id);
            }
            console.log("Post Init data l:" + goaAccounts.length);
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
            this.checkMail();
            return true;
        });
    },

    stopTimeout: function () {
        Mainloop.source_remove(this.checkMailTimeout);
        Mainloop.source_remove(this.initialCheckMail);
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
        this.extension = null;
    }
    catch (err) {
        console.error(err);
    }
}
