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
const console = Me.imports.console.console;
const OutlookScanner = Me.imports.OutlookScanner.OutlookScanner;
const _DEBUG = false;


const GmailScanner = new Lang.Class({
    Name: 'InboxScanner',
    _init: function () {
    },
    parseResponse: function (body) {
        const folders = [];
        const messages = [];
        const xmltx = body.substr(body.indexOf('>') + 1).replace('xmlns="http://purl.org/atom/ns#"', '');
        const oxml = new XML.REXML(xmltx);

        if (_DEBUG) console.log('xml name:' + oxml.rootElement.name);
        let i = 0;
        while (typeof(oxml.rootElement.childElements[i]) !== 'undefined') {
            if (_DEBUG) console.log('child name:' + oxml.rootElement.childElements[i].name);
            if (oxml.rootElement.childElements[i].name === 'entry') {
                let entry = oxml.rootElement.childElements[i];
                let em = {
                    from: entry.childElement('author').childElement('name').text + " <" + entry.childElement('author').childElement('email').text + ">",
                    subject: entry.childElement('title').text,
                    date: entry.childElement('modified').text,
                    link: entry.childElement('link').attribute('href').replace(/&amp;/g, '&'),
                    id: entry.childElement('id').text
                };
                messages.push(em);
            }
            i++;
        }
        folders.push({
            name: 'inbox',
            list: messages
        });
        return folders;
    },
    getApiURL: function () {
        return "https://mail.google.com/mail/feed/atom/inbox";
    }
});
