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

function autoConnect(port = null) {

    //TODO: add option to connect "exclusive", i.e. disconnect all other ports

    console.log("midi.autoConnect", autoConnectRegex);

    for (const p of port ? [port] : [...midi.inputs.values()]) {
        if (p.name.match(autoConnectRegex)) {
            logPort("midi.autoConnect :: connecting to", p);
            listen(p);
        }
    }

    // if (port) {
    //     if (port.name.match(autoConnectRegex)) {
    //         logPort("midi.autoConnect :: connecting to", port);
    //         listen(port);
    //     }
    // } else {
    //     for (const entry of midi.inputs) {
    //         const port = entry[1];
    //         if (port.name.match(autoConnectRegex)) {
    //             logPort("midi.autoConnect :: connecting to", port);
    //             listen(port);
    //         }
    //     }
    // }

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
            // listen(port);
            autoConnect(port);
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
    if (DEBUG) console.log('%c midi.requestAccess ', 'background-color:yellow;color:blue;font-size:140%;');
    // Cache the request so there's only ever one
    if (requestPromise) console.log('%c using cached promise ', 'background-color:yellow;color:blue;font-size:140%;');
    return requestPromise || (requestPromise = navigator.requestMIDIAccess ?
        navigator
            .requestMIDIAccess({ sysex: true })
            .then(function(midiAccess) {
                if (DEBUG) console.group('%c MIDI access granted ', 'background-color:green;color:white;font-size:140%;');
                midi = midiAccess;
                setup(midi);
                midi.onstatechange = statechange;
                if (DEBUG) console.groupEnd();
                return midi;
            }, function() {
                if (DEBUG) console.log('%c MIDI access denied ', 'background-color:red;color:white;font-size:140%;');
            }) :
        Promise.reject("This browser does not support Web MIDI.")
    );
}
