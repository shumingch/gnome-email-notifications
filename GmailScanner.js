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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const XML = Me.imports.rexml;
const console = Me.imports.console.console;

/**
 * Scans Gmail atom api for unread emails.
 */
var GmailScanner = class {
    /**
     * Creates a scanner with the given config
     * @param {string} mailbox - email account in the form "email@gmail.com"
     * @param {Conf} config - the extension configuration
     */
    constructor(mailbox, config) {
        this._mailbox = mailbox;
        this._config = config;
    }

    /**
     * Parses an html response containing unread emails
     * @param {string} body - html response
     * @returns {Array} - list of parsed folders
     */
    parseResponse(body) {
        const folders = [];
        const messages = [];
        const xmltx = body.substr(body.indexOf('>') + 1).replace('xmlns="http://purl.org/atom/ns#"', '');
        const root = new XML.REXML(xmltx).rootElement;
        for (let i = 0; typeof (root.childElements[i]) !== 'undefined'; i++) {
            const entry = root.childElements[i];
            if (entry.name === 'entry') {
                messages.push({
                    from: GmailScanner._decodeFrom(entry.childElement('author')),
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
    }

    /**
     * Returns the URL for Google's Gmail API
     * @returns {string} - the URL
     */
    getApiURL() {
        const gmail_system_label = this._config.getGmailSystemLabel();
        const apiurl = "https://mail.google.com/mail/feed/atom/" + encodeURIComponent(gmail_system_label);
        return apiurl;
    }

    /**
     * Extracts the link used to navigate to the email.
     * @param {XML} linkElement - the link element to process
     * @returns {string} the URL pointing the the unread email
     * @private
     */
    _processLinkElement(linkElement) {
        const url = linkElement.attribute('href').replace(/&amp;/g, '&');
        return url + "&authuser=" + this._mailbox;
    }

    /**
     * Converts the author element to a readable string
     * @param {XML} authorElement - the element containing "from" information
     * @returns {string} - the string
     * @private
     */
    static _decodeFrom(authorElement) {
        return authorElement.childElement('name').text + " <" + authorElement.childElement('email').text + ">";
    }
};
