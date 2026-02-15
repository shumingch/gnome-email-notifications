
try {
    const prefs = imports.ui.main; // Try a standard shell import
    print("Found ui.main via imports");
} catch (e) {
    print("Could not import ui.main: " + e);
}

try {
    import('resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js')
        .then(m => print("Successfully imported prefs.js from resource"))
        .catch(e => print("Failed to import prefs.js from resource: " + e));
} catch (e) {
    print("Static import failed check (syntax error expected if not module): " + e);
}
