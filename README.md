# Gnome Email Notifications

Utilizes Gnome Online Accounts to login to Gmail/Outlook and check your incoming email

## Installation

1. Install gnome-shell version 3.22 or later.

2. Sign in with your Google and/or Microsoft account in Gnome Online Accounts settings.

3. Either install from https://extensions.gnome.org/extension/1230/gmail-message-tray/
OR
run `git clone --depth 1 https://github.com/shumingch/gnome-email-notifications ~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com`

## Screenshot

![Gnome Email Notifications](screenshot.png "Gnome Email Notifications")

## Troubleshooting

1. For any errors, try rebooting or signing back in to your Gnome Online Accounts. 
2. To see logs, enter `journalctl | grep "Gnome Email Notification"` into terminal. 

## Update

Extension now supports Notification Sound

Note: Beware of Initial Setup. Multiple unread mails can cause the extension to play the Notification sound multiple times in a row.