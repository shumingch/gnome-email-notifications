
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GmailNotificationExtension from '../extension.js';

/**
 *
 * @param {object} assert
 */
export function runTests(assert) {
    const metadata = {
        uuid: 'GmailMessageTray@shuming0207.gmail.com',
        path: GLib.get_current_dir(),
        dir: Gio.File.new_for_path(GLib.get_current_dir()),
        'shell-version': ['46'],
        description: 'test',
        name: 'test',
    };

    const ext = new GmailNotificationExtension(metadata);
    ext.config = {getTimeout: () => 60};
    ext.goaAccounts = [];

    // Create mock accounts (same shape as EmailAccount: id, mailbox)
    const acc1 = {id: 'id1', mailbox: 'a@test.com'};
    const acc2 = {id: 'id2', mailbox: 'b@test.com'};
    const acc3 = {id: 'id3', mailbox: 'c@test.com'};

    // First merge: add two accounts
    ext._mergeAccounts([acc1, acc2]);
    assert.equal(ext.goaAccounts.length, 2, 'Should have 2 accounts after first merge');

    // Second merge: add one more (no duplicates)
    ext._mergeAccounts([acc1, acc2, acc3]);
    assert.equal(ext.goaAccounts.length, 3, 'Should have 3 accounts after adding new one');

    // Third merge: same accounts again - no new additions
    ext._mergeAccounts([acc1, acc2, acc3]);
    assert.equal(ext.goaAccounts.length, 3, 'Should still have 3 accounts (no duplicates)');

    // Verify account order and content
    assert.equal(ext.goaAccounts[0].mailbox, 'a@test.com', 'First account mailbox correct');
    assert.equal(ext.goaAccounts[1].mailbox, 'b@test.com', 'Second account mailbox correct');
    assert.equal(ext.goaAccounts[2].mailbox, 'c@test.com', 'Third account mailbox correct');
}
