
/**
 *
 * @param {object} assert
 * @param {Function} EmailAccountClass
 */
export function runTests(assert, EmailAccountClass) {
    // Mock dependencies
    const config = {
        getMessagesShown: () => [],
        setMessagesShown: () => { },
    };
    const accountProxy = {
        get_account: () => ({
            id: 'test-account-id',
            provider_type: 'google',
            presentation_identity: 'test@gmail.com',
        }),
    };

    const account = new EmailAccountClass(config, accountProxy);
    assert.equal(account.mailbox, 'test@gmail.com', 'Mailbox should be initialized');
}
