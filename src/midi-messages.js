
import {logMessageOut} from "./main.js";
import {MIDI, outputById, outputs} from "./midi.js";
import {hs} from "./utils.js";

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
        "PITCH_BEND" : 0xE0
    }
}

// let a = MIDI_MESSAGE['CHANNEL_MESSAGE']['NOTE_OFF'];

const SYSEX_START = 0xF0;
const SYSEX_END = 0xF7;

const SYSEX_ID_REQUEST = [0x7E, 0x00, 0x06, 0x01];

const WAIT_BETWEEN_MESSAGES = 50;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export function send(messageMode, messageType, channel, data1, data2) {
    console.log("send", messageMode, messageType, channel, data1, data2);
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
        sendChannelMessage(channel, MIDI_MESSAGE[messageMode][messageType], data1, data2);
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
    //TODO: clamp the numbers to 0..255
    _send(new Uint8Array([
        SYSEX_START,
        ...data,
        SYSEX_END
    ]));
}

/**
 * @param {number[]} data
 * @param {number[]} manufacturer
 * @returns {Uint8Array}
 */
export function sysex(data, manufacturer) {
    //TODO: clamp the numbers to 0..255
    return new Uint8Array([
        SYSEX_START,
        ...manufacturer,
        ...data,
        SYSEX_END
    ]);
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
 * function universalSysex(data: number[]): Uint8Array {
 * @param data
 * @returns {Uint8Array}
 */
// function universalSysex(data) {
//     //TODO: clamp the numbers to 0..255
//     return new Uint8Array([
//         SYSEX_START,
//         ...data,
//         SYSEX_END
//     ]);
// }

/**
 * function sysex(data: number[]): Uint8Array {
 * @param data
 * @returns {Uint8Array}
 */
// function sysex(data) {
//     //TODO: clamp the numbers to 0..255
//     return new Uint8Array([
//         SYSEX_START,
//         ...DA_SYSEX_MANUFACTURER_ID,
//         ...data,
//         SYSEX_END
//     ]);
//     return new Uint8Array([]);
// }

/**
 *
 * @param {Uint8Array} data
 */
function _send(data) {
    // console.log(outputs);
    console.log("_send", data, hs(data));
    for (const id in outputs) {
        console.log("send to ", id, outputs[id].name);
        if (!outputs[id].enabled) {
            console.log(`output port ${id} is disabled; skipping`);
            continue;
        }
        const port = outputById(id);
        if (port) {
            // console.log(`output port ${id} found`);
            //TODO: channel
            // let channel = 0;
            logMessageOut("[" + hs(data) + "] " + port.name)
            port.send(data);
        } else {
            console.warn(`output port ${id} not found`);
        }
    }
}
