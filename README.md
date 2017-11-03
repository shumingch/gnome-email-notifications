# Gnome Email Notifications

Formerly Gmail Message Tray

Utilizes Gnome Online Accounts to login to Gmail and check your incoming email

## Installation

1. Install gnome-shell version 3.22 or later.

2. Sign in with your Google and/or Microsoft account in Gnome Online Accounts settings.

3. Either install from https://extensions.gnome.org/extension/1230/gmail-message-tray/
OR
run `git clone --depth 1 https://github.com/shumingch/gnome-email-notifications ~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com`

## Screenshot

![Gnome Email Notifications](screenshot.png "Gnome Email Notifications")

## Troubleshooting

1. If you are getting any errors after logging in and out of gnome, try rebooting or signing back in to Google.

1. If you are getting "Forbidden Error 403" when attempting to view Gmail emails, try changing the "Gmail account number" in the extension settings.  
 Your browser will have the number of the Gmail account in the URL.  
 Your first account will be at https://mail.google.com/mail/u/0 and has an account number of 0.  
 Your second acount will be at https://mail.google.com/mail/u/1 and has an account number of 1.  
 etc.

## Authors

Shuming Chan <shuming0207@gmail.com>

Adam Jabłoński <jablona123@gmail.com>

