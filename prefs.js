/*
 * Copyright (c) 2012 Adam Jabłoński
 *
 * GmailNotify Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Clicksaver is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Adam Jabłoński <jablona123@gmail.com>
 *
 */
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gmail_notify');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;

let settings;
let settings_bool;
let settings_range;
let settings_slider;
let settings_combo;
let settings_switch;
let settings_text;
let slider_label;
function init() {
	Lib.initTranslations(Me);
	settings = Lib.getSettings(Me);    
	settings_combo = {
		position: { label : _("Extension position"),help : _("Extension position")
				}
	};
	settings_text = {
		btext: { label : _("Button template"),help : _("Button template")
				}
	};
	settings_slider = {
		timeout: { label : _("Check every {0} sec: "),help : _("Check every {0} sec: ")
				}
	};
	settings_switch = {
		"usemail": { label: _("Use default email client instead of browser"), help: _("Use default email client instead of browser")
			     },
		"notify" : { label: _("Notify about incoming mail"), help: _("Notify about incoming mail")
			     },
		"showsummary" : { label: _("Show email summary"), help: _("Show email summary")
			     },
		"safemode" : { label: _("Safe Mode"), help: _("Safe mode")
			     }					     
	};
}

function createComboSetting(setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let setting_label = new Gtk.Label({label: settings_combo[setting].label,
                                       xalign: 0 });
	let setting_combo = new Gtk.ComboBoxText({});
	setting_combo.append("right",_("Right"));
	setting_combo.append("left",_("Left"));
	setting_combo.append("center",_("Center"));
	setting_combo.set_active_id(settings.get_string(setting))
	setting_combo.connect('changed', function(button) {
		settings.set_string(setting, button.get_active_id());
	});
	if (settings_combo[setting].help) {
		setting_label.set_tooltip_text(settings_combo[setting].help)
		setting_combo.set_tooltip_text(settings_combo[setting].help)
	}
	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_combo);
	return hbox;
}

function createSwitchSetting(setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let setting_label = new Gtk.Label({label: settings_switch[setting].label,
                                       xalign: 0 });                        
	let setting_switch = new Gtk.CheckButton({});
	setting_switch.active = (settings.get_int(setting) == 1) ? true :false;
	setting_switch.connect('toggled', function(button,data) {		
		try {			
			settings.set_int(setting, (button.active) ? 1 : 0);
		}
		catch (err) {			
			
		}
	});
	if (settings_switch[setting].help) {
		setting_label.set_tooltip_text(settings_switch[setting].help)
	
	}
	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_switch);
	return hbox;
}

function createSliderSetting(setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let slider_label = new Gtk.Label({label: settings_slider[setting].label,
                                       xalign: 0 });
                         
	let setting_slider =  Gtk.Scale.new_with_range(0,60,1800,1);
	setting_slider.expand = true;	
	setting_slider.connect('value-changed', function(button,data) {		
		try {			
			let i = Math.round(button.get_value());			
			slider_label.label=_("Check every {0} sec: ").replace('{0}',i.toString());
			settings.set_int(setting,i);
		}
		catch (err) {					
		}
	});
	if (settings_slider[setting].help) {
		slider_label.set_tooltip_text(settings_slider[setting].help)	
	}
	hbox.pack_start(slider_label, true, true, 0);
	hbox.add(setting_slider);
	return hbox;
}

function createTextSetting(setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let setting_label = new Gtk.Label({label: settings_text[setting].label,
                                       xalign: 0 });
	let setting_text = new Gtk.Entry({});
	setting_text.text = settings.get_string(setting);
	setting_text.connect('changed', function(button,direction) {
		settings.set_string(setting, button.text );
	});
	if (settings_text[setting].help) {
		setting_label.set_tooltip_text(settings_text[setting].help)
	}
	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_text);
	return hbox;
}

function buildPrefsWidget() {
	let setting;
	let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
				border_width: 10 });
    let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL,
			margin: 20, margin_top: 10 });
	for (setting in settings_combo) {
		let hbox = createComboSetting(setting);
		vbox.add(hbox);
	}
	for (setting in settings_switch) {
		let hbox = createSwitchSetting(setting);
		vbox.add(hbox);
	}
	for (setting in settings_text) {
		let hbox = createTextSetting(setting);
		vbox.add(hbox);
	}
	for (setting in settings_slider) {
		let hbox = createSliderSetting(setting);
		vbox.add(hbox);
	}
	frame.add(vbox);
	frame.show_all();
	return frame;
}
