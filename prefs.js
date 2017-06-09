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
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const GmailConf = Me.imports.GmailConf;

let settings;
let settings_slider;
let settings_switch;
let settings_radio;
const modes = new Map([
    [GmailConf.SHOWSUMMARY_YES, _("Show email summary")],
    [GmailConf.SHOWSUMMARY_NO, _("Show individual emails")],
]);

function init() {
    _initTranslations();
    settings = GmailConf.getSettings();
    settings_slider = new Map([
        ["timeout", {
            label: _("Check every {0} sec: "), help: _("Check every {0} sec: ")
        }]
    ]);
    const usemail = _("Use default email client instead of browser");
    const shownomail = "Show \"" + _("No new messages") + "\" notification";
    settings_switch = new Map([
        ["usemail", {
            label: usemail,
            help: usemail
        }],
        ["shownomail", {
            label: shownomail,
            help: shownomail
        }]
    ]);

    settings_radio = new Map([
        [GmailConf.GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY, {
            label: _("Show email summary"), help: _("Show email summary")
        }]
    ]);
}

function _createRadioSetting(setting, value) {
    const hbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL});
    const align = new Gtk.Alignment({left_padding: 12});
    const grid = new Gtk.Grid({
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 6,
        column_spacing: 6
    });
    const setting_label = '<b>' + value.label + '</b>';
    hbox.add(new Gtk.Label({
        label: setting_label, use_markup: true,
        halign: Gtk.Align.START
    }));
    let radio = null;
    let currentMode = settings.get_string(setting);
    for (let [mode, label] of modes) {
        const _mode = mode;
        radio = new Gtk.RadioButton({group: radio, label: label, valign: Gtk.Align.START});
        radio.connect('toggled', widget => {
            if (widget.active) {
                settings.set_string(setting, _mode);
            }
        });
        grid.add(radio);
        if (mode === currentMode) {
            radio.active = true;
        }
    }
    radio.set_tooltip_text(value.help);
    align.add(grid);
    hbox.add(align);
    return hbox;
}

function _createSwitchSetting(setting, value) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    let setting_label = new Gtk.Label({
        label: value.label,
        xalign: 0
    });
    let setting_switch = new Gtk.CheckButton({});
    setting_switch.active = settings.get_int(setting) === 1;
    setting_switch.connect('toggled', function (button) {
        settings.set_int(setting, (button.active) ? 1 : 0);
    });
    if (value.help) {
        setting_label.set_tooltip_text(value.help)

    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_switch);
    return hbox;
}

function _createSliderSetting(setting, value) {
    let hbox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });
    let slider_label = new Gtk.Label({
        label: value.label,
        xalign: 0
    });

    let adjustment = new Gtk.Adjustment({
        lower: 60,
        upper: 1800,
        step_increment: 1
    });
    let setting_slider = new Gtk.HScale({
        digits: 0,
        adjustment: adjustment,
        value_pos: Gtk.PositionType.RIGHT
    });
    setting_slider.set_value(settings.get_int(setting));
    slider_label.label = _("Check every {0} sec: ").replace('{0}', settings.get_int(setting));
    setting_slider.connect('value-changed', function (button) {
        let i = Math.round(button.get_value());
        slider_label.label = _("Check every {0} sec: ").replace('{0}', i.toString());
        settings.set_int(setting, i);
    });
    if (value.help) {
        slider_label.set_tooltip_text(value.help)
    }
    hbox.pack_start(slider_label, true, true, 0);
    hbox.pack_end(setting_slider, true, true, 0);
    return hbox;
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10
    });
    let vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 20, margin_top: 10
    });
    for (let [setting, value] of settings_switch) {
        let hbox = _createSwitchSetting(setting, value);
        vbox.add(hbox);
    }
    for (let [setting, value] of settings_slider) {
        let hbox = _createSliderSetting(setting, value);
        vbox.add(hbox);
    }
    for (let [setting, value] of settings_radio) {
        let hbox = _createRadioSetting(setting, value);
        vbox.add(hbox);
    }
    frame.add(vbox);
    frame.show_all();
    return frame;
}

function _initTranslations() {
    const Gettext = imports.gettext;
    let localeDir = Me.dir.get_child('locale').get_path();
    Gettext.bindtextdomain('gmail_notify', localeDir);
}
