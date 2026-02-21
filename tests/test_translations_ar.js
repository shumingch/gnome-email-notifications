#!/usr/bin/gjs
/**
 * Test that Arabic translations exist for all prefs.js translatable strings.
 * Run with: gjs tests/test_translations_ar.js
 * Or from project root: GJS_PATH=.:$GJS_PATH gjs tests/test_translations_ar.js
 */
import GLib from 'gi://GLib';

const projectRoot = GLib.get_current_dir();
const arPoPath = `${projectRoot}/locale/ar/LC_MESSAGES/gmail_notify.po`;

/**
 * Translatable strings used in prefs.js - must have Arabic translations
 */
const PREFS_STRINGS = [
    'Email Notifications Settings',
    'Use default email client instead of browser',
    'Check every {0} sec: ',
    'Gmail mailbox label',
    'Select which Gmail label to monitor',
    'All Mail label',
    'Drafts label',
    "Whole inbox (the 'inbox' label)",
    'Forums inbox category',
    'Priority Inbox: Primary category only',
    'Promotions inbox category',
    'Social inbox category',
    'Updates inbox category',
    'Priority Inbox',
    'Sent label',
    'Spam label',
    'Starred label',
    'Trash label',
];

function parsePoFile(filePath) {
    const content = GLib.file_get_contents(filePath)[1];
    const text = new TextDecoder().decode(content);
    const translations = {};
    let currentMsgid = null;
    let currentMsgstr = null;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('msgid ')) {
            if (currentMsgid !== null && currentMsgstr !== null)
                translations[currentMsgid] = currentMsgstr;

            currentMsgid = parsePoString(line.substring(6));
            currentMsgstr = null;
        } else if (line.startsWith('msgstr ')) {
            currentMsgstr = parsePoString(line.substring(7));
        } else if (line.startsWith('"') && currentMsgstr !== undefined) {
            // Continued string - append to msgstr (last parsed)
            const value = parsePoString(line.trim());
            if (currentMsgstr !== null)
                currentMsgstr += value;
        }
    }
    if (currentMsgid !== null && currentMsgstr !== null)
        translations[currentMsgid] = currentMsgstr;

    return translations;
}

function parsePoString(s) {
    if (!s || s === '""')
        return '';
    return s.slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

/**
 * @param {Function} assert - Assertion function (condition, message) => void
 */
export function runTests(assert) {
    if (!GLib.file_test(arPoPath, GLib.FileTest.EXISTS))
        throw new Error(`Arabic .po file not found: ${arPoPath}`);


    const translations = parsePoFile(arPoPath);

    for (const msgid of PREFS_STRINGS) {
        const msgstr = translations[msgid];
        assert(msgstr !== undefined, `Arabic has entry for: "${msgid}"`);
        assert(msgstr.length > 0, `Arabic has translation for: "${msgid}"`);
    }
}

