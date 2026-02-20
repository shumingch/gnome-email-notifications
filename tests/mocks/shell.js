
export const messageTray = {
    add: () => { },
};

export class Notification {
    constructor(params) {
        this.source = params.source;
        this.title = params.title;
        this.body = params.body;
    }

    connect() { }
    destroy() { }
    addAction() { }
}

export const MsgTray = {
    Source: class {
        constructor() {
            this.notifications = [];
        }

        connect() { }
        destroy() { }
    },
    Notification,
};

export class SystemNotificationSource {
    constructor() {
        this.notifications = [];
    }

    connect() { }
    destroy() { }
}

export const notifyError = (title, message) => {
    print(`  MOCK notifyError: ${title} - ${message}`);
};

export const gettext = str => str;

export const spawnCommandLineAsync = () => { };
export const trySpawnCommandLine = () => { };
