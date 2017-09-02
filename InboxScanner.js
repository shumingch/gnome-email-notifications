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

/**
 * Scans an email account of any supported type using online APIs
 * @class
 */
const InboxScanner = new Lang.Class({
    Name: 'InboxScanner',
    /**
     * Creates a new scanner using a Gnome Online Account
     * @param account - Gnome Online Account
     * @param {GmailConf} config - the extension configuration
     * @private
     */
    _init: function (account, config) {
        this._config = config;
        this._account = account;
        this._provider = this._account.get_account().provider_type;
        this._scanner = this._createScanner();
    },
    /**
     * A callback to execute after the GET request is complete
     * @callback requestCallback
     * @param {Error} err - any error that occurred
     * @param {Array} [folders] - a list of folders containing unread emails
     * @param [account] - the Gnome Online Account of the request
     */
    /**
     * Scans the inbox and returns a callback
     * @param {requestCallback} callback
     */
    scanInbox: function (callback) {
        const msg = Soup.Message.new("GET", this._scanner.getApiURL());
        msg.request_headers.append('Authorization', 'Bearer ' + this._getCurrentToken());
        Sess.queue_message(msg, (sess, msg) => {
            const body = msg.response_body.data;
            if (msg.status_code === 200) {
                const folders = this._scanner.parseResponse(body, callback);
                callback(null, folders, this._account);
            }
            else {
                const err = new Error('Status ' + msg.status_code + ': ' + msg.reason_phrase);
                callback(err);
            }
        });
    },
    /**
     * Create a new scanner chosen by the current provider
     * @returns {*} the scanner created
     * @private
     */
    _createScanner: function () {
        switch (this._provider) {
            case "google":
                return new GmailScanner(this._config);
            case "windows_live":
                return new OutlookScanner();
        }
    },
    /**
     * Returns the most recent auth token for the current Gnome Online Account
     * @returns {string} the auth token
     * @private
     */
    _getCurrentToken: function () {
        return this._account.get_oauth2_based().call_get_access_token_sync(null)[1];
    }
});
