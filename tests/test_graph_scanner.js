
import {GraphScanner} from '../GraphScanner.js';

/**
 *
 * @param {object} assert
 */
export function runTests(assert) {
    const scanner = new GraphScanner();

    // Test getApiURL
    assert.equal(scanner.getApiURL(), 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$select=from,subject,receivedDateTime,webLink', 'API URL is correct');

    // Test parseResponse with Microsoft Graph API format
    const body = JSON.stringify({
        value: [
            {
                from: {
                    emailAddress: {
                        name: 'Test Sender',
                        address: 'sender@example.com',
                    },
                },
                subject: 'Test Subject',
                receivedDateTime: '2026-02-15T18:00:00Z',
                webLink: 'https://outlook.office365.com/owa/?ItemID=123',
                id: '123',
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
