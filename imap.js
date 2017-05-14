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
 * Author: Adam Jabłoński <jablona123@gmail.com>
 *
 */
const Me = imports.misc.extensionUtils.getCurrentExtension();
try {
    const Gio = imports.gi.Gio;
}
catch (err) {
    global.log("Soup import error:" + err.message);
}
const Signals = imports.signals;
const Unicode = Me.imports.unicode;
const BigInteger = Me.imports.biginteger;
const Lang = imports.lang;
const _DEBUG = false;
function ImapMessage() {
    this._init();
}
ImapMessage.prototype = {
    _init: function () {
        this.from = "";
        this.subject = "";
        this.date = "";
        this.id = 0;
        this.link = "";
        this.safeid = "";
        this.icontype = "gmail-icon32.png"
    },
    set: function (prop, value) {
        switch (prop.toLowerCase()) {
            case "from":
                this.from = value;
                break;
            case "link":
                this.link = value;
                break;
            case "id":
                this.id = value;
                break;
            case "subject":
                this.subject = value;
                break;
            case "safeid":
                this.safeid = value;
                break;
            case "date":
                this.date = value;
                break;
        }
    }
};
const Imap = new Lang.Class({
    Name: 'Imap',
    _init: function (conn) {
        this._conn = conn;
        this.authenticated = false;
        this.folders = [];
    },
    _gen_tag: function () {

        let tag = "";
        for (let i = 0; i < 5; i++) tag += Math.floor(Math.random() * 10).toString();

        /*
         let tag=("00000"+_gtag.toString()).right(5);
         _gtag += 1;
         */

        return tag;

    },
    _commandOK: function (aResp) {
        try {
            let ret = false;
            if (aResp !== null) {
                for (let i = 0; i < aResp.length; i++) {
                    if (aResp[i].search(/^[0-9]{5} OK.*$/) > -1) {
                        ret = true;
                        break;
                    }

                }
                return ret;
            }
            else {
                return false;
            }
        }
        catch (err) {
            global.log('_CommmandOK error:' + err.message);
        }
    },
    _readBuffer: function (tag, is_init, decode, callback, read, i) {
        is_init = typeof (is_init) !== 'undefined' ? is_init : false;
        decode = typeof (decode) !== 'undefined' ? decode : true;
        if (typeof(read) === 'undefined') {
            if (_DEBUG) global.log("initializing array .. " + i);
            read = [];
            i = 0;
        }
        else {
            i++
        }

        if (_DEBUG) global.log("Reading buffer .. " + i);
        this._conn.inputStream.read_line_async(0, null, (stream, result) => {
                if (_DEBUG) global.log("Finishing read .. ");
                let buff = this._conn.inputStream.read_line_finish(result);
                if (_DEBUG) global.log(buff);
                if (buff === null) global.log("Buffer null!");
                read[i] = (String(buff[0])).substr(0, buff[0].length - 1);
                if (decode) {
                    let matches = read[i].match(/&.*-/g);
                    if (matches !== null) {
                        for (let j = 0; j < matches.length; j++) {
                            let dec = GLib.base64_decode(matches[j].substr(1, matches[j].length - 2) + "=" + (matches[j].length % 2 === 0 ? "=" : ""));
                            let us = "";
                            for (let k = 0; k < dec.length; k += 2) {
                                us += String.fromCharCode(dec[k] * 256 + dec[k + 1]);
                            }
                            read[i] = read[i].replace(matches[j], us);
                        }
                    }
                }
                if ((tag.length > 0 && read[i].substr(0, tag.length) === tag) || (is_init) || read[i].substr(0, 5) === '* BAD') {

                    if (typeof(callback) !== 'undefined') {
                        callback.apply(this, [this, read]);
                    }
                    this.emit('buffer-ready', read);

                } else {
                    this._readBuffer(tag, is_init, decode, callback, read, i);
                }

            },
            null);
    },
    _logout: function () {
        if (this.connected) {
            let tag = this._gen_tag();
            this._output_stream.put_string(tag + " LOGOUT" + _newline, null);
            this._readBuffer(tag, false, true, (oImap, resp) => {
                if (_DEBUG) {
                    for (let i = 0; i < resp.length; i++) global.log(resp[i]);
                    this.emit('logged out', resp);
                }
            });
        }
    },
    _command: function (cmd, decode, callback) {
        decode = typeof (decode) !== 'undefined' ? decode : true;
        if (_DEBUG) global.log("Entering Command ..");
        let tag = this._gen_tag();
        if (_DEBUG) global.log("Sending .. " + tag + " " + cmd);

        //if (this._conn.outputStream.put_string(tag+" CAPABILITIES"+this._conn.newline,null))
        if (this._conn.outputStream.put_string(tag + " " + cmd + this._conn.newline, null)) {
            this._readBuffer(tag, false, decode, (oImap, resp) => {
                if (_DEBUG) global.log("Entering callback .. ");
                if (_DEBUG) {
                    for (let i = 0; i < resp.length; i++) global.log("< " + resp[i]);
                }
                if (typeof(callback) !== 'undefined') {
                    if (_DEBUG) global.log("Calling callback .. ");
                    callback.apply(this, [this, resp]);
                }
            });
        }
        else {
            throw new Error('Imap command: cannot put command');
        }
    },
    _scanFolder: function (folder, callback) {
        try {
            this.folders = [];
            this._command("CAPABILITY", true, () => {

                this._command("EXAMINE " + folder, true, (oImap, resp) => {
                    if (_DEBUG) {
                        for (let i = 0; i < resp.length; i++) global.log("< " + resp[i]);
                    }
                    //get number of total and unseen
                    let sTotal = 0;
                    let sUnseen = 0;
                    for (let i = 0; i < resp.length; i++) {
                        let tmatch = resp[i].match(/\* ([0-9]+) EXISTS.*/);
                        if (tmatch !== null) {
                            if (_DEBUG) global.log("-- TOTAL " + tmatch[1]);
                            sTotal = parseInt(tmatch[1]);
                        }

                    }
                    try {
                        let messages = [];

                        this._command("SEARCH UNSEEN", true, (oImap, resp) => {

                            let xmatches = resp[0].match(/(([0-9]+[ ]*)+){1}/g);
                            if (xmatches !== null) {
                                if (_DEBUG) global.log("xmatches" + xmatches);
                                sUnseen = xmatches[0].split(" ").length;
                                if (_DEBUG) {
                                    for (let l = 0; l < xmatches.length; l++) {
                                        global.log(xmatches[l]);
                                    }
                                }
                                if (_DEBUG) global.log("FETCH");

                                this._command("FETCH " + xmatches[0].replace(/ /g, ",") + " (FLAGS BODY.PEEK[HEADER.FIELDS (DATE FROM SUBJECT)] X-GM-MSGID)", false, (oImap, presp) => {
                                    try {
                                        if (_DEBUG) {
                                            for (let d = 0; d < presp.length; d++) {
                                                global.log("Line " + d.toString() + ": " + presp[d]);
                                                global.log("char " + d.toString() + ": " + presp[d].charCodeAt(0));
                                            }
                                        }
                                        let fline = "";
                                        let part = "";
                                        let m;
                                        for (let l = 0; l < presp.length; l++) {

                                            if (_DEBUG) global.log(Unicode.unescapeFromMime(presp[l]));
                                            let line = Unicode.unescapeFromMime(presp[l]);

                                            let pmatches = line.match(/^(From|Date|Subject){1}\s*[:]{1}(.*)$/i);
                                            if (pmatches !== null) {

                                                if (_DEBUG) global.log("Match! fline:" + fline);
                                                if (fline !== "") {
                                                    m.set(part, fline);
                                                    if (_DEBUG) global.log("Push!");
                                                }
                                                part = pmatches[1];
                                                fline = pmatches[2];
                                            }
                                            else {

                                                if (_DEBUG) {
                                                    global.log("No match!, line:" + line);
                                                    global.log("No match!, code:" + line.substr(0, 1).charCodeAt(0));
                                                }
                                                if (presp[l].substr(0, 1) === " ") {
                                                    if (_DEBUG) global.log("Space !");
                                                    fline += line;
                                                    continue;
                                                }

                                                if (presp[l].substr(0, 1) === "*") {
                                                    if (_DEBUG) global.log("Star!");
                                                    if (fline !== "") {
                                                        m.set(part, fline);
                                                        messages.push(m);
                                                    }

                                                    m = new ImapMessage();
                                                    let idmatches = line.match(/^\*\s([0-9]+)\sFETCH\s+\(X-GM-MSGID\s([0-9]+)\s.+/);
                                                    if (idmatches !== null) {
                                                        try {
                                                            m.set("id", parseInt(idmatches[1]));
                                                            if (_DEBUG) global.log(idmatches[2]);
                                                            let ba = BigInteger.BigInteger.parse(idmatches[2]);
                                                            m.set("link", 'http://mail.google.com/mail?account_id=' + this._conn._oAccount.get_account().identity + '&message_id=' + ba.toString(16).toLowerCase() + '&view=conv&extsrc=atom');
                                                        }
                                                        catch (err) {
                                                            global.log(err.message);
                                                        }
                                                    }

                                                    fline = "";
                                                    continue;
                                                }
                                                if (fline !== "") {
                                                    m.set(part, fline);
                                                    messages.push(m);
                                                    fline = ""
                                                }
                                            }

                                        }
                                        this.folders.push(new Object({
                                            name: folder,
                                            encoded: folder,
                                            messages: sTotal,
                                            unseen: sUnseen,
                                            list: messages
                                        }));
                                        if (typeof (callback) !== 'undefined') {
                                            callback.apply(this, [this, messages])
                                        }
                                        this.emit('folder-scanned', folder);
                                    }
                                    catch (err) {
                                        if (typeof (callback) !== 'undefined') {
                                            callback.apply(this, [this, null, err])
                                        }

                                    }
                                });	//FETCH
                            }
                            else {
                                this.folders.push(new Object({
                                    name: folder,
                                    encoded: folder,
                                    messages: sTotal,
                                    unseen: sUnseen,
                                    list: messages
                                }));
                                if (typeof (callback) !== 'undefined') {
                                    callback.apply(this, [this, messages])
                                }
                                this.emit('folder-scanned', folder);
                            }

                        });
                    }
                    catch (err) {
                        if (typeof (callback) !== 'undefined') {
                            callback.apply(this, [this, null, err])
                        }
                    }
                })
            });
        }
        catch (err) {
            if (typeof (callback) !== 'undefined') {
                callback.apply(this, [this, null, err])
            }
        }
    },
    _scan: function (inboxOnly, callback) {
        inboxOnly = typeof (inboxOnly) !== 'undefined' ? inboxOnly : true;
        global.log("scan entry ..");
        if (this.authenticated) {
            global.log("weel authenticated ..");
            try {
                this._command("EXAMINE INBOX", true, (oImap, resp) => {
                    if (_DEBUG) {
                        for (let i = 0; i < resp.length; i++) global.log("< " + resp[i]);
                    }
                    this._command("LIST \"\" *", false, (oImap, resp) => {
                        if (_DEBUG) {
                            for (let i = 0; i < resp.length; i++) global.log(resp[i]);
                        }
                        let sumMess = 0;
                        let sumUnseen = 0;
                        // for every folder
                        for (let i = 0; i < resp.length; i++) {
                            let matches = inboxOnly ? resp[i].match(/("INBOX")$/g) : resp[i].match(/("[^".]*")$/g);
                            if (matches !== null) {
                                this._command("STATUS " + matches[0] + " (MESSAGES UNSEEN)", true, function (oImap, cmdstatus) {
                                    if (this._commandOK(cmdstatus)) {
                                        for (let k = 0; k < cmdstatus.length - 1; k++) {
                                            let cmdmatches = cmdstatus[k].match(/^\* STATUS "(.*)" \(MESSAGES ([0-9]*) UNSEEN ([0-9]*)\)$/);
                                            if (cmdmatches !== null) {
                                                if (cmdmatches[1].toUpperCase().search(/^\[GMAIL|IMAP\]/) === -1) {
                                                    sumMess += parseInt(cmdmatches[2]);
                                                    sumUnseen += parseInt(cmdmatches[3]);
                                                    if (_DEBUG) global.log("SEARCH");
                                                    //SEARCH UNSEEN
                                                }
                                            }
                                        }
                                    }
                                }); 	//STATUS MESSAGES UNSEEN
                                //
                                if (inboxOnly) break;
                            }
                        }
                    }); //LIST
                }); //EXAMINE INBOX

            }
            catch (err) {
                return [false, err.message];
            }
            if (typeof(callback) !== 'undefined') {
                callback.apply(this, [this]);
            }
        }
        return [false, "Not authenticaed or connected"];
    },

});
Signals.addSignalMethods(Imap.prototype);
