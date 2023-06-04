
//=============================================================================
// Preferences
//-----------------------------------------------------------------------------

// import store from "storejs";

const LOCAL_STORAGE_KEY = "studiocode.webmidi-lab";

const DEFAULT_PREFERENCES = {
    input_id: null,      // web midi port ID
    output_id: null,     // web midi port ID
    theme: null
}

export function loadPreferences() {
    // const s = store.get(LOCAL_STORAGE_KEY);
    const s = null;
    return Object.assign({}, DEFAULT_PREFERENCES, s ? JSON.parse(s) : {});
}

export function savePreferences(options = {}) {
    // store(LOCAL_STORAGE_KEY, JSON.stringify(Object.assign({}, loadPreferences(), options)));
}
