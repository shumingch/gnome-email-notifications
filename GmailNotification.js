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
const console = Me.imports.console.console;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;

function GmailNotification(source, content) {
    this._init(source, content);
}

GmailNotification.prototype = {
    __proto__: MessageTray.Notification.prototype,

    _init: function (source, content) {
        try {
            MessageTray.Notification.prototype._init.call(this, source,
                _("New mail from %s").format(content.from), null);
            this.expanded = true;
            this._table.add_style_class_name('multi-line-notification');
            let blayout = new St.BoxLayout({vertical: false});
            let layout = new St.BoxLayout({vertical: true});
            let label = new St.Label({text: (new Date(content.date)).toLocaleString()});
            label.set_style("font-size:10px;");
            layout.add(label);
            let label1 = new St.Label({text: content.subject});
            layout.add(label1);
            blayout.add(layout);
            this.addActor(blayout);
        }
        catch (err) {
            console.error(err);
        }
    },

    _canExpandContent: function () {
        return true;
    },

    destroy: function () {
        MessageTray.Notification.prototype.destroy.call(this);
    }


};
