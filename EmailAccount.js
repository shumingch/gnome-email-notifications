import { Console } from './console.js';
import { InboxScanner } from './InboxScanner.js';
import { Notifier } from './Notifier.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * Controls a single Gnome Online Account
 */
export class EmailAccount {
    /**
     * Creates a new EmailAccount with a Gnome Online Account
     * @param {Conf} config
     * @param account - the Gnome Online Account
     */
    constructor(config, account) {
        this.config = config;
        this.mailbox = account.get_account().presentation_identity;
        if (this.mailbox === undefined) this.mailbox = '';
        this._scanner = new InboxScanner(account, this.config);
        this._notifier = new Notifier(this);
        this._console = new Console();
    }

    /**
     * Creates a notification for an error and logs it to the console
     * @param {Error} error - the error to display
     */
    _showError(error) {
        this._console.error(error);
        this._notifier.showError(error);
    }

    /**
     * Scans the current account for emails
     */
    scanInbox() {
        try {
            this._notifier.removeErrors();
            this._scanner.scanInbox(this._processData.bind(this));
        } catch (err) {
            this._showError(err);
        }
    }

    /**
     * Displays error or emails to message tray.
     * @param {Error} err - the error to display
     * @param folders - a list of folders which contain unread emails
     * @private
     */
    _processData(err, folders) {
        if (err) {
            // Suppress notifications for transient server errors
            if (err.message && (err.message.startsWith("Status 5") || err.message.startsWith("Status 429"))) {
                this._console.log("Transient network error (suppressed notification): " + err.message);
                return;
            }
            this._showError(err);
        } else {
            try {
                const content = folders[0].list;
                this.updateContent(content);
            } catch (err) {
                this._showError(err);
            }
        }
    }

    /**
     * Displays notifications for unread emails
     * @param content - a list of unread emails
     */
    updateContent(content) {
        if (content !== undefined) {
            content.reverse();
            this._notifier.displayUnreadMessages(content);
        }
    }

    /**
     * Destroys all sources for the email account
     */
    destroySources() {
        this._notifier.destroySources();
    }
};

