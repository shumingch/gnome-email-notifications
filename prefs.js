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
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {Conf} from './Conf.js';

/*
Gmail system label definitions taken from
https://developers.google.com/gmail/android/com/google/android/gm/contentprovider/GmailContract.Labels.LabelCanonicalNames
Linked to by https://stackoverflow.com/questions/24959370/list-of-gmail-atom-available-labels
Only those marked as "include" are available to choose from, but the
whole list is documented here anyway.
*/
const GMAIL_SYSTEM_LABELS = {
    CANONICAL_NAME_ALL_MAIL: {
        get display() {
            return _('All Mail label');
        },
        value: '^all',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_DRAFTS: {
        get display() {
            return _('Drafts label');
        },
        value: '^r',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_INBOX: {
        get display() {
            return _("Whole inbox (the 'inbox' label)");
        },
        value: '^i',
        include: true,
        order: 1,
    },
    CANONICAL_NAME_INBOX_CATEGORY_FORUMS: {
        get display() {
            return _('Forums inbox category');
        },
        value: '^sq_ig_i_group',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_INBOX_CATEGORY_PRIMARY: {
        get display() {
            return _('Priority Inbox: Primary category only');
        },
        value: '^sq_ig_i_personal',
        include: true,
        order: 3,
    },
    CANONICAL_NAME_INBOX_CATEGORY_PROMOTIONS: {
        get display() {
            return _('Promotions inbox category');
        },
        value: '^sq_ig_i_promo',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_INBOX_CATEGORY_SOCIAL: {
        get display() {
            return _('Social inbox category');
        },
        value: '^sq_ig_i_social',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_INBOX_CATEGORY_UPDATES: {
        get display() {
            return _('Updates inbox category');
        },
        value: '^sq_ig_i_notification',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_PRIORITY_INBOX: {
        get display() {
            return _('Priority Inbox');
        },
        value: '^iim',
        include: true,
        order: 2,
    },
    CANONICAL_NAME_SENT: {
        get display() {
            return _('Sent label');
        },
        value: '^f',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_SPAM: {
        get display() {
            return _('Spam label');
        },
        value: '^s',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_STARRED: {
        get display() {
            return _('Starred label');
        },
        value: '^t',
        include: false,
        order: 0,
    },
    CANONICAL_NAME_TRASH: {
        get display() {
            return _('Trash label');
        },
        value: '^k',
        include: false,
        order: 0,
    },
};

export default class GmailNotificationPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this.initTranslations('gmail_notify');
    }

    fillPreferencesWindow(window) {
        const conf = new Conf(this);

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _('Email Notifications Settings'),
        });

        // Use email client switch
        const useMailRow = new Adw.SwitchRow({
            title: _('Use default email client instead of browser'),
            active: conf.getReader() === 1,
        });
        useMailRow.connect('notify::active', row => {
            conf.setReader(row.active ? 1 : 0);
        });
        group.add(useMailRow);

        // Timeout spinner
        const adjustment = new Gtk.Adjustment({
            lower: 60,
            upper: 1800,
            step_increment: 1,
            value: conf.getTimeout(),
        });
        const timeoutRow = new Adw.SpinRow({
            adjustment,
        });
        const updateTimeoutTitle = row => {
            timeoutRow.set_title(_('Check every {0} sec: ').replace('{0}', String(Math.round(row.value))));
        };
        updateTimeoutTitle({value: conf.getTimeout()});
        timeoutRow.connect('notify::value', row => {
            conf.setTimeout(Math.round(row.value));
            updateTimeoutTitle(row);
        });
        group.add(timeoutRow);

        // Gmail system label selection
        const gmailSystemLabelToggleDefinitions = [];
        for (const key in GMAIL_SYSTEM_LABELS) {
            if (GMAIL_SYSTEM_LABELS[key].include)
                gmailSystemLabelToggleDefinitions.push(Object.assign({}, GMAIL_SYSTEM_LABELS[key]));
        }
        gmailSystemLabelToggleDefinitions.sort((a, b) => a.order - b.order);

        const gmailLabelRow = new Adw.ComboRow({
            title: _('Gmail mailbox label'),
            subtitle: _('Select which Gmail label to monitor'),
        });

        const model = new Gtk.StringList();
        const labelMap = {};

        gmailSystemLabelToggleDefinitions.forEach((d, index) => {
            model.append(d.display);
            labelMap[index] = d.value;
            if (conf.getGmailSystemLabel() === d.value)
                gmailLabelRow.set_selected(index);
        });

        gmailLabelRow.set_model(model);
        gmailLabelRow.connect('notify::selected', row => {
            const selectedIndex = row.selected;
            if (selectedIndex !== Gtk.INVALID_LIST_POSITION)
                conf.setGmailSystemLabel(labelMap[selectedIndex]);
        });
        group.add(gmailLabelRow);

        page.add(group);
        window.add(page);
    }
}


