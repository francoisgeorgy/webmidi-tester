
import {logError, logMessageOut} from "./main.js";
import {MIDI, outputById, outputs} from "./midi.js";
import {hs} from "./utils.js";
import parseMidi from "parse-midi";

//=============================================================================
// Messages
//-----------------------------------------------------------------------------

const MIDI_MESSAGE = {
    "CHANNEL_MESSAGE" : {
        "NOTE_OFF" : 0x80,
        "NOTE_ON" : 0x90,
        "POLY_PRESSURE" : 0xA0,
        "CC" : 0xB0,
        "PC" : 0xC0,
        "CHANNEL_PRESSURE" : 0xD0,
        "PITCH_BEND" : 0xE0,
        "NRPN" : 0x00
    }
}

const SYSEX_START = 0xF0;
const SYSEX_END = 0xF7;

const SYSEX_ID_REQUEST = [0x7E, 0x00, 0x06, 0x01];

export function send(messageMode, messageType, channel, data1, data2) {
    // console.log("send", messageMode, messageType, channel, data1, data2);
    if (!(messageMode in MIDI_MESSAGE)) {
        console.warn('invalid message mode', messageMode);
        return;
    }
    if (!(messageType in MIDI_MESSAGE[messageMode])) {
        console.warn('invalid message type', messageType);
        return;
    }
    if (messageMode === "CHANNEL_MESSAGE") {
        if (channel < 0 || channel > 15) {
            console.warn("invalid channel", channel);
            return;
        }
        // if (messageType === "NRPN") {
        //     sendChannelMessage(channel, MIDI_MESSAGE["CHANNEL_MESSAGE"]["CC"], data1, data2);
        // } else {
            sendChannelMessage(channel, MIDI_MESSAGE[messageMode][messageType], data1, data2);
        // }
    } else {
        console.log("not a channel message");
    }
}

export function sendChannelMessage(channel, message, data1, data2) {
    if (data2 === undefined || data2 === null || isNaN(data2)) {
        _send(new Uint8Array([
            (message & 0xF0) | (channel & 0x0F),
            data1 & 0x7F
        ]));
    } else {
        _send(new Uint8Array([
            (message & 0xF0) | (channel & 0x0F),
            data1 & 0x7F,
            data2 & 0x7F
        ]));
    }
}

/**
 * @param {number[]} data
 * @returns {Uint8Array}
 */
export function sendSysex(data) {
    _send(new Uint8Array([
        SYSEX_START,
        ...(data.filter(b => b !== SYSEX_START && b !== SYSEX_END)
                .map(b => b & 0x7F)),
        SYSEX_END
    ]));
}

export function sendAny(data) {
    _send(new Uint8Array(data.map(b => b & 0xFF)));
}

/**
 *
 * @param {string} outputId
 * @returns {void}
 */
export function sendDeviceIdRequest() {
    _send(new Uint8Array([
        SYSEX_START,
        ...SYSEX_ID_REQUEST,
        SYSEX_END
    ]));
}

/**
 *
 * @param {Uint8Array} data
 */
function _send(data) {
    if (data.length === 0) {
        logError("no data to send");
        return;
    }
    for (const id in outputs) {
        if (!outputs[id].enabled) {
            continue;
        }
        const port = outputById(id);
        if (port) {
            try {
                port.send(data);
                logMessageOut(`[${hs(data)}] ${port.name}`);
            } catch (error) {
                logError(`invalid data`);
            }
        } else {
            console.warn(`output port ${id} not found`);
        }
    }
}

const octaveMiddleC = 4;

function infoNote(number) {
    return `${number.toString().padStart(3)}  ${noteNameWithOctave(number, octaveMiddleC)}`.padEnd(9);
}

/**
 *
 * @param msg
 */
export function parseMessage(msg) {

    const p = parseMidi(msg.data);

    // if (!show.channels[p.channel - 1]) return null;

    /*
    switch (p.messageType) {

        case "noteoff":
        case "noteon":
        case "keypressure":
        case "controlchange":
        case "programchange":
        case "channelpressure":
        case "pitchbendchange":
            if (!show.voice) return;
            break;

        case "channelmodechange":
            if (!show.mode) return;
            break;

        default:
            if (msg.data[0] === 0xF1) {             // MIDI Time Code Quarter Frame
                if (!show.common) return;
            } else if (msg.data[0] === 0xF2) {      // Song Position Pointer
                if (!show.common) return;
            } else if (msg.data[0] === 0xF3) {      // Song Select
                if (!show.common) return;
            } else if (msg.data[0] === 0xF6) {      // Tune Request
                if (!show.common) return;
            } else if (msg.data[0] === 0xF7) {      // End of System Exclusive  // TODO: special treatment?
                if (!show.common) return;
            } else if (msg.data[0] === 0xF8) {      // timing clock
                if (!show.realtime) return;
            } else if (msg.data[0] === 0xFA) {      // start
                if (!show.realtime) return;
            } else if (msg.data[0] === 0xFB) {      // continue
                if (!show.realtime) return;
            } else if (msg.data[0] === 0xFC) {      // stop
                if (!show.realtime) return;
            } else if (msg.data[0] === 0xFE) {      // active sensing
                if (!show.realtime) return;
            } else if (msg.data[0] === 0xFF) {      // system reset
                if (!show.realtime) return;

            } else if (msg.data[0] === 0xF0 && msg.data[msg.data.length-1] === 0xF7) {
                if (!show.sysex) return;
                // if (m.data[1] === 0x7E && m.data[2] === 0x00 && m.data[3] === 0x06) {
                //     m.type = "ID resp.";
                // } else {
                //     m.type = "SysEx";
                // }
            } else {
                // m.type = "unknown";      // TODO
            }
            break;
    }
    */

    // const last_timestamp = messages.length > 0 ? messages[0].timestamp : 0;

    // const m = {};
    // m.direction = "receive";
    // m.timestamp = msg.timestamp;
    // m.timestamp = Date.now();
    // m.timedelta = last_timestamp === 0 ? 0 : (msg.timestamp - last_timestamp);
    // m.data = msg.data;
    // m.source = msg.target.name;
    // m.sysex = false;

    // display properties
    // const delta = m.timedelta = last_timestamp === 0 ? 0 : (msg.timestamp - last_timestamp);
    // const delta = m.timedelta = last_timestamp === 0 ? 0 : (m.timestamp - last_timestamp);
    // m.time_delta = delta.toFixed(2);
    // m.raw_hex = hsbr(m.data);
    // m.raw_dec = dsbr(m.data);
    // m.info_note = '';
    // m.info_cc = '';
    // m.info = '';
    // m.info = hs(m.data);

    // if (global.dev) console.log("appendMessageIn", p);

    let info = '';

    let channel = parseInt(p.channel, 10);

    switch (p.messageType) {
        case "noteoff":
            info = `Ch. ${channel} Note OFF  ${infoNote(p.key)} velocity ${p.velocity}`;
            break;
        case "noteon":
            info = `Ch. ${channel} Note ON   ${infoNote(p.key)} velocity ${p.velocity}`;
            break;
        case "keypressure":
            info = `Ch. ${channel} Key Pressure note ${infoNote(p.key)} pressure ${p.pressure}`;
            break;
        case "controlchange":
            const ccpc = (100 * p.controlValue / 127).toFixed(0).padStart(4, ' ')
            const cc = `#${p.controlNumber}`
            info = `Ch. ${channel} CC${cc.padStart(4)}  value ${(p.controlValue || 0).toString().padStart(3)}  ${ccpc}%`;
            break;
        case "channelmodechange":
            info = `Ch. ${channel} Channel Mode Change ${p.controlNumber} ${p.channelModeMessage}`;
            break;
        case "programchange":
            info = `Ch. ${channel} Program Change ${p.program === 0 ? '0' : (p.program || '')}`;
            break;
        case "channelpressure":
            info = `Ch. ${channel} Channel Pressure ${p.pressure}`;
            break;
        case "pitchbendchange":
            // const pc = (100 * p.pitchBendMultiplier).toFixed(2).padStart(7, ' ')
            const pc = (100 * p.pitchBendMultiplier).toFixed(0).padStart(4, ' ')
            const semi = (bendRange * p.pitchBendMultiplier).toFixed(2).padStart(6, ' ');
            info =  `Ch. ${channel} Pitch Bend ${p.pitchBend.toString().padStart(6, ' ')}  ${pc}%  ${semi} semitones`;
            break;
        default:
            // see also http://www.somascape.org/midi/tech/spec.html#usx7E7E
            if (data[0] === 0xF8) {
                // sysex = true;
                info = "Clock beat";
            } else if (data[0] === 0xF2) {
                // sysex = true;
                info = "Song Position Pointer";
            } else if (data[0] === 0xF3) {
                // sysex = true;
                info = "Song Select";
            } else if (data[0] === 0xF6) {
                // sysex = true;
                info = "Tune Request";
            } else if (data[0] === 0xFA) {
                // sysex = true;
                info = "Clock Start";
            } else if (data[0] === 0xFB) {
                // sysex = true;
                info = "Clock Continue";
            } else if (data[0] === 0xFC) {
                // sysex = true;
                info = "Clock Stop";
            } else if (data[0] === 0xFE) {
                // sysex = true;
                info = "Active Sensing";
            } else if (data[0] === 0xFF) {
                // sysex = true;
                info = "System Reset";
            } else if (data[0] === 0xF0 && data[data.length-1] === 0xF7) {
                // sysex = true;
                // F0 7E 00 06 01 F7
                // F0 7E 00 06 02 00 02 17 0B 0B 00 00 00 0B F7
                if (data[1] === 0x7E && data[2] === 0x00 && data[3] === 0x06) {
                    info = "ID resp.";
                } else {
                    info = "SysEx";
                }
            } else {
                info = "unknown";
            }
            break;
    }
}

// http://www.sengpielaudio.com/calculator-notenames.htm

// MIDI note numbers (midi files)
//
// Octave notation is given here in the international standard ISO system, formerly known as
// the ASA (Acoustical Society of America) or ANSI system. In this system, middle C (MIDI note number 60) is C4;
// octaves start with C, so the B just below (MIDI number 59) is B3.
// The lowest note of the normal modern piano is A0 (MIDI 21), though Boesendorfer Imperials go down to F0 or even C0.
// The highest note of the piano is C8 (MIDI 108).


// export const MIDDLE_OCTAVE = 2;
// export const MIDDLE_C = 36;     // C3 is better centered than C4 on the LinnStrument

export const NOTE_NAME_NO_OCTAVE = [    // index 0 must be 'C', like NOTE_NAME
    "C", // 0
    "C#", // 1
    "D", // 2
    "D#", // 3
    "E", // 4
    "F", // 5
    "F#", // 6
    "G", // 7
    "G#", // 8
    "A", // 9
    "A#", // 10
    "B", // 11
];

export const NOTE_NAME = [              // index 0 must be a 'C', like NOTE_NAME_NO_OCTAVE
    "C-1", // 0
    "C#-1", // 1
    "D-1", // 2
    "D#-1", // 3
    "E-1", // 4
    "F-1", // 5
    "F#-1", // 6
    "G-1", // 7
    "G#-1", // 8
    "A-1", // 9
    "A#-1", // 10
    "B-1", // 11
    "C0", // 12
    "C#0", // 13
    "D0", // 14
    "D#0", // 15
    "E0", // 16
    "F0", // 17
    "F#0", // 18
    "G0", // 19
    "G#0", // 20
    "A0", // 21
    "A#0", // 22
    "B0", // 23
    "C1", // 24
    "C#1", // 25
    "D1", // 26
    "D#1", // 27
    "E1", // 28
    "F1", // 29
    "F#1", // 30
    "G1", // 31
    "G#1", // 32
    "A1", // 33
    "A#1", // 34
    "B1", // 35
    "C2", // 36
    "C#2", // 37
    "D2", // 38
    "D#2", // 39
    "E2", // 40
    "F2", // 41
    "F#2", // 42
    "G2", // 43
    "G#2", // 44
    "A2", // 45
    "A#2", // 46
    "B2", // 47
    "C3", // 48
    "C#3", // 49
    "D3", // 50
    "D#3", // 51
    "E3", // 52
    "F3", // 53
    "F#3", // 54
    "G3", // 55
    "G#3", // 56
    "A3", // 57
    "A#3", // 58
    "B3", // 59
    "C4", // 60
    "C#4", // 61
    "D4", // 62
    "D#4", // 63
    "E4", // 64
    "F4", // 65
    "F#4", // 66
    "G4", // 67
    "G#4", // 68
    "A4", // 69
    "A#4", // 70
    "B4", // 71
    "C5", // 72
    "C#5", // 73
    "D5", // 74
    "D#5", // 75
    "E5", // 76
    "F5", // 77
    "F#5", // 78
    "G5", // 79
    "G#5", // 80
    "A5", // 81
    "A#5", // 82
    "B5", // 83
    "C6", // 84
    "C#6", // 85
    "D6", // 86
    "D#6", // 87
    "E6", // 88
    "F6", // 89
    "F#6", // 90
    "G6", // 91
    "G#6", // 92
    "A6", // 93
    "A#6", // 94
    "B6", // 95
    "C7", // 96
    "C#7", // 97
    "D7", // 98
    "D#7", // 99
    "E7", // 100
    "F7", // 101
    "F#7", // 102
    "G7", // 103
    "G#7", // 104
    "A7", // 105
    "A#7", // 106
    "B7", // 107
    "C8", // 108
    "C#8", // 109
    "D8", // 110
    "D#8", // 111
    "E8", // 112
    "F8", // 113
    "F#8", // 114
    "G8", // 115
    "G#8", // 116
    "A8", // 117
    "A#8", // 118
    "B8", // 119
    "C9", // 120
    "C#9", // 121
    "D9", // 122
    "D#9", // 123
    "E9", // 124
    "F9", // 125
    "F#9", // 126
    "G9" // 127
];


export function noteNameWithOctave(number, octaveC60 = 3) {
    const note = number % 12;
    const octave = (number - note) / 12;
    const delta = (60 / 12) - octaveC60;
    return `${NOTE_NAME_NO_OCTAVE[note]}${octave - delta}`;
}

export function octave(note) {
    return Math.floor(note / 12);
}
