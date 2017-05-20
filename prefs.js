/*
 * Copyright (c) 2012 Adam Jabłooński
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
const GLib = imports.gi.GLib;

const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const console = Me.imports.console.console;
const GmailConf = Me.imports.GmailConf;

let settings;
let settings_slider;
let settings_switch;
function init() {
    initTranslations();
    settings = GmailConf.getSettings();
    settings_slider = new Map([
        ["timeout", {
            label: _("Check every {0} sec: "), help: _("Check every {0} sec: ")
        }]
    ]);
    settings_switch = new Map([
        ["usemail", {
            label: _("Use default email client instead of browser"),
            help: _("Use default email client instead of browser")
        }]
    ]);
}

function createSwitchSetting(setting, value) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    let setting_label = new Gtk.Label({
        label: value.label,
        xalign: 0
    });
    let setting_switch = new Gtk.CheckButton({});
    setting_switch.active = settings.get_int(setting) === 1;
    setting_switch.connect('toggled', function (button) {
        try {
            settings.set_int(setting, (button.active) ? 1 : 0);
        }
        catch (err) {
            console.log(err);
        }
    });
    if (value.help) {
        setting_label.set_tooltip_text(value.help)

    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_switch);
    return hbox;
}

function createSliderSetting(setting, value) {
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
        digits:0,
        adjustment: adjustment,
        value_pos: Gtk.PositionType.RIGHT
    });
    setting_slider.set_value(settings.get_int(setting));
    slider_label.label = _("Check every {0} sec: ").replace('{0}', settings.get_int(setting));
    setting_slider.connect('value-changed', function (button) {
        try {
            let i = Math.round(button.get_value());
            slider_label.label = _("Check every {0} sec: ").replace('{0}', i.toString());
            settings.set_int(setting, i);
        }
        catch (err) {
            console.log(err);
        }
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
        let hbox = createSwitchSetting(setting, value);
        vbox.add(hbox);
    }
    for (let [setting, value] of settings_slider) {
        let hbox = createSliderSetting(setting, value);
        vbox.add(hbox);
    }
    frame.add(vbox);
    frame.show_all();
    return frame;
}

function initTranslations() {
    const Gettext = imports.gettext;
    let localeDir = Me.dir.get_child('locale').get_path();

    if (GLib.file_test(localeDir, GLib.FileTest.EXISTS)) {
        Gettext.bindtextdomain('gmail_notify', localeDir);
    }
}
