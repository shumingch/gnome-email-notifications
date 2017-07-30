# Email Message Tray Gnome Shell Extension

Formerly Gmail Message Tray

Utilizes Gnome Online Accounts to login to Gmail and check your incoming email

## Installation

1. Install gnome-shell version 3.22 or later.

2. Sign in with your Google and/or Microsoft account in Gnome Online Accounts settings.

3. Either install from https://extensions.gnome.org/extension/1230/gmail-message-tray/
OR
run `git clone --depth 1 https://github.com/shumingch/GmailMessageTray ~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com`

## Screenshot

![Email Message Tray](screenshot.png "Email Message Tray")

## Troubleshooting

If you are getting any errors after logging in and out of gnome, try rebooting or signing back in to Google.

If you are getting "Forbidden Error 403" when attempting to view Gmail emails,
try changing the "Gmail account number" in the extension settings. This number should be present in the
Gmail URL when you view it normally. e.g. "mail.google.com/mail/u/0" has an account number of 0.

## Authors

Adam Jabłoński <jablona123@gmail.com>

Shuming Chan <shuming0207@gmail.com>
