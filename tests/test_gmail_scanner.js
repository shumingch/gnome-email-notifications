
import {GmailScanner} from '../GmailScanner.js';
import {Conf} from './mocks/Conf.js';

/**
 *
 * @param {object} assert
 */
export function runTests(assert) {
    const mailbox = 'test@gmail.com';
    const config = new Conf();
    const scanner = new GmailScanner(mailbox, config);

    // Test getApiURL
    assert.equal(scanner.getApiURL(), 'https://mail.google.com/mail/feed/atom/%5Ei', 'API URL is correct for default label');

    config.setGmailSystemLabel('^all');
    assert.equal(scanner.getApiURL(), 'https://mail.google.com/mail/feed/atom/%5Eall', 'API URL updates when label changes');

    // Test parseResponse
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<feed version="0.3" xmlns="http://purl.org/atom/ns#">
<title>Gmail - Inbox for test@gmail.com</title>
<tagline>New messages in your Gmail Inbox</tagline>
<fullcount>1</fullcount>
<link rel="alternate" href="https://mail.google.com/mail" type="text/html"/>
<modified>2026-02-15T18:00:00Z</modified>
<entry>
<title>Test Subject</title>
<summary>Test Summary</summary>
<link rel="alternate" href="https://mail.google.com/mail?account_id=test@gmail.com&amp;message_id=123" type="text/html"/>
<modified>2026-02-15T18:00:00Z</modified>
<issued>2026-02-15T18:00:00Z</issued>
<id>tag:gmail.google.com,2004:123456789</id>
<author>
<name>Test Sender</name>
<email>sender@example.com</email>
</author>
</entry>
</feed>`;

    const folders = scanner.parseResponse(body);
    assert.equal(folders.length, 1, 'Should have one folder');
    assert.equal(folders[0].name, 'inbox', 'Folder name should be inbox');
    assert.equal(folders[0].list.length, 1, 'Should have one message');

    const msg = folders[0].list[0];
    assert.equal(msg.subject, 'Test Subject', 'Subject is correct');
    assert.equal(msg.from, 'Test Sender <sender@example.com>', 'From is correct');
    assert.equal(msg.date, '2026-02-15T18:00:00Z', 'Date is correct');
    assert.equal(msg.link, 'https://mail.google.com/mail?account_id=test@gmail.com&message_id=123&authuser=test@gmail.com', 'Link is correct');
    assert.equal(msg.id, 'tag:gmail.google.com,2004:123456789', 'ID is correct');
}
