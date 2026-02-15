
export function runTests(assert, ConfClass) {
    const conf = new ConfClass();

    // Test timeout
    conf.setTimeout(120);
    assert.equal(conf.getTimeout(), 120, "Timeout should be 120");

    // Test usemail (reader)
    conf.setReader(1);
    assert.equal(conf.getReader(), 1, "Reader should be 1");
    conf.setReader(0);
    assert.equal(conf.getReader(), 0, "Reader should be 0");

    // Test messages shown
    const messages = ['id1', 'id2'];
    conf.setMessagesShown(messages);
    const result = conf.getMessagesShown();
    assert.equal(result.length, 2, "Should have 2 messages");
    assert.equal(result[0], 'id1', "First message should be id1");
    assert.equal(result[1], 'id2', "Second message should be id2");

    // Test gmail system label
    conf.setGmailSystemLabel('INBOX');
    assert.equal(conf.getGmailSystemLabel(), 'INBOX', "Gmail label should be INBOX");
}
