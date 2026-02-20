
export class Message {
    constructor(method, url) {
        this.method = method;
        this.url = url;
        this.request_headers = {
            append: (k, v) => {
                this.headers = this.headers || {};
                this.headers[k] = v;
            },
        };
        this.status_code = 200;
        this.reason_phrase = 'OK';
    }

    get_status() {
        return this.status_code;
    }

    get_reason_phrase() {
        return this.reason_phrase;
    }

    static new(method, url) {
        return new Message(method, url);
    }
}

export class Session {
    constructor() {
        this.timeout = 0;
    }

    set_timeout(t) {
        this.timeout = t;
    }

    send_and_read_async(msg, priority, cancellable, callback) {
        // Simulate async success
        const bytes = {
            get_data: () => new TextEncoder().encode(this.mockBody || '{}'),
        };
        callback(this, {
            finish: () => bytes,
        });
    }

    send_and_read_finish(result) {
        return result.finish();
    }
}

export default {
    Message,
    Session,
};
