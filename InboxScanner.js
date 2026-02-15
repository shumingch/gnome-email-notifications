import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';
import { Console } from './console.js';
import { OutlookScanner } from './OutlookScanner.js';
import { GmailScanner } from './GmailScanner.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Scans an email account of any supported type using online APIs
 */
export class InboxScanner {
    /**
     * Creates a new scanner using a Gnome Online Account
     * @param account - Gnome Online Account
     * @param {Conf} config - the extension configuration
     * @param {number} [timeout=1] - the request timeout in seconds (optional, default is 1 second)
     */
    constructor(account, config, timeout = 30) {
        this._config = config;

        this._account = account;
        this._mailbox = account.get_account().presentation_identity;
        this._provider = this._account.get_account().provider_type;
        this._scanner = this._createScanner();
        this._sess = new Soup.Session();
        this._console = new Console();
        this._sess.set_timeout(timeout);
    }

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
    scanInbox(callback) {
        const msg = Soup.Message.new("GET", this._scanner.getApiURL());
        this._getCurrentToken(token => {
            msg.request_headers.append('Authorization', 'Bearer ' + token);
            if (this._provider === 'windows_live') {
                msg.request_headers.append('X-AnchorMailbox', this._mailbox);
            }
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
                        throw new Error('Status ' + msg.get_status() + ': ' + reason + '\nBody: ' + body);
                    }
                } catch (err) {
                    callback(err);
                }
            });
        });
    }

    /**
     * Create a new scanner chosen by the current provider
     * @returns {GmailScanner|OutlookScanner} the scanner created
     * @private
     */
    _createScanner() {
        switch (this._provider) {
            case 'google':
                return new GmailScanner(this._mailbox, this._config);
            case 'windows_live':
                return new OutlookScanner();
            default:
                throw new Error("Provider type not found");
        }
    }

    /**
     * Returns the most recent auth token for the current Gnome Online Account
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
                if (!err.message.includes("Goa.Error.Failed")) {
                    const message = _("Failed to get Authorization for {0}");
                    Main.notifyError("Gnome Email Notifications", message.replace("{0}", this._mailbox));
                }
                this._console.error(err);
            }
        });
    }
};
