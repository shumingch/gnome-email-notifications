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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const TlsConn = Me.imports.tlsconnection;
const Imap = Me.imports.imap;
const OAuth = Me.imports.oauth;
//const TlsConn=imports.tlsconnection;
//const Imap = imports.imap;
//const OAuth=imports.oauth;
const GLib = imports.gi.GLib;
const Signals = imports.signals;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const XML = Me.imports.rexml;
const sess = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(sess, new Soup.ProxyResolverDefault());


try {
    const Goa = imports.gi.Goa;
}
catch (err) {
    global.log("Goa import error:" + err.message);
}

const _DEBUG = true;


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
            if (_DEBUG) global.log("Creating gmail conn .." + this._oAccount.get_account().id);
            if (_DEBUG) global.log("Creating gmail conn .." + this._oAccount.get_account().identity);
            this._oMail = this._oAccount.get_mail();
            if (_DEBUG) global.log("Omailuse tls: " + this._oMail.imap_use_tls);
            if (_DEBUG) global.log("Omailuse host: " + this._oMail.imap_host);
            TlsConn.TlsConnection.prototype._init.call(this, this._oMail.imap_host, 993, this._oMail.imap_use_tls)
        }
        catch (err) {
            global.log("gmailConnection.proto:" + err.message);
        }
    }

};

//dummy class to emulate imap;

function GmailHttps() {
    this._init.apply(this, arguments);

}

GmailHttps.prototype = {
    _init: function (account) {
        this.connected = true;
        this._oAccount = account;
    },
    _disconnect: function () {
        this.connected = false;
        this.emit('disconnected');
    }
};

Signals.addSignalMethods(GmailHttps.prototype);

function GmailFeed() {
    this._init.apply(this, arguments);
}

GmailFeed.prototype = {
    _init: function (conn) {
        this.authenticated = true;
        this._conn = new GmailHttps(conn);
        this.folders = [];
    },
    scanInbox: function (callback) {
        try {
            if (_DEBUG) global.log('Entering scanInbox safe:');
            let sprovider = this._conn._oAccount.get_account().provider_name.toUpperCase();
            if (_DEBUG) global.log('feed provider:' + sprovider);

            let folder = (sprovider === "GOOGLE" ? 'inbox' : 'messages');
            let host = (sprovider === "GOOGLE" ? 'mail.google.com' : 'outlook.office.com');
            let service = (sprovider === "GOOGLE" ? 'https://' + host + "/mail/feed/atom/" + folder : 'https://' + host + "/api/beta/me/" + folder );
            let oAuth = new OAuth.OAuth(this._conn._oAccount, service);
            if (_DEBUG) global.log('service:' + service);
            //let sess = new Soup.SessionAsync();
            let msg = Soup.Message.new("GET", service);
            if (_DEBUG) global.log('auth req', oAuth.oAuth_auth);
            msg.request_headers.append('Authorization' + (sprovider === "GOOGLE" ? '' : ''), (sprovider === "GOOGLE" ? 'OAuth ' : 'Bearer ') + oAuth.acc_token[1]);
            if (_DEBUG) global.log((sprovider === "GOOGLE" ? 'OAuth ' : 'Bearer ') + oAuth.acc_token[1]);
            //msg.request_headers.append('host',host);
            if (_DEBUG) global.log('Queuing message:');
            const _call = callback;
            const _folder = folder;
            sess.queue_message(msg, Lang.bind(this, (sess, msg, callback) => {
                if (_DEBUG) global.log('Message status:' + msg.status_code);
                if (msg.status_code === 200) {
                    try {
                        this.folders = [];
                        let messages = [];
                        let xmltx = msg.response_body.data.substr(msg.response_body.data.indexOf('>') + 1).replace('xmlns="http://purl.org/atom/ns#"', '');
                        if (_DEBUG) global.log('xml created:' + xmltx);
                        let oxml = new XML.REXML(xmltx);

                        if (_DEBUG) global.log('xml name:' + oxml.rootElement.name);
                        let i = 0;
                        let cnt = 0;
                        while (typeof(oxml.rootElement.childElements[i]) !== 'undefined') {
                            if (_DEBUG) global.log('child name:' + oxml.rootElement.childElements[i].name);
                            if (oxml.rootElement.childElements[i].name === 'entry') {
                                let entry = oxml.rootElement.childElements[i];
                                let em = new Imap.ImapMessage();
                                em.from = entry.childElement('author').childElement('name').text + ' <' + entry.childElement('author').childElement('email').text + '>';
                                if (_DEBUG) global.log('From::' + em.from);
                                em.id = i;
                                em.subject = entry.childElement('title').text;
                                if (_DEBUG) global.log('N Title:' + entry.childElement('title').text);
                                if (_DEBUG) global.log('Message found:' + em.subject);
                                em.date = entry.childElement('modified').text;
                                if (_DEBUG) global.log('date created:' + em.date.toString());
                                //todo
                                em.link = entry.childElement('link').attribute('href').replace(/&amp;/g, '&');
                                em.safeid = entry.childElement('id').text;
                                messages.push(em);
                                cnt++;
                                let j = 0;
                                /*
                                 if (entry.childElement('contributor') != null) {
                                 while (typeof(entry.childElement('contributor').childElements[j])!='undefined')
                                 {
                                 let centry = entry.childElement('contributor').childElements[j];
                                 let cm= new Imap.ImapMessage();
                                 cm.from=centry.childElement('name').text+' <'+centry.childElement('email').text+'>';
                                 if (_DEBUG) global.log('From contrib::'+cm.from);
                                 cm.id = i;
                                 cm.subject=entry.childElement('title').text;
                                 cm.date=entry.childElement('modified').text;
                                 //TODO
                                 cm.link=entry.childElement('link').attribute('href');
                                 cm.safeid=entry.childElement('id').text;
                                 messages.push(cm);
                                 j++;
                                 cnt++;
                                 }
                                 }
                                 */
                            }
                            i++;
                        }
                        if (_DEBUG) global.log('Before push');
                        this.folders.push(new Object({
                            name: 'inbox',
                            encoded: 'inbox',
                            messages: cnt,
                            unseen: cnt,
                            list: messages
                        }));
                        if (_DEBUG) global.log('Before emit');
                        this.emit('inbox-fed', folder);
                        if (typeof(callback) !== 'undefined') callback.apply(this, [this, folder]);
                    }
                    catch (err) {
                        global.log('Feed scaninbox queue message Error:' + err.message);
                        this.emit('inbox-fed', folder, err);
                        if (typeof(callback) !== 'undefined') callback.apply(this, [this, folder, err]);
                    }
                }
                else {
                    if (_DEBUG) global.log('Message body:' + msg.response_body.data);
                    throw new Error('Google connection Status: ' + msg.status + ' ' + msg.message_body.data);
                }


            }), callback);

        }
        catch (err) {
            global.log('Feed scaninbox Error:', err.message);
            this.emit('inbox-fed', folder, err);
            if (typeof(callback) !== 'undefined') callback.apply(this, [this, folder, err]);
        }

    }
};

Signals.addSignalMethods(GmailFeed.prototype);

function GmailImap() {
    this._init.apply(this, arguments);
}
GmailImap.prototype = {
    __proto__: Imap.Imap.prototype,
    _init: function (conn) {
        try {
            if (conn instanceof GmailConnection) {
                Imap.Imap.prototype._init.call(this, conn);
            }
            // must be goa object (account)
            else {
                let oconn = new GmailConnection(conn);
                Imap.Imap.prototype._init.call(this, oconn);
                if (_DEBUG) global.log("Imap created: .." + this._conn._oAccount.get_account().id);
            }
            this.authenticated = false;
            this._conn.connect('disconnected', Lang.bind(this, () => {
                this.authenticated = false;
            }))
        }
        catch (err) {
            global.log("gmailImap.proto:" + err.message);
        }
    },
    readGreeting: function (callback) {
        this._readBuffer("", true, true, Lang.bind(this, function (oImap, resp) {
            if (resp[0].substr(2, 2) === "OK") this.gmailConnected = true;
            this.emit('greeting-ready');
            if (typeof(callback) !== 'undefined') {
                callback.apply(this, [this, resp]);
            }
        }));

    },

    authenticate: function (account, service, callback) {

        try {
            if (_DEBUG) global.log('Entering authenticate...');
            if (this._conn.connected) {
                this._doauthenticate(account, service, callback)
            }
            else {
                if (_DEBUG) global.log('Not Connected...');
                const _acc = account;
                const _svr = service;
                const _call = callback;
                this._conn._connect(Lang.bind(this, () => {
                    this._doauthenticate(_acc, _svr, _call)
                }));
            }
        }
        catch (err) {
            global.log("authenticate: " + err.message)
        }
    },
    _doauthenticate: function (account, service, callback) {
        try {
            if (_DEBUG) global.log('Entering _doauthenticate...');
            let oAuth = new OAuth.OAuth(account, service);
            let auth_str = oAuth.oAuth_str;
            //if (_DEBUG) global.log('auth_string: '+auth_str);

            this._command("AUTHENTICATE XOAUTH2 " + auth_str + String.fromCharCode(13) + String.fromCharCode(10), false, Lang.bind(this, function (oGIMap, resp) {
                    if (_DEBUG) {
                        for (let i = 0; i < resp.length; i++) global.log(resp[i]);
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
                })
            );
        }
        catch (err) {
            global.log("_doAuthenticate: " + err.message)
        }
    },
    scanInbox: function (callback) {

        try {
            if (_DEBUG) global.log('scanInbox: Imap mode');
            if (this.authenticated) {
                this._doScanInbox(callback);
            }
            else {
                if (_DEBUG) global.log('scanInbox: not authenticated');
                const _call = callback;

                this.authenticate(this._conn._oAccount, "https://mail.google.com/mail/b/" + this._conn._oMail.imap_user_name + "/imap/",

                    Lang.bind(this, () => {
                        this._doScanInbox(_call);
                    }))
            }
        }
        catch (err) {
            global.log("scanInbox: " + err.message)
        }

    },

    _doScanInbox: function (callback, i) {
        try {
            if (_DEBUG) global.log("doScan entry");
            this._scanFolder("INBOX", Lang.bind(this, function (oImap, resp, error) {
                if (_DEBUG) global.log("doScan callback i=");
                try {
                    if (typeof(callback) !== 'undefined') {
                        if (typeof(error) === 'undefined') {
                            callback.apply(this, [this, resp]);

                        }
                        else {

                            callback.apply(this, [this, resp, error]);
                        }

                    }
                    if (_DEBUG) global.log("doScan" + this.folders.length);

                    this.emit('inbox-scanned', resp, error)
                }
                catch (err) {
                    global.log("doScan :" + err.message)
                }
            }));
        }
        catch (err) {
            global.log("_doscanInbox: " + err.message)
        }
    }
};

Signals.addSignalMethods(GmailImap.prototype);
