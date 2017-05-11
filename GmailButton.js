"use strict";
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const Imap = Me.imports.imap;
const Main = imports.ui.main;
const _DEBUG = true;
const extension = Me.imports.extension;
const x = extension;

function GmailButton(extensionPath) {
    this._init(extensionPath);
}

GmailButton.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function (extensionPath) {
        try {
            PanelMenu.Button.prototype._init.call(this, 0.0);
            this._label = new St.Bin({
                style_class: 'panel-button', reactive: true,
                can_focus: true,
                x_fill: true,
                y_fill: false,
                track_hover: true
            });
            this._box = new St.BoxLayout();

            this._icon_gray = Clutter.Texture.new_from_file(extensionPath + "/icons/gmaillogo-notifier-gray.svg");
            this._icon_red = Clutter.Texture.new_from_file(extensionPath + "/icons/gmaillogo-notifier-red.svg");
            this._icon = this._icon_gray;
            this._box.insert_child_at_index(this._icon_gray, 1);
            this._box.insert_child_at_index(this._icon_red, 1);
            this.text = new St.Label({text: "0(0)"});
            this.etext = new St.Label({text: ""});
            this._box.insert_child_at_index(this.text, 2);
            this._box.insert_child_at_index(this.etext, 3);
            this._label.set_child(this._box);

            this.actor.add_actor(this._label);
        } catch (err) {
            global.log("Button init", err.message);
        }

    },

    showNumbers: function (show) {
        try {
            if (show === 0) {

                this.text.hide();
                this.etext.show();
            }
            else {

                this.text.show();
                this.etext.hide();
            }
        }
        catch (err) {
            global.log("Show Numbers" + err.message);
        }

    },
    _showNoMessage: function (provider) {
        provider = typeof(provider) === 'undefined' ? 'GOOGLE' : provider;
        if (_DEBUG) global.log("Gmail set content: no message");
        try {
            let note = new Imap.ImapMessage();
            note.date = new Date();
            note.subject = _('No new messages');
            let msg = new GmailMenuItem(note, {
                reactive: true
            }, provider);
            msg.connect('activate', extension._showHello);
            this.menu.addMenuItem(msg, 0);
            this.msgs.push(msg)
        } catch (err) {
            global.log(err.message);
        }
    },
    _showError: function (err) {
        if (_DEBUG) global.log("_showError: no message");
        try {
            let note = new Imap.ImapMessage();
            note.date = new Date();
            note.subject = _(err);
            let msg = new GmailMenuItem(note, {
                reactive: true
            });
            msg.connect('activate', _browseGn);
            this.menu.addMenuItem(msg, 0);
            this.msgs.push(msg)
        } catch (err) {
            global.log(err.message);
        }
    },
    _onButtonPress: function (actor, event) {
        if (_DEBUG) global.log("Button pres" + event.get_button().toString());
        if (event.get_button() === 1) {
            try {
                if (!this.menu.isOpen) {
                    let monitor = Main.layoutManager.primaryMonitor;
                    this.menu.actor.style = ('max-height: ' +
                    Math.round(monitor.height - Main.panel.actor.height) +
                    'px;');
                }
                if (this.submenu !== null && typeof(this.submenu) !== 'undefined') {
                    this.submenu.destroy();
                }
                this.menu.toggle();
            }
            catch (err) {
                global.log("onButtonPress" + err.message);
            }

        }
        else {
            onTimer();
        }
    },
    _onDestroy: function () {
    },

    setIcon: function (n) {

        if (n > 0 || Me.nVersion > Me._version) {
            this._icon = this._icon_red.show();
            this._icon = this._icon_gray.hide();
        }
        else {
            this._icon = this._icon_gray.show();
            this._icon = this._icon_red.hide();
        }

    }
};

GmailButton.prototype.setContent = function (content, add, mailbox, provider) {
    add = typeof(add) === 'undefined' ? 0 : add;
    mailbox = typeof(mailbox) === 'undefined' ? '' : mailbox;
    provider = typeof(provider) === 'undefined' ? 'GOOGLE' : provider;
    try {
        if (_DEBUG) global.log("Gmail set content: 1");
        if (add === 0) {
            Main.panel.menuManager.removeMenu(this.menu);
            this.menu.destroy();
            this.menu = new PopupMenu.PopupMenu(this.actor, 0.0, St.Side.TOP);
            this.menu.actor.add_style_class_name('panel-menu');
            this.menu.connect('open-state-changed', extension.Lang.bind(this, this._onOpenStateChanged));
            this.menu.actor.connect('key-press-event', extension.Lang.bind(this, this._onMenuKeyPress));
            Main.uiGroup.add_actor(this.menu.actor);
            this.menu.actor.hide();
            this.msgs = [];
            this.boxes = [];
        }
        if (_DEBUG) global.log("Gmail set content: 2");
        if (typeof(content) !== 'undefined') {
            if (_DEBUG) global.log("Gmail set content: 3");

            if (content.length > 0) {

                if (_DEBUG) global.log("Gmail set content: 4");
                for (let k = 0; k < Math.min(content.length, 10); k++) {
                    let msg = new extension.GmailMenuItem(content[k], {
                        reactive: true
                    });
                    msg.connect('activate', extension._showHello);
                    this.menu.addMenuItem(msg, 0);
                    this.msgs.push(msg);
                }
            }
            else {

                this._showNoMessage(provider);
            }
            let mbox = new extension.MailboxMenuItem(mailbox);
            mbox.setProvider(provider);
            mbox.connect('activate', extension._showHello);
            this.boxes.push(mbox);
            this.menu.addMenuItem(mbox, 0);
        }
        else {
            this._showNoMessage();
        }
        if (extension.nVersion > extension._version) {
            let note = new Imap.ImapMessage();
            note.date = new Date();
            note.from = "Gmail Notify";
            note.subject = _('There is newer version of this extension: %s - click to download').format(extension.nVersion);
            let msg = new GmailMenuItem(note, {
                reactive: true
            });
            msg.connect('activate', _browseGn);
            this.menu.addMenuItem(msg);

        }

    } catch (err) {
        log("Gmail set content:", err.message, err.stack)
    }
    Main.panel.menuManager.addMenu(this.menu);
};
