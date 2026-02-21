
import Gio from 'gi://Gio';
import {Conf} from '../Conf.js';

function createAccountStub(identity, provider) {
    return {
        get_account: () => ({
            id: identity,
            presentation_identity: identity,
            provider_type: provider,
        }),
        get_oauth2_based: () => ({
            call_get_access_token: (_cancellable, callback) => callback(null, 'mock_token'),
            call_get_access_token_finish: () => [true, 'mock_token'],
        }),
    };
}

/**
 *
 * @param {object} assert
 * @param {Function} InboxScannerClass
 */
export function runTests(assert, InboxScannerClass) {
    const mockExtension = {
        getSettings: () => new Gio.Settings({schema_id: 'org.gnome.shell.extensions.gmailmessagetray'}),
        stopTimeout: () => {},
        startTimeout: () => {},
    };
    const config = new Conf(mockExtension);
    const account = createAccountStub('test@gmail.com', 'google');
    const scanner = new InboxScannerClass(account, config);

    assert.equal(scanner._mailbox, 'test@gmail.com', 'Mailbox is correct');
    assert.equal(scanner._provider, 'google', 'Provider is correct');
    assert.equal(scanner._scanner.constructor.name, 'GmailScanner', 'Correct scanner type created');
}
