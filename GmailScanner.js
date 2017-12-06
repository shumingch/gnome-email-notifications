/*
 * Copyright (c) 2012-2017 Gnome Email Notifications contributors
 *
 * Gnome Email Notifications Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gnome Email Notifications Extension is distributed in the hope that it will be useful, but
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

/**
 * Scans Gmail atom api for unread emails.
 * @class
 */
var GmailScanner = new Lang.Class({
    Name: 'GmailScanner',
    /**
     * Creates a scanner with the given config
     * @param {GmailConf} config - the configuration of the extension
     * @param {string} mailbox - email account in the form "email@gmail.com"
     * @private
     */
    _init: function (config, mailbox) {
        this._config = config;
        this._mailbox = mailbox;
    },
    /**
     * Parses an html response containing unread emails
     * @param {string} body - html response
     * @returns {Array} - list of parsed folders
     */
    parseResponse: function (body) {
        const folders = [];
        const messages = [];
        const xmltx = body.substr(body.indexOf('>') + 1).replace('xmlns="http://purl.org/atom/ns#"', '');
        const root = new XML.REXML(xmltx).rootElement;
        for (let i = 0; typeof(root.childElements[i]) !== 'undefined'; i++) {
            const entry = root.childElements[i];
            if (entry.name === 'entry') {
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
            list: messages
        });
        return folders;
    },
    /**
     * Returns the URL for Google's Gmail API
     * @returns {string} - the URL
     */
    getApiURL: function () {
        return "https://mail.google.com/mail/feed/atom/inbox";
    },
    /**
     * Adds the proper Gmail account number to the URL (e.g. mail.google.com/u/0) and unescapes XML characters
     * @param {XML} linkElement - the link element to process
     * @returns {string} the URL pointing the the unread email
     * @private
     */
    _processLinkElement: function (linkElement) {
        const url = linkElement.attribute('href').replace(/&amp;/g, '&');
        return url.replace("com/mail", "com/mail/u/" + this._getGmailAccountNumbers());
    },
    /**
     * Gets a dict of mailboxes to account numbers. Creates a new entry if needed.
     * @returns {Object.<string, number>} - the dict
     * @private
     */
    _getGmailAccountNumbers: function() {
        const accountNumberDict = this._config.getGmailAccountNumbers();
        if (accountNumberDict[this._mailbox] === undefined) {
            accountNumberDict[this._mailbox] = 0;
            this._config.setGmailAccountNumbers(accountNumberDict);
        }
        return accountNumberDict[this._mailbox];
    },
    /**
     * Converts the author element to a readable string
     * @param {XML} authorElement - the element containing "from" information
     * @returns {string} - the string
     * @private
     */
    _decodeFrom: function (authorElement) {
        return authorElement.childElement('name').text + " <" + authorElement.childElement('email').text + ">";
    }
});
