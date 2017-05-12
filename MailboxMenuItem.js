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

function MailboxMenuItem() {
    this._init.apply(this, arguments);
}

MailboxMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function (text, params) {
        try {
            PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);
            this.label = new St.BoxLayout({vertical: false});
            let iconBox = new St.Bin({style_class: 'avatar-box'});
            iconBox._size = 48;
            iconBox.child = Clutter.Texture.new_from_file(extension.extensionPath + "/icons/mailbox.png");
            iconBox.set_style("padding-right:10px");
            this.label.add(iconBox);
            let mailbox = new St.Label({text: text});
            mailbox.set_style("font-size:14px;");
            this.label.add(mailbox);
            this.actor.add_child(this.label);
        }
        catch (err) {
            console.error(err);
        }
    },
    setProvider: function (provider) {
        this.provider = provider
    }

};
