"use strict";
const Me = imports.misc.extensionUtils.getCurrentExtension();
const MessageTray = imports.ui.messageTray;
const Clutter = imports.gi.Clutter;
const _DEBUG = true;

function GmailNotificationSource() {
    this._init();
}

GmailNotificationSource.prototype = {
    __proto__: MessageTray.Source.prototype,

    _init: function () {
        try {
            if (_DEBUG) global.log("Entering Nofy source create ");
            MessageTray.Source.prototype._init.call(this, _("New gmail message"), "");
            this._setSummaryIcon(this.createNotificationIcon());
            this._nbNotifications = 0;
        }
        catch (err) {
            global.log('Err: GmainNotificationSource Init:' + err.message);
        }
    },

    notify: function (notification) {
        try {
            MessageTray.Source.prototype.notify.call(this, notification);
            this._nbNotifications += 1;
            // Display the source while there is at least one notification
            notification.connect('destroy', me.Lang.bind(this, () => {
                this._nbNotifications -= 1;
                if (this._nbNotifications === 0)
                    this.destroy();
            }));
        }
        catch (err) {
            global.log('Err: GmainNotificationSource notify:' + err.message);
        }
    },

    createNotificationIcon: function () {
        try {
            return Clutter.Texture.new_from_file(extensionPath + "/icons/gmail-icon48.png");
        }
        catch (err) {
            global.log('Err: Crea noti icon:' + err.message);
        }
    }

};
