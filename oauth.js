/*
 * Copyright (c) 2012 Adam Jablonski
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
"use strict";
const Signals = imports.signals;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const console = Me.imports.console.console;
const _DEBUG = true;

const OAuth = function (account, method, service) {
    this._init(account, method, service);
};
OAuth.prototype = {
    _init: function (account) {
        try {
            if (_DEBUG) console.log('Account: ' + account);
            this.oAuth = account.get_oauth2_based();
            if (_DEBUG) console.log('OAuth: ' + account.get_account().id);
            this.oAcc = account.get_account();
            this.acc_token = this.oAuth.call_get_access_token_sync(null);
            this.oAuth_auth = "";
            this.error = null;
            this._makeStrings();
        }
        catch (err) {
            console.error(err);
        }
    },
    _setNonce: function () {
        this.nonce = "";
        for (let j = 1; j <= 18; j++) this.nonce += Math.floor(Math.random() * 11).toString();
        let dt = new Date();
        this.timestamp = (dt.getTime() / 1000).toFixed(0).toString();
    },
    _makeStrings: function () {

        //https://mail.google.com/mail/b/"+_email+"/imap/
        try {
            this._setNonce();
            let anames = ["oauth_consumer_key", "oauth_nonce", "oauth_signature_method", "oauth_timestamp", "oauth_token", "oauth_version"];
            let avalues1 = [this.oAuth.consumer_key, this.nonce, "HMAC-SHA1", this.timestamp, this.acc_token[1], "1.0"]
            for (let i = 0; i < anames.length; i++) {
                this.oAuth_auth += anames[i] + "=\"" + avalues1[i] + "\",";
            }

            if (_DEBUG) console.log('user=' + this.oAcc.presentation_identity + String.fromCharCode(1) + 'auth=Bearer ' + this.acc_token[1] + ' ' + String.fromCharCode(1) + String.fromCharCode(1));

            this.oAuth_str = GLib.base64_encode('user=' + this.oAcc.presentation_identity + String.fromCharCode(1) + 'auth=Bearer ' + this.acc_token[1] + ' ' + String.fromCharCode(1) + String.fromCharCode(1));
            this.error = null;
        }

        catch (err) {
            console.error(err);
            this.emit('error', err);
            this.error = err;
        }
    }
};

try {
    Signals.addSignalMethods(OAuth.prototype);
}
catch (err) {
    console.error(err);
}
