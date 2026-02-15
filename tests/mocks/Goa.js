
export class MockAccount {
    constructor(identity, provider) {
        this._identity = identity;
        this._provider = provider;
    }

    get_account() {
        return {
            presentation_identity: this._identity,
            provider_type: this._provider
        };
    }

    get_oauth2_based() {
        return {
            call_get_access_token: (cancellable, callback) => {
                callback(null, "mock_result");
            },
            call_get_access_token_finish: (result) => {
                return [true, "mock_token"];
            }
        };
    }
}
