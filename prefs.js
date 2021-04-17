/*
 * Copyright (c) 2012-2017 Gmail Message Tray contributors
 *
 * Gmail Message Tray Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Message Tray Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Authors:
 * Adam Jabłoński <jablona123@gmail.com>
 * Shuming Chan <shuming0207@gmail.com>
 *
 */
"use strict";
const { GObject, Gtk } = imports.gi;

const Gettext = imports.gettext;
const _ = Gettext.domain('gmail_notify').gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Conf = Me.imports.Conf.Conf;

/*
Gmail system label definitions taken from
https://developers.google.com/gmail/android/com/google/android/gm/contentprovider/GmailContract.Labels.LabelCanonicalNames
Linked to by https://stackoverflow.com/questions/24959370/list-of-gmail-atom-available-labels
Only those marked as "include" are available to choose from, but the
whole list is documented here anyway.
*/
const GMAIL_SYSTEM_LABELS = {
    CANONICAL_NAME_ALL_MAIL: {
        display: "All Mail label",
        value: "^all",
        include: false,
        order: 0
    },
    CANONICAL_NAME_DRAFTS: {
        display: "Drafts label",
        value: "^r",
        include: false,
        order: 0
    },
    CANONICAL_NAME_INBOX: {
        display: "Whole inbox (the 'inbox' label)",
        value: "^i",
        include: true,
        order: 1
    },
    CANONICAL_NAME_INBOX_CATEGORY_FORUMS: {
        display: "Forums inbox category",
        value: "^sq_ig_i_group",
        include: false,
        order: 0
    },
    CANONICAL_NAME_INBOX_CATEGORY_PRIMARY: {
        display: "Priority Inbox: Primary category only",
        value: "^sq_ig_i_personal",
        include: true,
        order: 3
    },
    CANONICAL_NAME_INBOX_CATEGORY_PROMOTIONS: {
        display: "Promotions inbox category",
        value: "^sq_ig_i_promo",
        include: false,
        order: 0
    },
    CANONICAL_NAME_INBOX_CATEGORY_SOCIAL: {
        display: "Social inbox category",
        value: "^sq_ig_i_social",
        include: false,
        order: 0
    },
    CANONICAL_NAME_INBOX_CATEGORY_UPDATES: {
        display: "Updates inbox category",
        value: "^sq_ig_i_notification",
        include: false,
        order: 0
    },
    CANONICAL_NAME_PRIORITY_INBOX: {
        display: "Priority Inbox",
        value: "^iim",
        include: true,
        order: 2
    },
    CANONICAL_NAME_SENT: {
        display: "Sent label",
        value: "^f",
        include: false,
        order: 0
    },
    CANONICAL_NAME_SPAM: {
        display: "Spam label",
        value: "^s",
        include: false,
        order: 0
    },
    CANONICAL_NAME_STARRED: {
        display: "Starred label",
        value: "^t",
        include: false,
        order: 0
    },
    CANONICAL_NAME_TRASH: {
        display: "Trash label",
        value: "^k",
        include: false,
        order: 0
    }
}

/**
 * Initializes settings
 */
function init() {
    Conf.setupTranslations();
}

/**
 * Creates the setting GUI
 */
function buildPrefsWidget() {
    const prefs = new Prefs();
    return prefs;
}

/**
 * Creates a preference widget for extension settings
 * @private
 */
var Prefs = GObject.registerClass(class extends Gtk.Box {
    _init(params) {
        super._init(params);
        this.margin = 24;
        this.orientation = Gtk.Orientation.VERTICAL;
        this._conf = new Conf();
        const useMailLabel = _("Use default email client instead of browser");
        const timeoutLabel = _("Check every {0} sec: ");
        const gmailSystemLabelLabel = _("Select mailbox (for Gmail accounts only)");
        this._addSwitchSetting(useMailLabel, useMailLabel);
        this._addSliderSetting(timeoutLabel, timeoutLabel);
        const gmailSystemLabelToggleDefinitions = [];
        for (let key in GMAIL_SYSTEM_LABELS) {
            if (GMAIL_SYSTEM_LABELS[key].include) {
                gmailSystemLabelToggleDefinitions.push(Object.assign({}, GMAIL_SYSTEM_LABELS[key]))
            }
        }
        gmailSystemLabelToggleDefinitions.sort((a, b) => a.order - b.order)
        this._addToggleSetting(
            gmailSystemLabelLabel,
            gmailSystemLabelLabel,
            gmailSystemLabelToggleDefinitions
        );
    }

    /**
     * Creates a set of radio buttons
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @param {array of objects} definitions - Each radio button, with "display" and "value" entries
     * @private
     */
    _addToggleSetting(label, help, definitions) {
        const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        const setting_label = new Gtk.Label({
            label: label,
            xalign: 0,
            use_markup: true
        });
        setting_label.set_tooltip_text(help);
        vbox.append(setting_label, true, true, 0);

        let previous_radio_button = null;
        definitions.forEach(d => {
            const setting_radio_button = new Gtk.ToggleButton({
                group: previous_radio_button,
                label: d.display,
                active: this._conf.getGmailSystemLabel() === d.value
            })
            previous_radio_button = setting_radio_button
            setting_radio_button.connect('toggled', button => {
                if (button.active) {
                    this._conf.setGmailSystemLabel(d.value)
                }
            })
            vbox.append(setting_radio_button, true, true, 0)
        })
        this.append(vbox);
    }

    /**
     * Creates a single switch setting
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @private
     */
    _addSwitchSetting(label, help) {
        const hbox = this._createHBox();
        const setting_switch = new Gtk.CheckButton({
            active: this._conf.getReader() === 1
        });
        setting_switch.connect('toggled', button => {
            this._conf.setReader(button.active ? 1 : 0);
        });
        this._addLabel(hbox, label, help);
        hbox.append(setting_switch);
        this.append(hbox);
    }

    /**
     * Creates a horizontal Box
     * @returns {Gtk.Box}
     * @private
     */
    _createHBox() {
        return new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
    }

    /**
     * Creates a single slider setting
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @private
     */
    _addSliderSetting(label, help) {
        const hbox = this._createHBox();
        const new_label = label.replace('{0}', this._conf.getTimeout());
        const setting_label = this._addLabel(hbox, new_label, help);

        const adjustment = new Gtk.Adjustment({
            lower: 60,
            upper: 1800,
            step_increment: 1
        });
        const setting_slider = new Gtk.Scale({
            hexpand: true,
            digits: 0,
            adjustment: adjustment,
            value_pos: Gtk.PositionType.RIGHT
        });
        setting_slider.set_value(this._conf.getTimeout());
        setting_slider.connect('value-changed', button => {
            let i = Math.round(button.get_value());
            setting_label.label = label.replace('{0}', i.toString());
            this._conf.setTimeout(i);
        });
        hbox.append(setting_slider, true, true, 0);
        this.append(hbox);
    }

    /**
     * Creates a label for an hbox
     * @param {Gtk.Box} hbox - the GUI element to add the label to
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @returns {Gtk.Label}
     * @private
     */
    _addLabel(hbox, label, help) {
        const setting_label = new Gtk.Label({
            label: label,
            xalign: 0,
            use_markup: true
        });
        setting_label.set_tooltip_text(help);
        hbox.prepend(setting_label, true, true, 0);
        return setting_label;
    }
});


