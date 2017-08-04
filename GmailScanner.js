/*
 * Copyright (c) 2012-2017 Email Message Tray contributors
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


const GmailScanner = new Lang.Class({
    Name: 'GmailScanner',
    _init: function (config) {
        this._config = config;
    },
    parseResponse: function (body) {
        const folders = [];
        const messages = [];
        const xmltx = body.substr(body.indexOf('>') + 1).replace('xmlns="http://purl.org/atom/ns#"', '');
        const root = new XML.REXML(xmltx).rootElement;
        let inboxURL;

        for (let i = 0; typeof(root.childElements[i]) !== 'undefined'; i++) {
            const entry = root.childElements[i];
            if (entry.name === 'link') {
                inboxURL = this._processLinkElement(entry);
            }
            else if (entry.name === 'entry') {
                messages.push({
                    from: this._decodeFrom(entry.childElement('author')),
                    subject: entry.childElement('title').text,
                    date: entry.childElement('modified').text,
                    link: this._processLinkElement(entry.childElement('link')),
                    id: entry.childElement('id').text
                });
            }
        }
        folders.push({
            name: 'inbox',
            list: messages,
            inboxURL: inboxURL
        });
        return folders;
    },
    getApiURL: function () {
        return "https://mail.google.com/mail/feed/atom/inbox";
    },
    _processLinkElement: function (linkElement) {
        const url = linkElement.attribute('href').replace(/&amp;/g, '&');
        return url.replace("com/mail", "com/mail/u/" + this._config.getGmailAccountNumber());
    },
    _decodeFrom: function (authorElement) {
        return authorElement.childElement('name').text + " <" + authorElement.childElement('email').text + ">";
    }
});
