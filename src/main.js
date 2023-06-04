// @ts-check
/// <reference path="webmidi-types.d.ts"/>


import {MIDI, onMIDIFailure, onMIDISuccess, outputs} from "./midi.js";
import {send} from "./midi-messages.js";

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
    console.log("id is", id, outputs);
    outputs[id].enabled = $(`input#${event.target.id}`).is(':checked');
    console.log(outputs);
}

function onClickBtSend(event) {
    // console.log(event);
    // console.log('id', $( this ).parent().get( 0 ).id);
    const messageMode = $(this).data('msgMode').toUpperCase();
    const messageType = $(this).data('msgType').toUpperCase();
    const channel = parseInt($(this).siblings('.data-ch').val(), 10);
    const data1 = parseInt($(this).siblings('.data1').val());
    const data2 = parseInt($(this).siblings('.data2').val());
    // const data3 = $(this).siblings('.data3').val();
    // console.log($(this).data('msgType'))
    // console.log($(this).data('msgMode'))
    // console.log('data-ch', $( this ).siblings('.data-ch').val());
    // console.log('data1', $( this ).siblings('.data1').val());
    // console.log('data2', $( this ).siblings('.data2').val());
    // console.log('data3', $( this ).siblings('.data3').val());
    send(messageMode, messageType, channel, data1, data2);
}

function onClickBtClearMessages() {
    clearContent("logentries");
}

function setupUIHandler() {
    $('#outputs').on('click', 'input.port-enable', onClickPortEnable);
    $('.btSend').on('click', onClickBtSend);
    $('#btClearMessages').on('click', onClickBtClearMessages);

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

export function logEvent(description) {
    console.log("logEvent", description);
    // print({type: EVENT_API, description: "WedMIDI: " + description, timestamp: Date.now() - time0})
    printEvent("WedMIDI: " + description);
    // let cls = null;
    // document
    //     .getElementById("logentries")
    //     .insertAdjacentHTML("beforeend", "<div class='" + (cls || "") + "'>" + description + "</div>");
}

export function logMessageIn(description) {
    console.log("logEvent", description);
    printEvent("receive: " + description);
    // log.push({
    //     type: EVENT_MESSAGE,
    //     timestamp: Date.now() - time0,
    //     description: "receive: " + description,
    //     direction: DIRECTION_IN
    // })
}

export function logMessageOut(description) {
    console.log("logEvent", description);
    printEvent("send:    " + description);
    // log.push({
    //     type: EVENT_MESSAGE,
    //     timestamp: Date.now() - time0,
    //     description: "receive: " + description,
    //     direction: DIRECTION_IN
    // })
}

export function logError(description) {
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


export function listInputsAndOutputs() {
    if (MIDI === null) return;
    clearContent("outputs");
    clearContent("inputs");
    const cls = null;
    MIDI.outputs.forEach(function(port, key) {
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" id="enable-port-${port.id}" 
                      checked="${port.enabled ? 'true' : 'false'}"/>${port.manufacturer} ${port.name} (ID ${port.id})</div>`
        );
    });
    MIDI.inputs.forEach(function(port, key) {
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<div class="">${port.manufacturer} ${port.name} (ID ${port.id})</div>`);
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



//=============================================================================
// WebMIDI in puts and outputs management
//-----------------------------------------------------------------------------


//=============================================================================
// WebMIDI setup
//-----------------------------------------------------------------------------


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


//=============================================================================
// UTILS hexstrings
//-----------------------------------------------------------------------------
