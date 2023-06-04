import {hs} from "./utils.js";
import {listInputsAndOutputs, logError, logEvent, logMessageIn, logMessageOut} from "./main.js";
import {loadPreferences, savePreferences} from "./preferences.js";

/**
 *  @typedef WebMidi.MIDIAccess
 interface WindowCustom extends Window {
        MIDI: WebMidi.MIDIAccess;
     }
 declare let window: WindowCustom;
 */
export var MIDI = null;

var inputInUse;
var outputInUse;
var inputs = {};
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
                connection: output.connection,
                enabled: true
            };
        }
    }

    listInputsAndOutputs();

}

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

/**
 * @param {WebMidi.MIDIMessageEvent} message
 */
function onMidiMessage(message) {
    if (message instanceof MIDIMessageEvent) {
        // console.log(message);
        let bytes = message.data;       // type is Uint8Array
        let channel = bytes[0] & 0x0F;  // MIDI channel
        // let type = bytes[0] & 0xF0;     // MIDI event type
        let port = message.currentTarget;
        logMessageIn("[" + hs(bytes) + "] Ch." + (channel + 1) + " " + port.name);
    }
}

function onStateChange(event) {
    logEvent(`state changed to ${event?.port.connection} for ${event?.port.type} <span class="port-name">${event?.port.name}</span> (ID ${event?.port.id})`);
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

export function onMIDISuccess(midiAccess) {
    logEvent("Your browser supports WebMIDI.");
    logEvent("MIDI backend enabled");
    // document.getElementById("details").classList.remove('hide');
    MIDI = midiAccess;
    MIDI.onstatechange = onStateChange;
    // connectInputs();
    // listInputsAndOutputs();
    updateInputsOutputs(null);
}

export function onMIDIFailure(msg) {
    logEvent("Your browser supports WebMIDI.");
    logError("Access to WebMIDI is denied. Check your browser settings.");
}
