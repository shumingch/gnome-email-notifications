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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Sha = Me.imports.sha;
//const Sha =imports.sha;
const Signals = imports.signals;
const GLib = imports.gi.GLib;
const _DEBUG = true;

const OAuth = function (account, method, service) {
    this._init(account, method, service);
};
OAuth.prototype = {
    _init: function (account, service, method) {
        try {
            if (_DEBUG) global.log('Enter oauth init');
            if (_DEBUG) global.log('Account: ' + account);
            this.account = account;
            this.method = typeof(method) !== 'undefined' ? method : "GET";
            this.service = service;
            this.oAuth = account.get_oauth2_based();
            if (_DEBUG) global.log('After oauth2Based');
            if (_DEBUG) global.log('OAuth: ' + account.get_account().id);
            this.oAcc = account.get_account();
            this.acc_token = this.oAuth.call_get_access_token_sync(null);
            this.oAuth_auth = "";
            this.error = null;
            this._makeStrings();
        }
        catch (e) {
            if (_DEBUG) global.log('Oauth Init error:', e.message, e.lineNumber);
        }
    },


    _initStrings: function () {
        this.oAuth_base = encodeURI(this.method) + "&" + encodeURIComponent(this.service) + "&";
        this.oAuth_req = this.method + " " + this.service + " ";

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
            this._initStrings();
            this._setNonce();
            let anames = ["oauth_consumer_key", "oauth_nonce", "oauth_signature_method", "oauth_timestamp", "oauth_token", "oauth_version"];
            let avalues = [this.oAuth.consumer_key, this.nonce, "HMAC-SHA1", this.timestamp, encodeURIComponent(this.acc_token[1]), "1.0"]
            let avalues1 = [this.oAuth.consumer_key, this.nonce, "HMAC-SHA1", this.timestamp, this.acc_token[1], "1.0"]
            for (let i = 0; i < anames.length; i++) {
                this.oAuth_base += encodeURIComponent(( i > 0 ? "&" : "") + anames[i] + "=" + avalues[i]);
                this.oAuth_req += anames[i] + "=\"" + avalues1[i] + "\",";
                this.oAuth_auth += anames[i] + "=\"" + avalues1[i] + "\",";
            }
            //if (_DEBUG) global.log("Oauth Signature base:" + this.oAuth_base);

            this.oAuth_sigKey = encodeURI(this.oAuth.consumer_secret) + "&" + encodeURI(this.acc_token[2]);
            //if (_DEBUG) global.log("Oauth Signature key:" + this.oAuth_sigKey);

            //now hmac sha-1 signature base with key
            let shaObj = new jsSHA(this.oAuth_base, "ASCII");
            let hmac = shaObj.getHMAC(this.oAuth_sigKey, "ASCII", "SHA-1", "B64");
            //if (_DEBUG) global.log("Oauth Signature hmac:" + hmac);

            this.oAuth_req += "oauth_signature=\"" + hmac + "\"";
            this.oAuth_auth += "oauth_signature=\"" + hmac + "\"";

            //if (_DEBUG) global.log("auth_req:" + this.oAuth_req);

            if (_DEBUG) global.log('user=' + this.oAcc.presentation_identity + String.fromCharCode(1) + 'auth=Bearer ' + this.acc_token[1] + ' ' + String.fromCharCode(1) + String.fromCharCode(1));

            this.oAuth_str = GLib.base64_encode('user=' + this.oAcc.presentation_identity + String.fromCharCode(1) + 'auth=Bearer ' + this.acc_token[1] + ' ' + String.fromCharCode(1) + String.fromCharCode(1));
            //this.oAuth_str=GLib.base64_encode('user={'+this.oAcc.presentation_identity+"}"+String.fromCharCode(1)+'auth=Bearer {'+this.acc_token[1]+'}'+String.fromCharCode(1)+String.fromCharCode(1));
            //if (_DEBUG) global.log("auth_str:" +this.oAuth_str);
            this.error = null;
        }

        catch (err) {
            global.log(err.message);
            this.emit('error', err);
            this.error = err;
        }

    }
};

try {
    Signals.addSignalMethods(OAuth.prototype);
}
catch (err) {
    global.log(err.message);
}
