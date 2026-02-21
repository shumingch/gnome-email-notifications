/*
 * Copyright (c) 2017 Gnome Email Notifications contributors
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
/* eslint-disable jsdoc/require-param-type */
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import {OutlookScanner} from './OutlookScanner.js';
import {GmailScanner} from './GmailScanner.js';
import {GraphScanner} from './GraphScanner.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Scans an email account of any supported type using online APIs
 */
export class InboxScanner {
    /**
     * Creates a new scanner using a Gnome Online Account
     *
     * @param {object} account - Gnome Online Account
     * @param {Conf} config - the extension configuration
     * @param {number} [timeout=30] - the request timeout in seconds (optional, default is 1 second)
     */
    constructor(account, config, timeout = 30) {
        this._config = config;

        this._account = account;
        this._mailbox = account.get_account().presentation_identity;
        this._provider = this._account.get_account().provider_type;
        this._scanner = this._createScanner();
        this._sess = new Soup.Session();
        this._sess.set_timeout(timeout);
    }

    /**
     * Scans the inbox and returns a callback
     *
     * @param {function(Error, Array=, object=)} callback
     */

    scanInbox(callback) {
        const msg = Soup.Message.new('GET', this._scanner.getApiURL());
        this._getCurrentToken(token => {
            msg.request_headers.append('Authorization', `Bearer ${token}`);
            if (this._provider === 'windows_live')
                msg.request_headers.append('X-AnchorMailbox', this._mailbox);

            this._sess.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (sess, result) => {
                try {
                    const bytes = sess.send_and_read_finish(result);

                    if (msg.get_status() === 200) {
                        const decoder = new TextDecoder('utf-8');
                        const body = decoder.decode(bytes.get_data());
                        const folders = this._scanner.parseResponse(body, callback);
                        callback(null, folders, this._account);
                    } else {
                        const decoder = new TextDecoder('utf-8');
                        const body = decoder.decode(bytes.get_data());
                        const reason = msg.get_reason_phrase();
                        throw new Error(`Status ${msg.get_status()}: ${reason}\nBody: ${body}`);
                    }
                } catch (e) {
                    callback(e);
                }
            });
        });
    }

    /**
     * Create a new scanner chosen by the current provider
     *
     * @returns {GmailScanner|OutlookScanner} the scanner created
     * @private
     */
    _createScanner() {
        switch (this._provider) {
        case 'google':
            return new GmailScanner(this._mailbox, this._config);
        case 'windows_live':
            return new OutlookScanner();
        case 'ms_graph':
            return new GraphScanner();
        default:
            throw new Error('Provider type not found');
        }
    }

    /**
     * Returns the most recent auth token for the current Gnome Online Account
     *
     * @param callback - a callback that is called with the token as a parameter
     * @returns {string} the auth token
     * @private
     */
    _getCurrentToken(callback) {
        this._account.get_oauth2_based().call_get_access_token(null, (proxy, asyncResult) => {
            try {
                const [, token] = this._account.get_oauth2_based().call_get_access_token_finish(asyncResult);
                callback(token);
            } catch (err) {
                if (!err.message.includes('Goa.Error.Failed')) {
                    const message = _('Failed to get Authorization for {0}');
                    Main.notifyError('Gnome Email Notifications', message.replace('{0}', this._mailbox));
                }
                const prefix = '[Gnome Email Notifications] ';
                console.error(prefix + err);
            }
        });
    }

    /**
     * Aborts all network requests and cleans up
     */
    destroy() {
        if (this._sess)
            this._sess.abort();
    }
};
