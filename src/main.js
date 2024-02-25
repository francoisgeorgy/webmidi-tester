// @ts-check
/// <reference path="webmidi-types.d.ts"/>

import {MIDI, onMIDIFailure, onMIDISuccess, inputs, outputs} from "./midi.js";
import {send, sendAny, sendDeviceIdRequest, sendSysex} from "./midi-messages.js";
import {hs, hs0x, parseNumbersString} from "./utils.js";

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

function onSliderChange(event) {
    console.log('slider change', event.target.value);
}
function onSliderInput(event) {
    console.log('slider input', event.target.value);
}

function onClickBtSendIDRequest() {
    sendDeviceIdRequest();
}

function onClickBtSendSysex() {

    sendSysex(parseNumbersString($("#sysex-data").val()));

    // console.log($('#message-sysex-name'));
    let n = $('#message-sysex-name').val() || '';
    // console.log('onClickBtSendSysex', n);

    if (n.trim()) {
        saveMessage(n, parseNumbersString($("#sysex-data").val()));
        // $.localStorage.setItem(n, parseNumbersString($("#sysex-data").val()));
        displaySavedMessages();

        $('#message-sysex-name').val('');
    }
}

// function onClickBtSendSysexAndSave() {
//     sendSysex(parseNumbersString($("#sysex-data").val()));
// }

function onClickBtSendBytes() {
    sendAny(parseNumbersString($("#any-data").val()));

    let n = $('#message-any-name').val() || '';
    // console.log('onClickBtSendSysex', n);

    if (n.trim()) {
        saveMessage(n, parseNumbersString($("#any-data").val()));
        // $.localStorage.setItem(n, parseNumbersString($("#sysex-data").val()));
        displaySavedMessages();

        $('#message-any-name').val('');
    }

}

// function onClickBtSendBytesAndSave() {
//     sendAny(parseNumbersString($("#any-data").val()));
// }

function onClickBtClearMessages() {
    clearPorts("logentries");
}

function selectAllInputs() {
    for (const id in inputs) {
        inputs[id].enabled = true;
    }
    printInputsAndOutputs();
    return false;
}

function unselectAllInputs() {
    for (const id in inputs) {
        inputs[id].enabled = false;
    }
    printInputsAndOutputs();
    return false;
}

function selectAllOutputs() {
    for (const id in outputs) {
        outputs[id].enabled = true;
    }
    printInputsAndOutputs();
    return false;
}

function unselectAllOutputs() {
    for (const id in outputs) {
        outputs[id].enabled = false;
    }
    printInputsAndOutputs();
    return false;
}

function setupUIHandler() {

    console.log("setupUIHandler");

    $('#outputs').on('click', 'input.port-enable', onClickPortEnable);
    $('.btSend').on('click', onClickBtSend);
    $('input.slider').on('change', onSliderChange);
    $('input.slider').on('input', onSliderInput);
    $('#btSendIDRequest').on('click', onClickBtSendIDRequest);
    $('#btSendSysex').on('click', onClickBtSendSysex);
    $('#btSendBytes').on('click', onClickBtSendBytes);
    // $('#btSendSysexAndSave').on('click', onClickBtSendSysexAndSave);
    // $('#btSendBytesAndSave').on('click', onClickBtSendBytesAndSave);
    $('#btClearMessages').on('click', onClickBtClearMessages);
    $('#select-inputs-all').on('click', selectAllInputs);
    $('#select-inputs-none').on('click', unselectAllInputs);
    $('#select-outputs-all').on('click', selectAllOutputs);
    $('#select-outputs-none').on('click', unselectAllOutputs);

    $('#clear-saved-messages').on('click', clearSavedMessages);

    displaySavedMessages();

}

//=============================================================================
// Save
//-----------------------------------------------------------------------------

function saveMessage(name, data) {
    let col = getMessages();
    if (data == null && name in col) {
        delete col[name];
    } else {
        col[name] = data;
    }
    localStorage.setItem('studiocode.dev.webmidi.tester.messages', JSON.stringify(col));
}

function getMessages() {
    return JSON.parse(localStorage.getItem('studiocode.dev.webmidi.tester.messages') || "{}");
}

function getSavedMessageName(event) {
    console.log("getSavedMessageName", event);
    // let messages = getMessages();
    return $(event.target).data('savedMsg');
}
function getSavedMessage(event) {
    console.log("getSavedMessage", event);
    let messages = getMessages();
    let name = getSavedMessageName(event);
    if (name in messages) {
        console.log('getSavedMessage', messages, messages[name])
        return messages[name];
    } else {
        return null;
    }
}

function sendSavedMessage(event) {
    let data = getSavedMessage(event);
    if (data) {
        console.log("sendSavedMessage", data);
        sendAny(data);
    }
    // let p = $(event.target).parent();
    // let d = $(event.target);
    // console.log('parent:', p.id, $(p).data('msgMode'));
    // console.log('parent:', d, d.data, d.data('savedMsg'));
}

function editSavedMessage(event) {
    let data = getSavedMessage(event);
    if (data) {
        console.log("editSavedMessage", data);
        $("#any-data").val(hs0x(data));
    }
    // let p = $(event.target).parent();
    // let d = $(event.target);
    // console.log('parent:', p.id, $(p).data('msgMode'));
    // console.log('parent:', d, d.data, d.data('savedMsg'));
}

function deleteSavedMessage(event) {
    let name = getSavedMessageName(event);
    saveMessage(name, null);
    displaySavedMessages();
}

function displaySavedMessages() {

    console.log("displaySavedMessages");

    let messages = getMessages();

    document.getElementById("saved-messages").innerHTML = "";


    for (const [name, data] of Object.entries(messages)) {
        console.log(name, data);
        document.getElementById("saved-messages").insertAdjacentHTML("beforeend",
        `<div>${name}</div>
                <div class="data">${hs(data)}</div>
                <div><button class="saved-msg-send" data-saved-msg="${name}">send</button></div>
                <div><button class="saved-msg-edit" data-saved-msg="${name}">edit</button></div>
                <div><button class="saved-msg-delete" data-saved-msg="${name}">delete</button></div>`
        );
        // document.getElementById("saved-messages").insertAdjacentHTML("beforeend",
        // `<div><a href="#">${name}</a></div><div class="data">${hs(data)}</div><div><button>send</button></div><div><button>edit</button></div><div><button>delete</button></div>`
        // );
    }

    // data-msg-mode="CHANNEL_MESSAGE" data-msg-type="NOTE_OFF"
    //         const messageMode = $(this).data('msgMode').toUpperCase();

    $('.saved-msg-send').on('click', sendSavedMessage);
    $('.saved-msg-edit').on('click', editSavedMessage);
    $('.saved-msg-delete').on('click', deleteSavedMessage);

}

function clearSavedMessages() {
    localStorage.setItem('studiocode.dev.webmidi.tester.messages', JSON.stringify({}));
    displaySavedMessages();
}

//=============================================================================
// Events and Messages
//-----------------------------------------------------------------------------

const t0 = Date.now();

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
    printEvent("ERROR   " + description, 'entry-error');
}

//=============================================================================
//
//-----------------------------------------------------------------------------

export function printInputsAndOutputs() {
    if (MIDI === null) return;
    clearPorts("outputs");
    clearPorts("inputs");
    const cls = null;
    MIDI.outputs.forEach(function(port, key) {
        let label = `${port.manufacturer} ${port.name}`.trim();
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" data-port-id="${encodeURIComponent(port.id)}" 
                      ${outputs[port.id]?.enabled ? 'checked' : ''}>${label}</div>`
        );
    });
    MIDI.inputs.forEach(function(port, key) {
        let label = `${port.manufacturer} ${port.name}`.trim();
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" data-port-id="${encodeURIComponent(port.id)}" 
                      ${inputs[port.id]?.enabled ? 'checked' : ''}>${label}</div>`
        );
    });
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {

/*
    $.localStorage = function(key, value) {
        if (localStorage == null) {
            return console.log('Local storage not supported!');
        } else {
            try {
                let result;
                if (typeof value != 'undefined') {
                    localStorage.setItem(key, value);
                    result = value;
                } else {
                    result = (value === null) ? localStorage.removeItem(key) :
                        localStorage.getItem(key);
                }
                return result;
            } catch (err) {
                // let private_browsing_error = 'Unable to store local data. Are you using Private Browsing?';
                // /QUOTA_EXCEEDED_ERR/.test(err) ? alert(private_browsing_error) : throw(err);
                console.log(err);
            }
        }
    };
*/

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
    } else {
        logError("Your browser does not support WebMIDI.");
        document.getElementById("unsupported").classList.remove('hide');
    }
    setupUIHandler();
}

function whenReadyCall(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyCall(main);
