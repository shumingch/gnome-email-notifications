
export const Variant = class {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
};

export const shell_quote = (s) => s;

export default {
    Variant,
    shell_quote,
    timeout_add_seconds: () => { }
};
