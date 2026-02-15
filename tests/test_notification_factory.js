
export function runTests(assert, NotificationFactory, unescapeXML) {
    const emailAccount = {
        mailbox: "test@gmail.com",
        config: {
            getMessagesShown: () => [],
            setMessagesShown: () => { }
        }
    };
    const factory = new NotificationFactory(emailAccount);

    // Test unescape
    assert.equal(unescapeXML("&lt;b&gt;Hello&lt;/b&gt;"), "<b>Hello</b>", "Should unescape HTML entities");
    assert.equal(unescapeXML("A &amp; B"), "A & B", "Should unescape ampersand");

    // Test createEmailNotification
    const msg = {
        subject: "Test Subject",
        from: "Sender",
        date: new Date().toISOString()
    };
    const notification = factory.createEmailNotification(msg, () => { });
    // Note: Notification set up in mocks/shell.js maps constructor params
    assert.equal(factory._mailbox, "test@gmail.com", "Mailbox should be set");
}
