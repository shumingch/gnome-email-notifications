
export class Conf {
    constructor(_extension) {
        this.timeout = 60;
        this.reader = 0;
        this.gmailLabel = '^i';
    }

    getTimeout() {
        return this.timeout;
    }

    setTimeout(val) {
        this.timeout = val;
    }

    getReader() {
        return this.reader;
    }

    setReader(val) {
        this.reader = val;
    }

    getGmailSystemLabel() {
        return this.gmailLabel;
    }

    setGmailSystemLabel(val) {
        this.gmailLabel = val;
    }
}
