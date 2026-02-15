# Gnome Email Notifications

Utilizes Gnome Online Accounts to login to Gmail/Outlook and check your incoming email.

## Features
- Gmail and Outlook (Microsoft 365) support via GNOME Online Accounts (GOA).
- Native GNOME Shell notifications with message tray integration.
- Focus-aware browser/client opening from notifications.
- Robust error handling for network and disposal issues.

## Installation

1. Install gnome-shell version 45 or later.
2. Install `gir1.2-goa` (GNOME Online Accounts GObject Introspection):
   ```bash
   sudo apt install gir1.2-goa-1.0
   ```
3. Sign in with your Google and/or Microsoft account in **GNOME Settings > Online Accounts**.
4. Either install from [GNOME Extensions](https://extensions.gnome.org/extension/1230/gmail-message-tray/) OR local install:
   ```bash
   git clone https://github.com/shumingch/gnome-email-notifications ~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com
   ```

## Contributing

We welcome contributions! Here is how to get started:

### Repository Structure
- `extension.js`: Main entry point for the extension.
- `EmailAccount.js`: Manages GOA accounts and orchestrates scanners/notifiers.
- `InboxScanner.js`: Logic for scanning both Gmail and Outlook.
- `Notifier.js`: Handles opening URLs and managing notification state.
- `NotificationFactory.js`: Low-level GNOME Shell notification creation.
- `Conf.js`: Settings management.
- `tests/`: Extensive unit test suite with mocks.
- `scripts/`: Development utility scripts.

### Development Workflow
1. **Setup**: Clone the repo and link it to your extensions folder.
2. **Testing**: We use a custom mocking framework to test logic without a full GNOME Shell environment.
   ```bash
   gjs -m tests/run_tests.js
   ```
3. **Packaging**: Use the provided script to create a production-ready zip (excludes tests/CI/etc).
   ```bash
   ./scripts/zip.sh
   ```

### Troubleshooting & Logs
- **Journal Logs**: See logs in real-time:
  ```bash
  journalctl -f -o cat /usr/bin/gnome-shell | grep "Gnome Email Notification"
  ```
- **Disposed Objects**: If you see "Object already disposed" errors, ensure you are managing the lifecycle of notification sources correctly (see `NotificationFactory.js`).

## Screenshot

![Gnome Email Notifications](screenshot.png "Gnome Email Notifications")

## License
GPL-2.0-or-later
