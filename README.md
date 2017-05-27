# Gmail Message Tray Gnome Shell Extension

Forked from Gmail Notify Gnome Shell Extension.

Utilizes Gnome Online Accounts to login to Gmail and check your incoming email

## Installation

1. Install gnome-shell version 3.22 or later.

2. Sign in with your Google account in Gnome Online Accounts settings.

3. Either install from https://extensions.gnome.org/extension/1230/gmail-message-tray/
OR
run `git clone --depth 1 https://github.com/shumingch/GmailMessageTray ~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com`

## Screenshot

![Gmail Message Tray](screenshot.png "Gmail Message Tray")

## Troubleshooting

If you are getting the message "Extension requires Goa,Soup,Gio,Gconf..."
you need to run `sudo apt-get install gir1.2-goa` or equivalent

If you are getting "GDBus.Error:org.gnome.OnlineAccounts.Error.notAuth" after logging in and out of gnome, try rebooting or signing back in to Google.

## Authors

Adam Jabłoński <jablona123@gmail.com>

Shuming Chan <shuming0207@gmail.com>
