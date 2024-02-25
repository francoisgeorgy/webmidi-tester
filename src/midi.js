import {hs} from "./utils.js";
import {printInputsAndOutputs, logError, logEvent, logMessageIn, logMessageOut} from "./main.js";
// import {loadPreferences, savePreferences} from "./preferences.js";

/**
 *  @typedef WebMidi.MIDIAccess
 */
export var MIDI = null;

var inputInUse;
var outputInUse;
// var inputs = {};
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
                // console.log("list", id, input.id, input.type, input.name, input.state, input.connection);
                if (input.id === id) {
                    remove = false;
                    break;
                }
            }
            if (remove) {
                logEvent(`remove ${inputLabel(id)}`);
                delete (inputs[id]);
                releaseInput();
            }
        }

        // Inputs to add
        for (const input of MIDI.inputs.values()) {
            if (input.id in inputs) {
                inputs[input.id].connection = input.connection;
                continue;
            }
            // New input to add:
            logEvent(`add ${inputLabel(input.id)}`);
            inputs[input.id] = {
                id: input.id,
                name: input.name ?? '',
                connection: input.connection,
                enabled: true
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
                continue;
            }
            logEvent(`add ${outputLabel(output.id)}`);
            outputs[output.id] = {
                id: output.id,
                name: output.name ?? '',
                connection: output.connection,
                enabled: true
            };
        }
    }

    printInputsAndOutputs();

}

/**
 *
 */
function releaseInput() {
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
            outputInUse = id;
            // savePreferences({output_id: id});
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
    // const s = loadPreferences();
    // if (s.input_id) {
    // }
}

/**
 *
 */
function autoConnectOutput() {
    if (outputInUse) return;
    // const s = loadPreferences();
    // if (s.output_id) {
    // }
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
    return id ? `input <span class="port-name">${inputById(id)?.name}</span> (ID ${id})` : 'input unknown';
}

/**
 * @param id
 * @returns {string|string}
 */
function outputLabel(id) {
    return id ? `output <span class="port-name">${outputById(id)?.name}</span> (ID ${id})` : 'output unknown';
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
    logEvent(`state changed to ${event?.port.connection} for ${event?.port.type} <span class="port-name">${event?.port.name}</span> (ID ${event?.port.id})`);
    updateInputsOutputs(event);
    autoConnectInput();
    autoConnectOutput();
}

export function onMIDISuccess(midiAccess) {
    logEvent("Your browser supports WebMIDI.");
    logEvent("MIDI backend enabled");
    // document.getElementById("details").classList.remove('hide');
    MIDI = midiAccess;
    MIDI.onstatechange = onStateChange;
    updateInputsOutputs(null);
}

export function onMIDIFailure(msg) {
    logEvent("Your browser supports WebMIDI.");
    logError("Access to WebMIDI is denied. Check your browser settings.");
}
