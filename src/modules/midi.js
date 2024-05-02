const DEBUG = true;

const emptyMap = new Map();

let midi = {
    inputs: emptyMap,
    outputs: emptyMap
};

let requestPromise;

function logPort(message, port) {
    if (DEBUG) console.log(message + " ::", port.type, port.state, port.name);
}

let autoConnectRegex = null;

function autoConnect() {
    console.log("midi.autoConnect");
    for (const entry of midi.inputs) {
        const port = entry[1];
        if (port.name.match(autoConnectRegex)) {
            logPort("midi.autoConnect :: connecting to", port);
            listen(port);
        }
    }
}

/**
 * Connect (listen) all the port with a name matching portNameRegex
 * @param portNameRegex
 * @param applyToExisting
 */
export function setAutoConnect(portNameRegex, applyToExisting = true) {
    console.group("midi.setAutoconnect", portNameRegex);
    autoConnectRegex = portNameRegex;
    if (applyToExisting) autoConnect();
    console.groupEnd();
}

function listen(port, callback) {
    logPort("midi.listen :: start listening to", port);
    // port.onmidimessage = callback;
}

function unlisten(port) {
    logPort("midi.unlisten :: stop listening to", port);
    port.onmidimessage = null;
}

function statechange(e) {
    console.group("midi.statechange", e);
    const port = e.port;
    if (port.type === 'input') {
        if (port.state === 'connected') {
            listen(port);
        }
        else {
            unlisten(port);
        }
    }
    console.groupEnd();
}

function setup(m) {
    console.group("midi.setup", m)
    let entry, port;
    for (entry of midi.inputs) {
        port = entry[1];
        logPort("midi.setup input", port);
    }
    for (entry of midi.outputs) {
        port = entry[1];
        logPort("midi.setup output", port);
    }
    console.groupEnd();
}

export function requestMIDIAccess() {
    if (DEBUG) console.log("midi.requestAccess")
    // Cache the request so there's only ever one
    return requestPromise || (requestPromise = navigator.requestMIDIAccess ?
        navigator
            .requestMIDIAccess({ sysex: true })
            .then(function(midiAccess) {
                if (DEBUG) console.log('MIDI access granted');
                    midi = midiAccess;
                    setup(midi);
                    midi.onstatechange = statechange;
                    return midi;
            }, function() {
                if (DEBUG) console.log('MIDI access denied');
            }) :
        Promise.reject("This browser does not support Web MIDI.")
    );
}
