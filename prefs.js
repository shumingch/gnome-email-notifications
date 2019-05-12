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
const {GObject, Gtk} = imports.gi;

const Gettext = imports.gettext;
const _ = Gettext.domain('gmail_notify').gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Conf = Me.imports.Conf.Conf;

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
    prefs.show_all();
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
        this._addSwitchSetting(useMailLabel, useMailLabel);
        this._addSliderSetting(timeoutLabel, timeoutLabel);
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
        hbox.add(setting_switch);
        this.add(hbox);
    }

    /**
     * Creates a horizontal Box
     * @returns {Gtk.Box}
     * @private
     */
    _createHBox() {
        return new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
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
        const setting_slider = new Gtk.HScale({
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
        hbox.pack_end(setting_slider, true, true, 0);
        this.add(hbox);
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
        hbox.pack_start(setting_label, true, true, 0);
        return setting_label;
    }
});


