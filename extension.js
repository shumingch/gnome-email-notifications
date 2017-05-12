"use strict";
/*
 * Copyright (c) 2012 Adam Jabłoński
 *
 * Gmail Notify Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Notify Extension is distributed in the hope that it will be useful, but
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
const GLib = imports.gi.GLib;

const St = imports.gi.St;
let Gio;
try {
    Gio = imports.gi.Gio;
}
catch (err) {
    global.log("Gio import error:" + err.message);
}
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gmail = Me.imports.gmail;
const GmailNotification = Me.imports.GmailNotification.GmailNotification;
const GmailButton = Me.imports.GmailButton.GmailButton;
const GmailNotificationSource = Me.imports.GmailNotificationSource.GmailNotificationSource;
const GmailMenuItem = Me.imports.GmailMenuItem.GmailMenuItem;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const XML = Me.imports.rexml;
const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;
const GConf = imports.gi.GConf;
const Utils = imports.misc.util;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const Lib = Me.imports.lib;

const Clutter = imports.gi.Clutter;
const CHECK_TIMEOUT = 300;
const GCONF_ACC_KEY = "/apps/gmail_notify/accounts";
const GCONF_DIR = "/apps/gmail_notify";
const _DEBUG = true;
const _version = "0.3.6";

const GMAILNOTIFY_SETTINGS_KEY_TIMEOUT = 'timeout';
const GMAILNOTIFY_SETTINGS_KEY_BTEXT = 'btext';
const GMAILNOTIFY_SETTINGS_KEY_POSITION = 'position';
const GMAILNOTIFY_SETTINGS_KEY_NOTIFY = 'notify';
const GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY = 'showsummary';
const GMAILNOTIFY_SETTINGS_KEY_SAFEMODE = 'safemode';
const GMAILNOTIFY_SETTINGS_KEY_USEMAIL = 'usemail';


let Soup, sSes;
try {
    Soup = imports.gi.Soup;
    sSes = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(sSes, new Soup.ProxyResolverDefault());
}
catch (err) {
    global.log("Soup import error:" + err.message);
}


let Goa;
try {
    Goa = imports.gi.Goa;
}
catch (err) {
    global.log("Goa import error:" + err.message);
}


let text, button, event, extensionPath, currentPos, config, onetime, goaAccounts, sM, sU, numGoogle,
    nVersion, bText, safemode, settings;


function onTimer() {
    if (_DEBUG) global.log("onTimer");
    try {
        sM = 0;
        sU = 0;
        numGoogle = 0;
        for (let i = 0; i < goaAccounts.length; i++) {
            if (_DEBUG) global.log("Running scan: " + i + " " + goaAccounts[i]._conn._oAccount.get_account().id);
            goaAccounts[i].scanInbox();
        }
        if (_DEBUG) global.log("Post oTimer: " + goaAccounts.length);
    }
    catch (err) {
        global.log("onTimer :" + err.message);
    }
    return true;
}
function oneTime() {
    if (_DEBUG) global.log("oneTime");
    try {
        sM = 0;
        sU = 0;
        numGoogle = 0;
        for (let i = 0; i < goaAccounts.length; i++) {
            if (_DEBUG) global.log("Running scan: " + i + " " + goaAccounts[i]._conn._oAccount.get_account().id);
            goaAccounts[i].scanInbox();
        }
        if (_DEBUG) global.log("Post oneTime " + goaAccounts.length);
    }
    catch (err) {
        global.log("oneTime :" + err.message);
    }
    return false;
}

function _mailNotify(content) {
    try {
        let source = new GmailNotificationSource();
        Main.messageTray.add(source);

        for (let i = 0; i < content.length; i++) {
            let notification = new GmailNotification(source, content[i]);
            if (_DEBUG) global.log("After cretae notification ");
            notification.setTransient(true);
            source.notify(notification);
        }
    }
    catch (err) {
        global.log("_mail notify:" + err.message);
        button.text.text = err.message;
    }

}

function _processData(oImap, resp, error) {
    if (_DEBUG) global.log("Entering process Data ");
    if (_DEBUG) global.log("Process Data " + oImap._conn._oAccount.get_account().id);
    try {
        let maxId = 0;
        let maxSafeId = '';
        for (let i = 0; i < oImap.folders.length; i++) {
            sU += oImap.folders[i].unseen;
            sM += oImap.folders[i].messages;
            for (let j = 0; j < oImap.folders[i].list.length; j++) {
                if (oImap.folders[i].list[j].id > maxId) maxId = oImap.folders[i].list[j].id;
                if (oImap.folders[i].list[j].safeid > maxSafeId) maxSafeId = oImap.folders[i].list[j].safeid;
            }
        }
        if (_DEBUG) global.log("maxSafeId= " + maxSafeId);
        if (_DEBUG) global.log("total= " + sM);
        if (_DEBUG) global.log("unseen= " + sU);
        if (_DEBUG) global.log("Getting entry for  " + oImap._conn._oAccount.get_account().id);
        let entry = config.get_int(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id);
        let safeentry = config.get_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe');
        entry = typeof(entry) !== 'undefined' && entry !== null ? entry : 0;
        safeentry = typeof(safeentry) !== 'undefined' && safeentry !== null ? safeentry : '';
        if (_DEBUG) global.log("safeentry= " + safeentry);
        if (_DEBUG) global.log("maxid= " + maxId);
        if (_DEBUG) global.log("entry= " + entry);
        if (_DEBUG) global.log("Safemode= " + config._safemode);
        if (config._safemode === 1 ? maxSafeId > safeentry : maxId > entry) {
            for (let i = 0; i < oImap.folders.length; i++) {
                const notes = [];
                for (let j = 0; j < oImap.folders[i].list.length; j++) {
                    if (config._safemode === 1) {
                        if (oImap.folders[i].list[j].safeid > safeentry) {
                            notes.push(oImap.folders[i].list[j]);
                        }
                    }
                    else {
                        if (oImap.folders[i].list[j].id > entry) {
                            notes.push(oImap.folders[i].list[j]);
                        }
                    }
                }
                if (_DEBUG) global.log("Notes length:" + notes.length);
                if (notes.length > 0 && config._notify) {
                    _mailNotify(notes);
                }

            }
            if (config._safemode === 1) {
                config.set_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe', maxSafeId);
            }
            else {
                config.set_int(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id, maxId);
            }
        }
        //todo:get not only from inbox
        if (_DEBUG) {
            global.log("Num google:" + numGoogle);
            global.log("Setting Content 0:" + oImap.folders[0].list.length);
            global.log("Setting Content 1:" + oImap._conn._oAccount.get_account().identity);
        }

        button.setContent(oImap.folders[0].list, numGoogle, oImap._conn._oAccount.get_account().presentation_identity, oImap._conn._oAccount.get_account().provider_name.toUpperCase());
        oImap._conn._disconnect();
        numGoogle++;
        button.text.clutter_text.set_markup(config._safemode ? ('%s').format(sM.toString()) : bText.format(sM.toString(), sU.toString()));
        button.setIcon(sU);
    }
    catch (err) {
        global.log("process data:" + err.message);
        button.text.text = err.message;
    }
    if (_DEBUG) global.log("Post Process Data " + oImap._conn._oAccount.get_account().id);
}

function _initData() {

    if (_DEBUG) global.log("Init data");
    try {
        goaAccounts = [];
        let aClient = Goa.Client.new_sync(null);
        let accounts = aClient.get_accounts();

        if (_DEBUG) global.log("init data");

        for (let i = 0; i < accounts.length; i++) {
            if (_DEBUG) global.log(accounts[i].get_account().provider_name.toUpperCase());
            if (_DEBUG) global.log(accounts[i].get_account().id);
            if (_DEBUG) global.log(accounts[i].get_account().provider_name.toUpperCase());
            let sprovider = accounts[i].get_account().provider_name.toUpperCase();
            if (_DEBUG) global.log("sprovider:" + sprovider);
            if (sprovider === "GOOGLE" || (sprovider === "MICROSOFT ACCOUNT" && config._safemode === 0)) {
                if (_DEBUG) global.log("Post oneTime adding");
                let len = goaAccounts.push(config._safemode === 1 ? new Gmail.GmailFeed(accounts[i]) : new Gmail.GmailImap(accounts[i]));
                //let len=goaAccounts.push( new Gmail.GmailImap(accounts[i]) );
                goaAccounts[len - 1].connect('inbox-scanned', _processData);
                goaAccounts[len - 1].connect('inbox-fed', _processData);
                if (_DEBUG) global.log("Post oneTime added:" + goaAccounts[i]._conn._oAccount.get_account().id);
            }
        }

        if (_DEBUG) {
            for (let i = 0; i < goaAccounts.length; i++) {
                global.log("Checking Accounts" + goaAccounts[i]._conn._oAccount.get_account().id);
            }
        }

        if (_DEBUG) global.log("Post Init data l:" + goaAccounts.length);
    }
    catch (err) {
        if (_DEBUG) global.log("Init data : " + err.message);
    }

}


// well run reader really
function _showHello(object, event) {
    global.log("show hello entry");
    try {
        if (config._reader === 0) {
            if (config._browser === "") {
                global.log("gmail notify: no default browser")
            }
            else {
                global.log("object link: " + object.link);
                if (object.link !== '' && typeof(object.link) !== 'undefined') {
                    Utils.trySpawnCommandLine(config._browser + " " + object.link);
                }
                else {
                    Utils.trySpawnCommandLine(config._browser + " http://www.gmail.com");
                }
            }
        } else {
            if (config._mail === "") {
                global.log("gmail notify: no default mail reader")
            }
            else {
                Utils.trySpawnCommandLine(config._mail);
            }
        }

    }
    catch (err) {
        global.log("Show Hello:" + err.message);
        button.text.text = err.message;
    }
}

function _browseGn() {
    if (config._browser === "") {
        global.log("gmail notify: no default browser")
    }
    else {
        Utils.trySpawnCommandLine(config._browser + " http://gn.makrodata.org");
    }
}


const GmailConf = function () {
    this._init();
};
GmailConf.prototype = {
    _init: function () {
        try {
            this._client = GConf.Client.get_default();
            try {
                this._browser = Gio.app_info_get_default_for_uri_scheme("http").get_executable();
            }
            catch (err) {
                this._browser = "firefox";
                global.log("Config init browser : " + err.message);
            }
            try {
                this._mail = Gio.app_info_get_default_for_uri_scheme("mailto").get_executable();
            }
            catch (err) {
                global.log("Config init mail : " + err.message);
                this._mail = "";
            }
            this._readValues();
        }
        catch (err) {
            global.log("Config init: " + err.message);
        }

    },

    _readValues: function () {
        this._timeout = settings.get_int(GMAILNOTIFY_SETTINGS_KEY_TIMEOUT);
        this._reader = settings.get_int(GMAILNOTIFY_SETTINGS_KEY_USEMAIL);
        this._position = settings.get_string(GMAILNOTIFY_SETTINGS_KEY_POSITION);
        this._numbers = settings.get_int(GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY);
        this._notify = settings.get_int(GMAILNOTIFY_SETTINGS_KEY_NOTIFY);
        this._vcheck = 0;
        this._safemode = settings.get_int(GMAILNOTIFY_SETTINGS_KEY_SAFEMODE);
        this._btext = settings.get_string(GMAILNOTIFY_SETTINGS_KEY_BTEXT);
    },
    set_int: function (key, val) {
        return this._client.set_int(key, val)
    },
    get_int: function (key) {
        return this._client.get_int(key)
    },
    set_string: function (key, val) {
        return this._client.set_string(key, val)
    },
    get_string: function (key) {
        return this._client.get_string(key)
    },
    _onNotify: function (client, object, p0) {
        return true;
    },
    _onDestroy: function (client, object, p0) {
        return true;
    },
    _onValueChanged: function (client, key, p0) {
        return true;
    },
    _disconnectSignals: function () {
        //this._client.notify_remove(this.np);
        //this._client.remove_dir(GCONF_DIR);
        //this._client.disconnect(this.pid);
        //settings.disconnect(sigid);

    }

};

//Signals.addSignalMethods(GmailConf.prototype);

function init(extensionMeta) {
    global.log('Init Gmail notify version ' + _version);
    extensionPath = extensionMeta.path;
    settings = Lib.getSettings(Me);
    let userExtensionLocalePath = extensionPath + '/locale';
    imports.gettext.bindtextdomain('gmail_notify', userExtensionLocalePath);
    libCheck();
}

function libCheck() {
    try {
        if (typeof(Goa) !== 'undefined' && typeof(Soup) !== 'undefined' && typeof(Gio) !== 'undefined' && typeof(Gonf) !== 'undefined') {
            button.setContent();
            if (_DEBUG) global.log('init timeout' + config._timeout);
        }
        else {
            button._showError(_('Extension requires Goa,Soup,Gio,Gconf typelibs - click for instructions how to install'));
            button.setIcon(1);
            Main.panel.menuManager.addMenu(button.menu);
            show();
        }
    }
    catch (err) {
        global.log("init error:" + err.message);
    }
}


function _checkVersion() {
    try {
        let sSes = new Soup.SessionAsync();
        let sMes = Soup.Message.new('GET', 'http://gn.makrodata.org/index.php/current');
        sSes.queue_message(sMes, Lang.bind(this, function (oSes, oMes) {
            try {
                if (_DEBUG) global.log(oMes.response_body.data);
                let xdoc = new REXML(oMes.response_body.data.replace('<?xml version="1.0" encoding="utf-8" ?>', ''));
                if (_DEBUG) global.log("Current Verison: " + xdoc.version[0].number);
                nVersion = xdoc.rootElement.ChildElement('number').text;
                if (nVersion > _version) {
                    //bText=' ! %s(<u>%s</u>)'
                }
            }
            catch (err) {
                global.log("Check version callback:" + err.message)
            }

        }))
    }
    catch (err) {
        global.log("Check version:" + err.message)
    }
}

function show() {
    try {
        if (_DEBUG) global.log('Showing button');
        if (_DEBUG) global.log(config._position);
        switch (config._position) {
            case 'right':
                Main.panel.addToStatusArea('gmail-notify', button, 0, 'right');
                break;
            case 'center':
                Main.panel.addToStatusArea('gmail-notify', button, 0, 'center');
                break;
            case 'left':
                Main.panel.addToStatusArea('gmail-notify', button, 0, 'left');
                break;
            default:
                Main.panel.addToStatusArea('gmail-notify', button, 0, 'right');
                break;
        }
        currentPos = config._position;
    }
    catch (err) {
        global.log(err.message);
    }

}

function enable() {
    try {
        button = new GmailButton(extensionPath);
        config = new GmailConf();
        bText = config._btext;
        if (_DEBUG) global.log('init numbers' + config._numbers);
        button.showNumbers(config._numbers);
        button.setIcon(0);

        global.log(' Enbling Gmail notify version ' + _version);
        if (config === null) config = new GmailConf();
        show();
        _initData();
        nVersion = '';


        //if (config.get_int(GCONF_DIR+'/vcheck')==1) _checkVersion();
        onetime = GLib.timeout_add_seconds(0, 5, oneTime);
        event = GLib.timeout_add_seconds(0, config._timeout, onTimer);
        if (_DEBUG) global.log('Event created: ' + event);
    }
    catch (err) {
        log("Enable error: " + err.message, err.stack);
    }
}

function hide() {
    try {
        button.destroy();
    }
    catch (err) {
        global.log(err.message);
    }
}

function disable() {
    hide();

    config._disconnectSignals();
    config = null;
    Mainloop.source_remove(onetime);
    Mainloop.source_remove(event);
    goaAccounts = null;

}
