/*
 * Copyright (c) 2012 Adam Jablonski
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
"use strict";
function ImapMessage() {
    this._init();
}
ImapMessage.prototype = {
    _init: function () {
        this.from = "";
        this.subject = "";
        this.date = "";
        this.id = 0;
        this.link = "";
        this.safeid = "";
        this.icontype = "gmail-icon32.png"
    },
    set: function (prop, value) {
        switch (prop.toLowerCase()) {
            case "from":
                this.from = value;
                break;
            case "link":
                this.link = value;
                break;
            case "id":
                this.id = value;
                break;
            case "subject":
                this.subject = value;
                break;
            case "safeid":
                this.safeid = value;
                break;
            case "date":
                this.date = value;
                break;
        }
    }
};
