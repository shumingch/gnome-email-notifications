
import {MockAccount} from './mocks/Goa.js';
import {Conf} from './mocks/Conf.js';
import Soup_ from 'gi://Soup?version=3.0';
import GLib_ from 'gi://GLib';

/**
 *
 * @param {object} assert
 * @param {Function} InboxScannerClass
 */
export function runTests(assert, InboxScannerClass) {
    const config = new Conf();
    const account = new MockAccount('test@gmail.com', 'google');
    const scanner = new InboxScannerClass(account, config);

    assert.equal(scanner._mailbox, 'test@gmail.com', 'Mailbox is correct');
    assert.equal(scanner._provider, 'google', 'Provider is correct');
    assert.equal(scanner._scanner.constructor.name, 'GmailScanner', 'Correct scanner type created');
}
