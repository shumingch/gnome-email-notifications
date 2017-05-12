/*
 * Copyright (c) 2012 Adam Jabłooński
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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const TlsConn = Me.imports.tlsconnection;
const console = Me.imports.console.console;

const GmailConnection = function () {
    this._init.apply(this, arguments);
};

GmailConnection.prototype = {
    __proto__: TlsConn.TlsConnection.prototype,
    _init: function (account) {
        try {
            let sprovider = account.get_account().provider_name.toUpperCase();
            if (sprovider !== "GOOGLE" && sprovider !== "MICROSOFT ACCOUNT") {
                throw new Error('This is not Google/Windows Account')
            }
            this._oAccount = account;
            if (_DEBUG) console.log("Creating gmail conn .." + this._oAccount.get_account().id);
            if (_DEBUG) console.log("Creating gmail conn .." + this._oAccount.get_account().identity);
            this._oMail = this._oAccount.get_mail();
            if (_DEBUG) console.log("Omailuse tls: " + this._oMail.imap_use_tls);
            if (_DEBUG) console.log("Omailuse host: " + this._oMail.imap_host);
            TlsConn.TlsConnection.prototype._init.call(this, this._oMail.imap_host, 993, this._oMail.imap_use_tls)
        }
        catch (err) {
            console.log(err);
        }
    }

};
