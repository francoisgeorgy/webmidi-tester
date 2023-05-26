// @ts-check
/// <reference path="webmidi-types.d.ts"/>


/**
 *  @typedef WebMidi.MIDIAccess
 */
var MIDI = null;

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

function print(what, where, cls, reverse) {
    document.getElementById(where).insertAdjacentHTML(reverse ? "afterbegin" : "beforeend", "<div class='" + (cls || "") + "'>" + what + "</div>");
}

function success(msg) {
    print("&#10004; " + msg, "support", "success");
}

function failure(msg) {
    print("&#10008; " + msg, "support", "failure");
}

function clearContent(elementId) {
    document.getElementById(elementId).innerHTML = "";
}

function listInputsAndOutputs() {
    if (MIDI === null) return;
    clearContent("inputs");
    clearContent("outputs");
    MIDI.inputs.forEach(function(port, key) {
        print(port.manufacturer + " " + port.name, "inputs");
    });
    MIDI.outputs.forEach(function(port, key) {
        print(port.manufacturer + " " + port.name, "outputs");
    });
}

function connectInputs() {
    if (MIDI === null) return;
    MIDI.inputs.forEach(function(port, key) {
        port.onmidimessage = onMidiMessage;
    });
}

/**
 * @param {WebMidi.MIDIMessageEvent} message
 */
function onMidiMessage(message) {
    if (message instanceof MIDIMessageEvent) {
        let bytes = message.data;       // type is Uint8Array
        let channel = bytes[0] & 0x0F;  // MIDI channel
        // let type = bytes[0] & 0xF0;     // MIDI event type
        let port = message.currentTarget;
        print(" data: [" + hs(bytes) + "] - channel: " + (channel+1) + " - source: " + port.name, "messages", null, true);
    }
}

function onStateChange(event) {
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
}

function onMIDISuccess(midiAccess) {
    success("Your browser supports WebMIDI.");
    document.getElementById("details").classList.remove('hide');
    MIDI = midiAccess;
    MIDI.onstatechange = onStateChange;
    connectInputs();
    listInputsAndOutputs();
}

function onMIDIFailure(msg) {
    success("Your browser supports WebMIDI.");
    failure("Access to WebMIDI is denied. Check your browser settings.")
}

function test() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex:false}).then(onMIDISuccess, onMIDIFailure);
    } else {
        failure("Your browser does not support WebMIDI.");
        document.getElementById("unsupported").classList.remove('hide');
    }
}

function whenReadyDo(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyDo(test);
