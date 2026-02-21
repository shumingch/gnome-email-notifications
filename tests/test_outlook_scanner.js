
import {OutlookScanner} from '../OutlookScanner.js';

/**
 *
 * @param {object} assert
 */
export function runTests(assert) {
    const scanner = new OutlookScanner();

    // Test getApiURL
    assert.equal(scanner.getApiURL(), 'https://outlook.office.com/api/v2.0/me/MailFolders/Inbox/messages?$select=From,Subject,ReceivedDateTime,WebLink', 'API URL is correct');

    // Test parseResponse
    const body = JSON.stringify({
        value: [
            {
                From: {
                    EmailAddress: {
                        Name: 'Test Sender',
                        Address: 'sender@example.com',
                    },
                },
                Subject: 'Test Subject',
                ReceivedDateTime: '2026-02-15T18:00:00Z',
                WebLink: 'https://outlook.office365.com/owa/?ItemID=123',
                Id: '123',
            },
        ],
    });

    const folders = scanner.parseResponse(body);
    assert.equal(folders.length, 1, 'Should have one folder');
    assert.equal(folders[0].name, 'inbox', 'Folder name should be inbox');
    assert.equal(folders[0].list.length, 1, 'Should have one message');

    const msg = folders[0].list[0];
    assert.equal(msg.subject, 'Test Subject', 'Subject is correct');
    assert.equal(msg.from, 'Test Sender <sender@example.com>', 'From is correct');
    assert.equal(msg.date, '2026-02-15T18:00:00Z', 'Date is correct');
    assert.equal(msg.link, 'https://outlook.office365.com/owa/?ItemID=123', 'Link is correct');
    assert.equal(msg.id, '123', 'ID is correct');
}
