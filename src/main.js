// @ts-check
/// <reference path="webmidi-types.d.ts"/>


/**
 *  @typedef WebMidi.MIDIAccess
     interface WindowCustom extends Window {
        MIDI: WebMidi.MIDIAccess;
     }
     declare let window: WindowCustom;
 */
var MIDI = null;

var inputInUse;
var outputInUse;

var inputs = {};
var outputs= {};
// var inputs: Ports = {};
// var outputs: Ports = {};


//=============================================================================
//
//-----------------------------------------------------------------------------


/*
function print(what, where, cls, reverse) {
    document.getElementById(where).insertAdjacentHTML(reverse ? "afterbegin" : "beforeend", "<div class='" + (cls || "") + "'>" + what + "</div>");
}

function success(msg) {
    print("&#10004; " + msg, "support", "success");
}

function failure(msg) {
    print("&#10008; " + msg, "support", "failure");
}

*/
function clearContent(elementId) {
    document.getElementById(elementId).innerHTML = "";
}



//=============================================================================
// UI interaction
//-----------------------------------------------------------------------------

function onClickPortEnable(event) {
    console.log("click on ", event.target.id, event);
    let id = event.target.id.substring("enable-port-".length);
    inputs[id].enabled = $(`output#${event.target.id}`).is(':checked');
    console.log(outputs);
}

function setupUIHandler() {
    $('#outputs').on('click', 'input.port-enable', onClickPortEnable);
}

//=============================================================================
// Events and Messages
//-----------------------------------------------------------------------------

const time0 = Date.now();

// const log = [];

const EVENT_API = 0;
const EVENT_MESSAGE = 1;
const DIRECTION_IN = 0;
const DIRECTION_OUT = 1;

function printEvent(description) {
    // log.push({type: EVENT_API, description: "WedMIDI: " + description, timestamp: Date.now() - time0})
    let cls = null;
    document
        .getElementById("logentries")
        .insertAdjacentHTML("beforeend", "<div class='logentry " + (cls || "") + "'>" + description + "</div>");
    document.getElementById("end-of-list").scrollIntoView({behavior: "smooth", block: "end"});
}

function logEvent(description) {
    console.log("logEvent", description);
    // print({type: EVENT_API, description: "WedMIDI: " + description, timestamp: Date.now() - time0})
    printEvent("WedMIDI: " + description);
    // let cls = null;
    // document
    //     .getElementById("logentries")
    //     .insertAdjacentHTML("beforeend", "<div class='" + (cls || "") + "'>" + description + "</div>");
}

function logMessageIn(description) {
    console.log("logEvent", description);
    printEvent("receive: " + description);
    // log.push({
    //     type: EVENT_MESSAGE,
    //     timestamp: Date.now() - time0,
    //     description: "receive: " + description,
    //     direction: DIRECTION_IN
    // })
}

function logMessageOut(description) {
    console.log("logEvent", description);
    printEvent("send:    " + description);
    // log.push({
    //     type: EVENT_MESSAGE,
    //     timestamp: Date.now() - time0,
    //     description: "receive: " + description,
    //     direction: DIRECTION_IN
    // })
}

function logError(description) {
    console.log("logError", description);
    // print({type: EVENT_API, description: "WedMIDI: " + description, timestamp: Date.now() - time0})
    printEvent("ERROR: " + description);
    // let cls = null;
    // document
    //     .getElementById("logentries")
    //     .insertAdjacentHTML("beforeend", "<div class='" + (cls || "") + "'>" + description + "</div>");
}

// function displayEventsAndMessages() {
//     container = $("logentries");
//     document.getElementById(where).insertAdjacentHTML(reverse ? "afterbegin" : "beforeend", "<div class='" + (cls || "") + "'>" + what + "</div>");
// }

//=============================================================================
//
//-----------------------------------------------------------------------------


function listInputsAndOutputs() {
    if (MIDI === null) return;
    clearContent("outputs");
    clearContent("inputs");
    const cls = null;
    MIDI.outputs.forEach(function(port, key) {
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" id="enable-port-${port.id}"/>${port.manufacturer} ${port.name}</div>`
        );
    });
    MIDI.inputs.forEach(function(port, key) {
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<div class="">${port.manufacturer} ${port.name}</div>`);
    });
}

/*
function connectInputs() {
    if (MIDI === null) return;
    MIDI.inputs.forEach(function(port, key) {
        port.onmidimessage = onMidiMessage;
    });
}
*/

/**
 * event: WebMidi.MIDIConnectionEvent|null
 */
function updateInputsOutputs(event) {

    if (!MIDI) return;

    //
    // INPUTS
    //

    if (event === null || event.port.type === "input") {

        // Check for inputs to remove from the existing array (because they are no longer being reported by the MIDI back-end).
        for (const id of Object.keys(inputs)) {  // our array of inputs
            let remove = true;
            for (const input of MIDI.inputs.values()) {    // midi interface list of inputs
                // console.log("list", id, input.id, input.type, input.name, input.state, input.connection);
                if (input.id === id) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                // console.log("REMOVE INPUT", inputDebugLabel(inputs[id].id));
                // let p = inputById(id);
                // if (p) {
                //     //remove listeners
                //     console.log("connectInput: remove message listener", p.id, p.name);
                //     // @ts-ignore
                //     p.onmidimessage = null;
                // } else {
                //     console.log("connectInput: input not found", inputs[id].id, inputs[id].name);
                // }
                logEvent(`remove ${inputLabel(id)}`);
                delete (inputs[id]);
                releaseInput();
            }
        }

        // Inputs to add
        for (const input of MIDI.inputs.values()) {

            if (input.id in inputs) {
                // console.log("MidiStore.updateInputsOutputs input already added", input.id, input.type, input.name, input.state, input.connection, inputs[input.id].connection);
                inputs[input.id].connection = input.connection;
                continue;
            }

            // New input to add:
            // console.warn("MidiStore.updateInputsOutputs add input", input.id, input.type, input.name, input.state, input.connection);
            // console.log("MIDI add input", inputDebugLabel(input.id));
            logEvent(`add ${inputLabel(input.id)}`);
            inputs[input.id] = {
                id: input.id,
                name: input.name ?? '',
                connection: input.connection,
                enabled: false
            };
            // console.warn("MIDI updateInputsOutputs: add message listener", inputDebugLabel(input.id), input.onmidimessage, input);
            input.onmidimessage = onMidiMessage;
        }
    }

    //
    // OUTPUTS
    //
    if (event === null || event.port.type === "output") {

        for (const id of Object.keys(outputs)) {  // our array of outputs
            let remove = true;
            for (const output of MIDI.outputs.values()) {    // midi interface list of outputs
                // console.log("check", id, output.id, output.type, output.name, output.state, output.connection);
                if (output.id === id) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                // console.warn("remove", id);
                logEvent(`remove ${outputLabel(id)}`);
                delete (outputs[id]);
                releaseOutput();
            }
        }

        // outputs to add
        for (const output of MIDI.outputs.values()) {
            if (output.id in outputs) {
                // console.log("MidiStore.updateInputsOutputs output already added", output.id, output.type, output.name, output.state, output.connection, outputs[output.id].connection);
                continue;
            }
            // console.warn("MidiStore.updateInputsOutputs add output", output.id, output.type, output.name, output.state, output.connection);
            // console.log("MIDI add output", outputDebugLabel(output.id));
            logEvent(`add ${outputLabel(output.id)}`);
            outputs[output.id] = {
                id: output.id,
                name: output.name ?? '',
                connection: output.connection
            };
        }
    }

    listInputsAndOutputs();

}



//=============================================================================
// WebMIDI in puts and outputs management
//-----------------------------------------------------------------------------

/**
 *
 * @param id: string
 */
function useInput(id) {
    // console.log("MidiStore.useInput", id);
    if (inputInUse !== id) {   // do we select another device?
        if (inputById(id)) {
            console.log("MIDI useInput: ASSIGN INPUT", inputDebugLabel(id));
            inputInUse = id;
            savePreferences({input_id: id});
        }
    }
}

/**
 *
 */
function releaseInput() {
    // console.log("MidiStore.releaseInput");
    if (inputInUse) {
        const input = inputById(inputInUse);
        if (input) {
            // console.log("MidiStore.releaseInput: release event handler");
        }
    }
    inputInUse = "";
}

/**
 *
 * @param id: string
 */
function useOutput(id) {
    if (outputInUse !== id) {
        if (outputById(id)) {
            console.log("MIDI useOutput: ASSIGN OUTPUT", id);
            outputInUse = id;
            savePreferences({output_id: id});
        }
    }
}

/**
 *
 */
function releaseOutput() {
    outputInUse = "";
}

/**
 *
 */
function autoConnectInput() {
    if (inputInUse) return;
    const s = loadPreferences();
    if (s.input_id) {
        useInput(s.input_id);
    }
}

/**
 *
 */
function autoConnectOutput() {
    // console.log(`Midi.autoConnectOutput`);
    if (outputInUse) return;
    const s = loadPreferences();
    if (s.output_id) {
        useOutput(s.output_id);
    }
}

/**
 *
 * inputById(id: string): WebMidi.MIDIInput | null
 */
function inputById(id) {
    if (!id) return null;
    for (const port of MIDI.inputs.values()) {
        if (port.id === id) {
            return port;
        }
    }
    return null;
}

/**
 * outputById(id: string): WebMidi.MIDIOutput | null {
 * @param id
 * @returns {WebMidi.MIDIOutput|null}
 */
function outputById(id) {
    if (!id) return null;
    for (const port of MIDI.outputs.values()) {
        if (port.id === id) {
            return port;
        }
    }
    return null;
}

/**
 * inputLabel(id: string|null) {
 * @param id
 * @returns {string|string}
 */
function inputLabel(id) {
    return id ? `input <span class="port-name">${inputById(id)?.name}</span> (ID ${id})` : 'input unknown';
    // return id ? `input ${inputById(id)?.name} (${id.substring(0, 5)})` : 'input unknown';
}

/**
 * inputLabel(id: string|null) {
 * @param id
 * @returns {string|string}
 */
function outputLabel(id) {
    return id ? `output <span class="port-name">${outputById(id)?.name}</span> (ID ${id})` : 'output unknown';
    // return id ? `output ${outputById(id)?.name} ID ${id.substring(0, 5)}` : 'output unknown';
}


/**
 * inputLabel(id: string|null) {
 * @param id
 * @returns {string|string}
 */
function inputDebugLabel(id) {
    return id ? ('[IN ' + id.substring(0, 5) + ' ' + inputById(id)?.name + ']').trim() : '[IN -]';
}

/**
 * inputLabel(id: string|null) {
 * @param id
 * @returns {string|string}
 */
function outputDebugLabel(id) {
    return id ? ('[OUT ' + id.substring(0, 5) + ' ' + outputById(id)?.name + ']').trim() : '[OUT -]';
}


//=============================================================================
// WebMIDI setup
//-----------------------------------------------------------------------------

/**
 * @param {WebMidi.MIDIMessageEvent} message
 */
function onMidiMessage(message) {
    if (message instanceof MIDIMessageEvent) {
        let bytes = message.data;       // type is Uint8Array
        let channel = bytes[0] & 0x0F;  // MIDI channel
        // let type = bytes[0] & 0xF0;     // MIDI event type
        let port = message.currentTarget;
        logMessageIn("[" + hs(bytes) + "] Ch." + (channel+1) + " " + port.name);
    }
}

function onStateChange(event) {
    logEvent(`state changed to ${event?.port.connection} for ${event?.port.type} <span class="port-name">${event?.port.name}</span> (${event?.port.id})`);
    updateInputsOutputs(event);
    autoConnectInput();
    autoConnectOutput();

    /*
        const p = event.port;
        if (p.state === "connected") {
            if (p.type === "input") {
                if (!p.onmidimessage) {
                    p.onmidimessage = onMidiMessage;
                }
            }
        } else if (p.state === "disconnected") {
            if (p.type === "input") {
                if (p.onmidimessage) {
                    p.onmidimessage = null;
                }
            }
        }
        listInputsAndOutputs();
    */
}


function onMIDISuccess(midiAccess) {
    logEvent("Your browser supports WebMIDI.");
    logEvent("MIDI backend enabled");
    // document.getElementById("details").classList.remove('hide');
    MIDI = midiAccess;
    MIDI.onstatechange = onStateChange;
    // connectInputs();
    // listInputsAndOutputs();
    updateInputsOutputs(null);
}

function onMIDIFailure(msg) {
    logEvent("Your browser supports WebMIDI.");
    logError("Access to WebMIDI is denied. Check your browser settings.");
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex:false}).then(onMIDISuccess, onMIDIFailure);
    } else {
        logError("Your browser does not support WebMIDI.");
        document.getElementById("unsupported").classList.remove('hide');
    }
    setupUIHandler();
}

function whenReadyDo(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyDo(main);

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

function loadPreferences() {
    // const s = store.get(LOCAL_STORAGE_KEY);
    const s = null;
    return Object.assign({}, DEFAULT_PREFERENCES, s ? JSON.parse(s) : {});
}

function savePreferences(options = {}) {
    // store(LOCAL_STORAGE_KEY, JSON.stringify(Object.assign({}, loadPreferences(), options)));
}


//=============================================================================
// UTILS
//-----------------------------------------------------------------------------

/*
function padZero(str, len, char) {
    let s = "";
    let c = char || "0";
    let n = (len || 2) - str.length;
    while (s.length < n) s += c;
    return s + str;
}

function h(v) {
    return (v === null || v === undefined) ? "" : padZero(v.toString(16).toUpperCase(), 2);
}

function hs(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(h)).join(" ");
}
*/

const SYSEX_START = 0xF0;
const SYSEX_END = 0xF7;

/**
 * function universalSysex(data: number[]): Uint8Array {
 * @param data
 * @returns {Uint8Array}
 */
function universalSysex(data) {
    //TODO: clamp the numbers to 0..255
    return new Uint8Array([
        SYSEX_START,
        ...data,
        SYSEX_END
    ]);
}

/**
 * function sysex(data: number[]): Uint8Array {
 * @param data
 * @returns {Uint8Array}
 */
function sysex(data) {
//     //TODO: clamp the numbers to 0..255
//     return new Uint8Array([
//         SYSEX_START,
//         ...DA_SYSEX_MANUFACTURER_ID,
//         ...data,
//         SYSEX_END
//     ]);
    return new Uint8Array([]);
}

const WAIT_BETWEEN_MESSAGES = 50;

const wait = (ms) => new Promise(r => setTimeout(r, ms));


//=============================================================================
// UTILS hexstrings
//-----------------------------------------------------------------------------


/**
 * const padZero = (str: string, len: number, char: string = '0') => {
 * @param str
 * @param len
 * @param char
 * @returns {string}
 */
function padZero(str, len, char = '0') {
    let s = '';
    let n = (len || 2) - str.length;
    while (s.length < n) s += char;
    return s + str;
}

function b(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(2).toUpperCase(), 8);
};

function h(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(16).toUpperCase(), 2);
};

function d(v) {
    // noinspection JSCheckFunctionSignatures
    return (v === null || v === undefined) ? "" : padZero(v.toString(10).toUpperCase(), 3);
};

// hex string
// @ts-ignore
function hs(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join(" ");
}    // Array.from() is necessary to get a non-typed array

function hsbr(data, cols= 8, sepcol = '<br>', sep = '&nbsp;') {
    if (data === null || data === undefined) return "";
    // @ts-ignore
    const a = Array.from(data).map(n => h(n));  // Array.from() is necessary to get a non-typed array
    return a.reduce((acc, v, i) => {
        if (i === 0) {
            return v;
        } else if (i % cols) {
            return acc + sep + v;
        } else {
            return acc + sepcol + v;
        }
    }, '');
}

// dec string
/*
const ds = data => (data === null || data === undefined) ? "" : (Array.from(data).map(n => d(n))).join(" ");    // Array.from() is necessary to get a non-typed array

const dsbr = (data, cols= 8, sepcol = '<br>', sep = '&nbsp;') => {
    if (data === null || data === undefined) return "";
    const a = Array.from(data).map(n => d(n));  // Array.from() is necessary to get a non-typed array
    return a.reduce((acc, v, i) => {
        if (i === 0) {
            return v;
        } else if (i % cols) {
            return acc + sep + v;
        } else {
            return acc + sepcol + v;
        }
    }, '');
}
*/

// hex string compact
// @ts-ignore
function hsc(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join('');    // Array.from() is necessary to get a non-typed array
}

function fromHexString(str, sep) {
    let s = sep ? str.replace(sep, '') : str;
    if ((s.length % 2) > 0) {
        // TODO: throw an exception
        // if (global.dev) console.warn(`fromHexString: invalid hex string: ${s}`);
        return null;
    }
    let a = new Uint8Array(s.length / 2);
    for (let i=0; i < (s.length / 2); i++) {
        a[i] = parseInt(s.substr(i * 2, 2), 16);
    }
    return a;
}

