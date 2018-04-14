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
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext;
const domain = 'gmail_notify';
const _ = Gettext.domain(domain).gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Conf = Me.imports.Conf.Conf;
const conf = new Conf();

/**
 * Initializes settings
 */
function init() {
    const localeDir = Me.dir.get_child('locale').get_path();
    Gettext.bindtextdomain(domain, localeDir);
}

/**
 * Creates the setting GUI
 */
function buildPrefsWidget() {
    const prefs = new Prefs();
    prefs.show_all();
    return prefs;
}

/**
 * Creates a preference widget for extension settings
 * @class
 */
const Prefs = new Lang.Class({
    Name: 'Prefs',
    Extends: Gtk.Box,
    _init: function (params) {
        this.parent(params);
        this.margin = 24;
        this.orientation = Gtk.Orientation.VERTICAL;
        this.settings = conf.getSettings();
        const usemailLabel = _("Use default email client instead of browser");
        const timeoutLabel = _("Check every {0} sec: ");
        this._addSwitchSetting(conf.SETTINGS_KEY_USEMAIL, usemailLabel, usemailLabel);
        this._addSliderSetting(conf.SETTINGS_KEY_TIMEOUT, timeoutLabel, timeoutLabel);
    },
    /**
     * Creates a single switch setting
     * @param {string} setting - the name of the setting to modify
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @private
     */
    _addSwitchSetting: function (setting, label, help) {
        const hbox = this._createHBox();
        const setting_switch = new Gtk.CheckButton({
            active: this.settings.get_int(setting) === 1
        });
        setting_switch.connect('toggled', button => {
            this.settings.set_int(setting, (button.active) ? 1 : 0);
        });
        this._addLabel(hbox, label, help);
        hbox.add(setting_switch);
        this.add(hbox);
    },
    /**
     * Creates a horizontal Box
     * @returns {Gtk.Box}
     * @private
     */
    _createHBox: function () {
        return new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    },

    /**
     * Creates a single slider setting
     * @param {string} setting - the name of the setting to modify
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @private
     */
    _addSliderSetting: function (setting, label, help) {
        const hbox = this._createHBox();
        const new_label = label.replace('{0}', this.settings.get_int(setting));
        const setting_label = this._addLabel(hbox, new_label, help);

        const adjustment = new Gtk.Adjustment({
            lower: 60,
            upper: 1800,
            step_increment: 1
        });
        const setting_slider = new Gtk.HScale({
            digits: 0,
            adjustment: adjustment,
            value_pos: Gtk.PositionType.RIGHT
        });
        setting_slider.set_value(this.settings.get_int(setting));
        setting_slider.connect('value-changed', button => {
            let i = Math.round(button.get_value());
            setting_label.label = label.replace('{0}', i.toString());
            this.settings.set_int(setting, i);
        });
        hbox.pack_end(setting_slider, true, true, 0);
        this.add(hbox);
    },

    /**
     * Creates a label for an hbox
     * @param {Gtk.Box} hbox - the GUI element to add the label to
     * @param {string} label - label for setting
     * @param {string} help - help information for setting
     * @returns {Gtk.Label}
     * @private
     */
    _addLabel: function (hbox, label, help) {
        const setting_label = new Gtk.Label({
            label: label,
            xalign: 0,
            use_markup: true
        });
        setting_label.set_tooltip_text(help);
        hbox.pack_start(setting_label, true, true, 0);
        return setting_label;
    }
});


