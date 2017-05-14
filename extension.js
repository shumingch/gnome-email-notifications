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
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const GConf = imports.gi.GConf;
const Gmail = Me.imports.gmail;
const GmailButton = Me.imports.GmailButton.GmailButton;
const GmailFeed = Me.imports.GmailFeed.GmailFeed;
const GmailConf = Me.imports.GmailConf.GmailConf;
const GmailMessageTray = Me.imports.GmailMessageTray.GmailMessageTray;
const Mainloop = imports.mainloop;
const XML = Me.imports.rexml;
const Gettext = imports.gettext.domain('gmailmessagetray');
const _ = Gettext.gettext;
const console = Me.imports.console.console;

const GCONF_ACC_KEY = "/apps/gmail_notify/accounts";
const _DEBUG = true;
const _version = "0.3.6";


let Soup, sSes;
try {
    Soup = imports.gi.Soup;
    sSes = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(sSes, new Soup.ProxyResolverDefault());
}
catch (err) {
    console.error(err);
}

let Gio;
try {
    Gio = imports.gi.Gio;
}
catch (err) {
    console.error(err);
}

let Goa;
try {
    Goa = imports.gi.Goa;
}
catch (err) {
    console.error(err);
}

let button, checkMailTimeout, extensionPath, currentPos, config, onceTimeout, goaAccounts, sM, sU, numGoogle,
    nVersion;

function checkMail(){
    try {
        sM = 0;
        sU = 0;
        numGoogle = 0;
        for (let i = 0; i < goaAccounts.length; i++) {
            if (_DEBUG) console.log("Running scan: " + i + " " + goaAccounts[i]._conn._oAccount.get_account().id);
            goaAccounts[i].scanInbox();
        }
        if (_DEBUG) console.log("Post oTimer: " + goaAccounts.length);
    }
    catch (err) {
        console.error(err);
    }
}

function onTimer() {
    return true;
}
function oneTime() {
    try {
        sM = 0;
        sU = 0;
        numGoogle = 0;
        for (let i = 0; i < goaAccounts.length; i++) {
            if (_DEBUG) console.log("Running scan: " + i + " " + goaAccounts[i]._conn._oAccount.get_account().id);
            goaAccounts[i].scanInbox();
        }
        if (_DEBUG) console.log("Post oneTime " + goaAccounts.length);
    }
    catch (err) {
        console.error(err);
    }
    return false;
}

function _mailNotify(content) {
    try {
    }
    catch (err) {
        console.error(err);
        //button.text.text = err.message;
    }

}

function _processData(oImap) {
    try {
        if (_DEBUG) console.log("Process Data " + oImap._conn._oAccount.get_account().id);
        const bText = config.getBText();
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
        if (_DEBUG) console.log("maxSafeId= " + maxSafeId);
        if (_DEBUG) console.log("total= " + sM);
        if (_DEBUG) console.log("unseen= " + sU);
        if (_DEBUG) console.log("Getting entry for  " + oImap._conn._oAccount.get_account().id);
        let entry = config.get_int(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id);
        let safeEntry = config.get_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe');
        entry = typeof(entry) !== 'undefined' && entry !== null ? entry : 0;
        safeEntry = typeof(safeEntry) !== 'undefined' && safeEntry !== null ? safeEntry : '';
        if (_DEBUG) console.log("safeentry= " + safeEntry);
        if (_DEBUG) console.log("maxid= " + maxId);
        if (_DEBUG) console.log("entry= " + entry);
        if (_DEBUG) console.log("Safemode= " + config.getSafeMode());
        if (config.getSafeMode() === 1 ? maxSafeId > safeEntry : maxId > entry) {
            for (let i = 0; i < oImap.folders.length; i++) {
                const notes = [];
                for (let j = 0; j < oImap.folders[i].list.length; j++) {
                    if (config.getSafeMode() === 1) {
                        if (oImap.folders[i].list[j].safeid > safeEntry) {
                            notes.push(oImap.folders[i].list[j]);
                        }
                    }
                    else {
                        if (oImap.folders[i].list[j].id > entry) {
                            notes.push(oImap.folders[i].list[j]);
                        }
                    }
                }
                if (_DEBUG) console.log("Notes length:" + notes.length);
                if (notes.length > 0 && config.getNotify()) {
                    _mailNotify(notes);
                }

            }
            if (config.getSafeMode() === 1) {
                config.set_string(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id + '_safe', maxSafeId);
            }
            else {
                config.set_int(GCONF_ACC_KEY + "/" + oImap._conn._oAccount.get_account().id, maxId);
            }
        }
        //todo:get not only from inbox
        if (_DEBUG) {
            console.log("Num google:" + numGoogle);
            console.log("Setting Content 0:" + oImap.folders[0].list.length);
            console.log("Setting Content 1:" + oImap._conn._oAccount.get_account().identity);
        }

        //button.setContent(oImap.folders[0].list, oImap._conn._oAccount.get_account().presentation_identity);
        const content = oImap.folders[0].list;
        let mailbox = oImap._conn._oAccount.get_account().presentation_identity;
        mailbox = mailbox === undefined ? '' : mailbox;
        let messageTray = new GmailMessageTray(sU, mailbox);
        messageTray.setContent(content);
        oImap._conn._disconnect();
        numGoogle++;
        //button.text.clutter_text.set_markup(config.getSafeMode() ? ('%s').format(sM.toString()) : bText.format(sM.toString(), sU.toString()));
        //button.setIcon(sU);
    }
    catch (err) {
        console.error(err);
        //button.text.text = err.message;
    }
    if (_DEBUG) console.log("Post Process Data " + oImap._conn._oAccount.get_account().id);
}

function _initData() {
    try {
        goaAccounts = [];
        let aClient = Goa.Client.new_sync(null);
        let accounts = aClient.get_accounts();

        for (let i = 0; i < accounts.length; i++) {
            if (_DEBUG) console.log(accounts[i].get_account().provider_name.toUpperCase());
            if (_DEBUG) console.log(accounts[i].get_account().id);
            if (_DEBUG) console.log(accounts[i].get_account().provider_name.toUpperCase());
            let sprovider = accounts[i].get_account().provider_name.toUpperCase();
            if (_DEBUG) console.log("sprovider:" + sprovider);
            if (sprovider === "GOOGLE" || (sprovider === "MICROSOFT ACCOUNT" && config.getSafeMode() === 0)) {
                if (_DEBUG) console.log("Post oneTime adding");
                let len = goaAccounts.push(config.getSafeMode() === 1 ? new GmailFeed(accounts[i]) : new Gmail.GmailImap(accounts[i]));
                goaAccounts[len - 1].connect('inbox-scanned', _processData);
                goaAccounts[len - 1].connect('inbox-fed', _processData);
                if (_DEBUG) console.log("Post oneTime added:" + goaAccounts[i]._conn._oAccount.get_account().id);
            }
        }

        if (_DEBUG) {
            for (let i = 0; i < goaAccounts.length; i++) {
                console.log("Checking Accounts" + goaAccounts[i]._conn._oAccount.get_account().id);
            }
        }
        if (_DEBUG) console.log("Post Init data l:" + goaAccounts.length);
    }
    catch (err) {
        if (_DEBUG) console.error(err);
    }

}




function init(extensionMeta) {
    console.log('Init Gmail notify version ' + _version);
    extensionPath = extensionMeta.path;
    let userExtensionLocalePath = extensionPath + '/locale';
    imports.gettext.bindtextdomain('gmail_notify', userExtensionLocalePath);
}

function libCheck() {
    try {
        if (typeof(Goa) !== 'undefined' && typeof(Soup) !== 'undefined' && typeof(Gio) !== 'undefined' && typeof(GConf) !== 'undefined') {
            //button.setContent();
            if (_DEBUG) console.log('init timeout' + config.getTimeout());
        }
        else {
            //button._showError(_('Extension requires Goa,Soup,Gio,Gconf typelibs - click for instructions how to install'));
            //button.setIcon(1);
            //Main.panel.menuManager.addMenu(button.menu);
        }
    }
    catch (err) {
        console.error(err);
    }
}


function _checkVersion() {
    try {
        let sSes = new Soup.SessionAsync();
        let sMes = Soup.Message.new('GET', 'http://gn.makrodata.org/index.php/current');
        sSes.queue_message(sMes, (oSes, oMes) => {
            if (_DEBUG) console.log(oMes.response_body.data);
            let xdoc = new REXML(oMes.response_body.data.replace('<?xml version="1.0" encoding="utf-8" ?>', ''));
            if (_DEBUG) console.log("Current Version: " + xdoc.version[0].number);
            nVersion = xdoc.rootElement.ChildElement('number').text;

        });
    }
    catch (err) {
        console.error(err);
    }
}

function show() {
    try {
        button = new GmailButton(extensionPath);
        button.showNumbers(config.getNumbers());
        button.setIcon(0);
        const position = config.getPosition();
        //const position = config.get_string("position");
        const statusName = 'gmail-message-tray';
        switch (position) {
            case 'right':
                Main.panel.addToStatusArea(statusName, button, 0, 'right');
                break;
            case 'center':
                Main.panel.addToStatusArea(statusName, button, 0, 'center');
                break;
            case 'left':
                Main.panel.addToStatusArea(statusName, button, 0, 'left');
                break;
            default:
                Main.panel.addToStatusArea(statusName, button, 0, 'right');
                break;
        }
        currentPos = position;
    }
    catch (err) {
        console.error(err);
    }

}
function startTimeout(){
    checkMailTimeout = GLib.timeout_add_seconds(0, config.getTimeout(), ()=>{
        checkMail();
        return true;
    });
}


function enable() {
    try {
        config = new GmailConf();
        console.log('Enabling Gmail Message Tray version ' + _version);
        //show();
        _initData();
        nVersion = '';

        GLib.timeout_add_seconds(0, 5, ()=>{
            checkMail();
            return false;
        });
        startTimeout();
        libCheck();
    }
    catch (err) {
        console.error(err);
    }
}

function hide() {
    try {
        button.destroy();
    }
    catch (err) {
        console.error(err);
    }
}

function stopTimeout(){
    Mainloop.source_remove(checkMailTimeout);
}

function disable() {
    //hide();
    config._disconnectSignals();
    config = null;
    stopTimeout();
    goaAccounts = null;
}
