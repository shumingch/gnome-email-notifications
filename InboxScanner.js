/*
 * Copyright (c) 2017 Email Message Tray contributors
 *
 * Email Message Tray Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Email Message Tray Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */
"use strict";
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const XML = Me.imports.rexml;
const Soup = imports.gi.Soup;
const Sess = new Soup.SessionAsync();
const OutlookScanner = Me.imports.OutlookScanner.OutlookScanner;
const GmailScanner = Me.imports.GmailScanner.GmailScanner;

const InboxScanner = new Lang.Class({
    Name: 'InboxScanner',
    _init: function (conn) {
        this._conn = conn;
        this._account = conn.get_account();
        this.provider = this._account.provider_type;
        this._scanner = this._createScanner();
    },
    scanInbox: function (callback) {
        const msg = Soup.Message.new("GET", this._scanner.getApiURL());
        msg.request_headers.append('Authorization', 'Bearer ' + this._getCurrentToken());
        Sess.queue_message(msg, (sess, msg) => {
            const body = msg.response_body.data;
            if (msg.status_code === 200) {
                const folders = this._scanner.parseResponse(body, callback);
                callback(null, folders, this._conn);
            }
            else {
                const err = new Error('Error scanning inbox: code ' + msg.status_code);
                callback(err);
            }
        });
    },
    _createScanner: function () {
        switch (this.provider) {
            case "google":
                return new GmailScanner(this._acc_token, this._conn);
            case "windows_live":
                return new OutlookScanner(this._acc_token, this._conn);
        }
    },
    _getCurrentToken: function(){
        return this._conn.get_oauth2_based().call_get_access_token_sync(null)[1];
    }
});
