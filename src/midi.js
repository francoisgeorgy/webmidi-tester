import {hs} from "./utils.js";
import {printInputsAndOutputs, logError, logEvent, logMessageIn, logMessageOut} from "./main.js";

const ENABLED_BY_DEFAULT = false;

/**
 *  @typedef WebMidi.MIDIAccess
 */
export var MIDI = null;

export var inputs = {};
export var outputs = {};

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
                if (input.id === id) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                logEvent(`remove <b>${inputLabel(id)}</b>`);
                delete (inputs[id]);
            }
        }

        // Inputs to add
        for (const input of MIDI.inputs.values()) {
            if (input.id in inputs) {
                inputs[input.id].connection = input.connection;
                continue;
            }
            // New input to add:
            logEvent(`add <b>${inputLabel(input.id)}</b>`);
            inputs[input.id] = {
                id: input.id,
                name: input.name ?? '',
                connection: input.connection,
                enabled: ENABLED_BY_DEFAULT
            };
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
                if (output.id === id) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                logEvent(`remove <b>${outputLabel(id)}</b>`);
                delete (outputs[id]);
            }
        }

        // outputs to add
        for (const output of MIDI.outputs.values()) {
            if (output.id in outputs) {
                continue;
            }
            logEvent(`add <b>${outputLabel(output.id)}</b>`);
            outputs[output.id] = {
                id: output.id,
                name: output.name ?? '',
                connection: output.connection,
                enabled: ENABLED_BY_DEFAULT
            };
        }
    }

    autoConnectInput();
    autoConnectOutput();
    printInputsAndOutputs();
}

/**
 *
 */
function autoConnectInput() {
    for (const id of getInputsSelection()) {
        if (id in inputs) {
            inputs[id].enabled = true;
        }
    }
}

/**
 *
 */
function autoConnectOutput() {
    for (const id of getOutputsSelection()) {
        if (id in outputs) {
            outputs[id].enabled = true;
        }
    }
}

/**
 *
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
 * @param id
 * @returns {WebMidi.MIDIOutput|null}
 */
export function outputById(id) {
    if (!id) return null;
    for (const port of MIDI.outputs.values()) {
        if (port.id === id) {
            return port;
        }
    }
    return null;
}

/**
 * @param id
 * @returns {string|string}
 */
function inputLabel(id) {
    return id ? `input <span class="port-name">${inputById(id)?.name}</span>` : 'input unknown';
}

/**
 * @param id
 * @returns {string|string}
 */
function outputLabel(id) {
    return id ? `output <span class="port-name">${outputById(id)?.name}</span>` : 'output unknown';
}

/**
 * @param id
 * @returns {string|string}
 */
function inputDebugLabel(id) {
    return id ? ('[IN ' + id.substring(0, 5) + ' ' + inputById(id)?.name + ']').trim() : '[IN -]';
}

/**
 * @param id
 * @returns {string|string}
 */
function outputDebugLabel(id) {
    return id ? ('[OUT ' + id.substring(0, 5) + ' ' + outputById(id)?.name + ']').trim() : '[OUT -]';
}

/**
 * @param {WebMidi.MIDIMessageEvent} message
 */
function onMidiMessage(message) {
    if (message instanceof MIDIMessageEvent) {
        logMessageIn(`[${hs(message.data)}] ${message.currentTarget.name}`);
    }
}

function onStateChange(event) {
    logEvent(`state changed to ${event?.port.connection} for ${event?.port.type} <span class="port-name">${event?.port.name}</span>`);
    updateInputsOutputs(event);
}

export function onMIDISuccess(midiAccess) {
    logEvent("Your browser supports WebMIDI.");
    logEvent("MIDI backend enabled");
    MIDI = midiAccess;
    MIDI.onstatechange = onStateChange;
    updateInputsOutputs(null);
}

export function onMIDIFailure(msg) {
    logEvent("Your browser supports WebMIDI.");
    logError("Access to WebMIDI is denied. Check your browser settings.");
}

//=============================================================================
// Prefs
//-----------------------------------------------------------------------------

export function saveInputsSelection() {
    let a = [];
    for (const id in inputs) {
        if (inputs[id].enabled) {
            a.push(id);
        }
    }
    localStorage.setItem('studiocode.dev.webmidi.tester.inputs', JSON.stringify(a));
}

function getInputsSelection() {
    return JSON.parse(localStorage.getItem('studiocode.dev.webmidi.tester.inputs') || "[]");
}

export function saveOutputsSelection() {
    let a = [];
    for (const id in outputs) {
        if (outputs[id].enabled) {
            a.push(id);
        }
    }
    localStorage.setItem('studiocode.dev.webmidi.tester.outputs', JSON.stringify(a));
}

function getOutputsSelection() {
    return JSON.parse(localStorage.getItem('studiocode.dev.webmidi.tester.outputs') || "[]");
}

