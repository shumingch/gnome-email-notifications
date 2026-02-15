
export function runTests(assert, EmailAccountClass) {
    // Mock dependencies
    const config = {
        getMessagesShown: () => [],
        setMessagesShown: () => { }
    };
    const accountProxy = {
        get_account: () => ({
            provider_type: "google",
            presentation_identity: "test@gmail.com"
        })
    };

    const account = new EmailAccountClass(config, accountProxy);
    assert.equal(account.mailbox, "test@gmail.com", "Mailbox should be initialized");
}
