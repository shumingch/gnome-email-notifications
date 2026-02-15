
export const Variant = class {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
};

export const shell_quote = (s) => s;

export const DateTime = {
    new_from_unix_local: (val) => ({
        to_unix: () => val
    })
};

export default {
    Variant,
    shell_quote,
    timeout_add_seconds: () => { },
    DateTime
};
