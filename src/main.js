// @ts-check
/// <reference path="webmidi-types.d.ts"/>


import {MIDI, onMIDIFailure, onMIDISuccess, outputs} from "./midi.js";
import {send, sendAny, sendDeviceIdRequest, sendSysex} from "./midi-messages.js";
import {parseNumbersString} from "./utils.js";

//=============================================================================
//
//-----------------------------------------------------------------------------

function clearPorts(elementId) {
    document.getElementById(elementId).innerHTML = "";
}

//=============================================================================
// UI interaction
//-----------------------------------------------------------------------------

function onClickPortEnable(event) {
    let id = decodeURIComponent($(event.target).data("portId"));
    outputs[id].enabled = $(this).is(':checked');
}

function onClickBtSend(event) {

    const messageMode = $(this).data('msgMode').toUpperCase();
    const messageType = $(this).data('msgType').toUpperCase();
    const channel = parseInt($(`#${messageType}-ch`).val(), 10);
    const data1 = parseInt($(`#${messageType}-data1`).val());
    const data2 = parseInt($(`#${messageType}-data2`).val());

    send(messageMode, messageType, channel, data1, data2);
}

function onClickBtSendIDRequest() {
    sendDeviceIdRequest();
}

function onClickBtSendSysex() {
    sendSysex(parseNumbersString($("#sysex-data").val()));
}

function onClickBtSendBytes() {
    sendAny(parseNumbersString($("#any-data").val()));
}

function onClickBtClearMessages() {
    clearPorts("logentries");
}

function setupUIHandler() {
    $('#outputs').on('click', 'input.port-enable', onClickPortEnable);
    $('.btSend').on('click', onClickBtSend);
    $('#btSendIDRequest').on('click', onClickBtSendIDRequest);
    $('#btSendSysex').on('click', onClickBtSendSysex);
    $('#btSendBytes').on('click', onClickBtSendBytes);
    $('#btClearMessages').on('click', onClickBtClearMessages);

}

//=============================================================================
// Events and Messages
//-----------------------------------------------------------------------------

const t0 = Date.now();

const EVENT_API = 0;
const EVENT_MESSAGE = 1;
const DIRECTION_IN = 0;
const DIRECTION_OUT = 1;

function printEvent(description, css='') {
    const t = (Date.now() - t0) / 1000;
    let cls = null;
    document
        .getElementById("logentries")
        .insertAdjacentHTML("beforeend", `<div class='logentry ${css}'>${t.toFixed(3).padStart(7)} ${description}</div>`);
    document.getElementById("end-of-list").scrollIntoView({behavior: "instant", block: "end"});
}

export function logEvent(description) {
    printEvent("WedMIDI " + description);
}

export function logMessageIn(description) {
    printEvent("receive " + description);
}

export function logMessageOut(description) {
    printEvent("send    " + description, 'entry-msg-out');
}

export function logError(description) {
    printEvent("ERROR " + description, 'entry-error');
}

//=============================================================================
//
//-----------------------------------------------------------------------------

export function listInputsAndOutputs() {
    if (MIDI === null) return;
    clearPorts("outputs");
    clearPorts("inputs");
    const cls = null;
    MIDI.outputs.forEach(function(port, key) {
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" data-port-id="${encodeURIComponent(port.id)}" 
                      checked="${port.enabled ? 'true' : 'false'}">${port.manufacturer} ${port.name} (ID ${port.id})</div>`
        );
    });
    MIDI.inputs.forEach(function(port, key) {
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<div class="">${port.manufacturer} ${port.name} (ID ${port.id})</div>`);
    });
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
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
