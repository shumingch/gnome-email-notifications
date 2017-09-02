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
const GmailConf = Me.imports.GmailConf.GmailConf;
const gmailConf = new GmailConf();

let settings;
let settings_slider;
let settings_switch;
let settings_radio;
let settings_text;
const modes = new Map([
    [gmailConf.SHOWSUMMARY_YES, _("Show email summary")],
    [gmailConf.SHOWSUMMARY_NO, _("Show individual emails")],
]);

/**
 * Initializes settings
 */
function init() {
    _initTranslations();
    settings = gmailConf.getSettings();
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
        [gmailConf.GMAILNOTIFY_SETTINGS_KEY_SHOWSUMMARY, {
            label: _("Show email summary"), help: _("Show email summary")
        }]
    ]);
    settings_text = new Map([
        [gmailConf.GMAILNOTIFY_SETTINGS_KEY_GMAILACCOUNTNUMBER, {
            label: _("Gmail account number"), help: _("Selects the correct Gmail account if more than one is present")
        }]
    ]);
}

/**
 * Creates a single radio setting
 * @param {string} setting - the name of the setting to modify
 * @param value - information about the setting
 * @returns {Gtk.Box} - the GUI element to render
 * @private
 */
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

/**
 * Creates a single switch setting
 * @param {string} setting - the name of the setting to modify
 * @param info - information about the setting
 * @returns {Gtk.Box} - the GUI element to render
 * @private
 */
function _createSwitchSetting(setting, info) {

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    let setting_switch = new Gtk.CheckButton({});
    setting_switch.active = settings.get_int(setting) === 1;
    setting_switch.connect('toggled', function (button) {
        settings.set_int(setting, (button.active) ? 1 : 0);
    });
    _addLabel(hbox, info);
    hbox.add(setting_switch);
    return hbox;
}

/**
 * Creates a single slider setting
 * @param {string} setting - the name of the setting to modify
 * @param info - information about the setting
 * @returns {Gtk.Box} - the GUI element to render
 * @private
 */
function _createSliderSetting(setting, info) {
    let hbox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });
    const setting_label = _addLabel(hbox, info);

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
    setting_label.label = info.label.replace('{0}', settings.get_int(setting));
    setting_slider.connect('value-changed', function (button) {
        let i = Math.round(button.get_value());
        setting_label.label = info.label.replace('{0}', i.toString());
        settings.set_int(setting, i);
    });
    hbox.pack_end(setting_slider, true, true, 0);
    return hbox;
}

/**
 * Creates a single text setting
 * @param {string} setting - the name of the setting to modify
 * @param info - information about the setting
 * @returns {Gtk.Box} - the GUI element to render
 * @private
 */
function _createTextSetting(setting, info) {

    const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    const setting_text = new Gtk.Entry({
        'max-length': 2,
        'width-chars': 2
    });
    setting_text.text = settings.get_int(setting).toString();
    setting_text.connect('changed', button => {
        const int = parseInt(button.text);
        if (!isNaN(int)) settings.set_int(setting, int);
    });
    _addLabel(hbox, info);
    hbox.add(setting_text);
    return hbox;
}

/**
 * Creates a label for an hbox
 * @param {Gtk.Box} hbox - the GUI element to add the label to
 * @param info - information about the setting
 * @returns {Gtk.Label}
 * @private
 */
function _addLabel(hbox, info) {
    const setting_label = new Gtk.Label({
        label: info.label,
        xalign: 0
    });
    setting_label.set_tooltip_text(info.help);
    hbox.pack_start(setting_label, true, true, 0);
    return setting_label;
}

/**
 * A callback that returns an hbox
 * @callback settingsFunction
 * @param {string} setting - the name of the setting to create an element for
 * @param info - information about the setting
 * @return {Gtk.Box} - the GUI element to render
 */
/**
 * Creates GUI elements for each setting and adds it to the vbox
 * @param {Map} settings_map - map of setting names to information
 * @param {settingsFunction} settings_function - the function that creates the GUI element
 * @param {Gtk.Box} vbox - the element to add created elements to
 * @private
 */
function _addSettings(settings_map, settings_function, vbox) {
    for (let [setting, info] of settings_map) {
        const hbox = settings_function(setting, info);
        vbox.add(hbox);
    }
}

/**
 * Creates the setting GUI
 */
function buildPrefsWidget() {
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10
    });
    let vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 20, margin_top: 10
    });
    _addSettings(settings_switch, _createSwitchSetting, vbox);
    _addSettings(settings_slider, _createSliderSetting, vbox);
    _addSettings(settings_text, _createTextSetting, vbox);
    _addSettings(settings_radio, _createRadioSetting, vbox);
    frame.add(vbox);
    frame.show_all();
    return frame;
}

/**
 * Sets up translations using locale folder
 * @private
 */
function _initTranslations() {
    const Gettext = imports.gettext;
    let localeDir = Me.dir.get_child('locale').get_path();
    Gettext.bindtextdomain('gmail_notify', localeDir);
}
