# This Script is called from Notifier.js
# Override the script to have desired behaviour

# Currently, this script plays the Notification Sound

from subprocess import run

extension_location = '~/.local/share/gnome-shell/extensions/GmailMessageTray@shuming0207.gmail.com'
# Default location for extension when installed

# Command line audio player for playing Notification sound
# Feel free to use 'cvlc' or 'mpg321'
player = 'paplay'

run([player, extension_location + 'Sound.py'])
