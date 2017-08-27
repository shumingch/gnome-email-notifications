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

/**
 * Scans Outlook json api for unread emails.
 * @type {Lang.Class}
 */
const OutlookScanner = new Lang.Class({
    Name: 'OutlookScanner',
    _init: function () {
    },
    /**
     * Parses a JSON response for unread emails
     * @param {string} body - JSON containing emails
     * @returns {Array} - a list of folders containing unread emails
     */
    parseResponse: function (body) {
        const folders = [];
        const messages = [];
        const parsedBody = JSON.parse(body);
        const value = parsedBody.value;
        for (let entry of value) {
            messages.push({
                from: this._decodeFrom(entry.From),
                subject: entry.Subject,
                date: entry.ReceivedDateTime,
                link: entry.WebLink,
                id: entry.Id
            });
        }
        folders.push({
            name: 'inbox',
            list: messages,
            inboxURL: ""
        });
        return folders;
    },
    /**
     * Returns the Outlook API URL
     * @returns {string} - the URL
     */
    getApiURL: function () {
        return "https://outlook.office.com/api/v2.0/me/messages?$select=From,Subject,ReceivedDateTime,WebLink";
    },
    /**
     * Converts the 'from' object into a readable string
     * @param from - an object containing 'from' information
     * @returns {string} - the readable string
     * @private
     */
    _decodeFrom: function (from) {
        const email = from.EmailAddress;
        return email.Name + " <" + email.Address + ">";
    }
});
