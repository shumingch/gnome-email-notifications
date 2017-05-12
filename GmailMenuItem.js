"use strict";
/*
 * Copyright (c) 2012 Adam Jabłoński
 *
 * Gmail Notify Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Notify Extension is distributed in the hope that it will be useful, but
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
const Me = imports.misc.extensionUtils.getCurrentExtension();
const extension = Me.imports.extension;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const console = Me.imports.console.console;
const _DEBUG = true;

function GmailMenuItem() {
    this._init.apply(this, arguments);
}

GmailMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function (content, params, provider) {
        try {
            this.provider = typeof(provider) === 'undefined' ? "GOOGLE" : provider;
            if (_DEBUG) global.log('Gmail Menu Item Provider org:-' + provider + '-' + this.provider);
            if (this.provider === "MICROSOFT ACCOUNT") {
                content.icontype = "outlook-icon32.png";
            }
            PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

            this.label = new St.BoxLayout({vertical: false});

            let layout = new St.BoxLayout({vertical: true});

            // Display avatar

            let iconBox = new St.Bin({style_class: 'avatar-box'});
            iconBox._size = 48;

            iconBox.child = Clutter.Texture.new_from_file(extension.extensionPath + "/icons/" + content.icontype);
            iconBox.set_style("padding-right:10px;padding-left:10px;");
            this.label.add(iconBox);

            // subscription request message


            let dts = '';
            try {
                let dt = new Date(content.date);
                dts += dt.getFullYear().toString() + "-" + (dt.getMonth() + 1).toString() + "-" +
                    dt.getDate().toString() + " " + dt.getHours().toString() + ":" + dt.getMinutes().toString();
            }
            catch (err) {
                console.error(err);
            }
            dts += " " + content.from;
            let label = new St.Label({text: dts});
            if (_DEBUG) global.log('dts added');
            label.set_style("font-size:10px;");
            layout.add(label);
            let subtext = '';
            this.link = content.link;
            try {
                subtext += content.subject.length > 50 ? content.subject.substr(0, 50) + '...' : content.subject;
            }
            catch (err) {
                console.error(err);
            }
            let label1 = new St.Label({text: subtext});
            layout.add(label1);
            this.label.add(layout);

            this.actor.add_child(this.label);
        }
        catch (err) {
            console.error(err);
        }
    }


};
