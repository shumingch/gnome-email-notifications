/*
 * Copyright (c) 2017 Gnome Email Notifications contributors
 *
 * Gnome Email Notifications Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gnome Email Notifications Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
"use strict";
const Me = imports.misc.extensionUtils.getCurrentExtension();
function Console() {
    this.extensionString = "[" +  Me.metadata['name'] + "] ";
}
Console.prototype.log = function (...args) {
    log(this.extensionString + args.join());
};
Console.prototype.error = function (err) {
    this.log(err.message, err.stack);
};
Console.prototype.json = function (obj) {
    this.log(JSON.stringify(obj));
};

var console = new Console();
