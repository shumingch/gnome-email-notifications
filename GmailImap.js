/*
 * Copyright (c) 2012 Adam Jabłooński
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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Imap = Me.imports.imap;
const OAuth = Me.imports.oauth;
const GLib = imports.gi.GLib;
const Signals = imports.signals;
const XML = Me.imports.rexml;
const GmailConnection = Me.imports.GmailConnection.GmailConnection;
const console = Me.imports.console.console;
const Lang = imports.lang;
const _DEBUG = true;

const GmailImap = new Lang.Class({
    Name: 'GmailImap',
    Extends: Imap.Imap,
    _init: function (conn) {
        try {
            if (conn instanceof GmailConnection) {
                this.parent(conn);
            }
            // must be goa object (account)
            else {
                let oconn = new GmailConnection(conn);
                this.parent(oconn);
                if (_DEBUG) console.log("Imap created: .." + this._conn._oAccount.get_account().id);
            }
            this.authenticated = false;
            this._conn.connect('disconnected', () => {
                this.authenticated = false;
            });
        }
        catch (err) {
            console.error(err);
        }
    },
    authenticate: function (account, callback) {

        try {
            if (this._conn.connected) {
                this._doauthenticate(account, callback)
            }
            else {
                if (_DEBUG) console.log('Not Connected...');
                const _acc = account;
                const _call = callback;
                this._conn._connect(() => {
                    this._doauthenticate(_acc, _call)
                });
            }
        }
        catch (err) {
            console.error(err);
        }
    },
    _doauthenticate: function (account, callback) {
        try {
            let oAuth = new OAuth.OAuth(account);
            let auth_str = oAuth.oAuth_str;

            this._command("AUTHENTICATE XOAUTH2 " + auth_str + String.fromCharCode(13) + String.fromCharCode(10), false, (oGIMap, resp) => {
                    if (_DEBUG) {
                        for (let i = 0; i < resp.length; i++) console.log(resp[i]);
                    }
                    if (this._commandOK(resp)) {
                        this.authenticated = true;
                        this._conn.newline = String.fromCharCode(13) + String.fromCharCode(10);
                        if (typeof(callback) !== 'undefined') {
                            callback.apply(this, [this, resp]);
                        }
                        this.emit('authenticated', true);
                    }
                    else {
                        if (typeof(callback) !== 'undefined') {
                            callback.apply(this, [this, resp, new Error('Authentication error')]);
                        }
                        this.emit('authenticated', false);
                    }
                }
            );
        }
        catch (err) {
            console.error(err);
        }
    },
    scanInbox: function (callback) {

        try {
            if (this.authenticated) {
                this._doScanInbox(callback);
            }
            else {
                if (_DEBUG) console.log('Not authenticated');
                const _call = callback;

                this.authenticate(this._conn._oAccount,
                    () => {
                        this._doScanInbox(_call);
                    })
            }
        }
        catch (err) {
            console.error(err);
        }

    },

    _doScanInbox: function (callback, i) {
        try {
            this._scanFolder("INBOX", (oImap, resp, error) => {
                try {
                    if (typeof(callback) !== 'undefined') {
                        if (typeof(error) === 'undefined') {
                            callback.apply(this, [this, resp]);
                        }
                        else {
                            callback.apply(this, [this, resp, error]);
                        }
                    }
                    if (_DEBUG) console.log("doScan" + this.folders.length);

                    this.emit('inbox-scanned', resp, error)
                }
                catch (err) {
                    console.error(err);
                }
            });
        }
        catch (err) {
            console.error(err);
        }
    }
});

Signals.addSignalMethods(GmailImap.prototype);
