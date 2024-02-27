// @ts-check
/// <reference path="webmidi-types.d.ts"/>

import {
    MIDI,
    onMIDIFailure,
    onMIDISuccess,
    inputs,
    outputs,
    saveInputsSelection,
    saveOutputsSelection
} from "./midi.js";
import {
    send,
    sendAny,
    sendDeviceIdRequest,
    sendSysex,
    SYSEX_END,
    SYSEX_ID_REQUEST,
    SYSEX_START
} from "./midi-messages.js";
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

function onClickInputEnable(event) {
    let id = decodeURIComponent($(event.target).data("portId"));
    inputs[id].enabled = $(this).is(':checked');
    saveInputsSelection();
}

function onClickOutputEnable(event) {
    let id = decodeURIComponent($(event.target).data("portId"));
    outputs[id].enabled = $(this).is(':checked');
    saveOutputsSelection();
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
    let n = $('#message-sysex-name').val() || '';
    if (n.trim()) {
        saveMessage(n, parseNumbersString($("#sysex-data").val()));
        // $.localStorage.setItem(n, parseNumbersString($("#sysex-data").val()));
        displaySavedMessages();

        $('#message-sysex-name').val('');
    }
}

function onClickBtSendBytes() {
    const data = parseNumbersString($("#any-data").val(), isDefaultHex());
    if (data === null || data.length <= 0) {
        // console.log("empty data; ignore command");
        return;
    }
    sendAny(data);
    let n = $('#message-any-name').val() || '';
    if (n.trim()) {
        saveMessage(n, data);
        displaySavedMessages();
        $('#message-any-name').val('');
    }
}

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

function isDefaultHex() {
    return $('#check-hex').is(':checked');
}

function makeSysex() {
    let s = $("#any-data").val();
    $("#any-data").val(`${isDefaultHex() ? '':'0x'}F0 ${s} ${isDefaultHex() ? '':'0x'}F7`);
    $("#any-data").focus();
    const pos = isDefaultHex() ? 3 : 5;
    let c = document.getElementById("any-data");
    c.selectionStart = pos;
    c.selectionEnd = pos;
}

function applyMask() {
    const mask_enabled = $(this).is(':checked');
    const data = parseNumbersString($("#any-data").val(), isDefaultHex()).map(e => e & 0x7F);
    const s = isDefaultHex() ? hs(data) : hs0x(data);
    $("#any-data").val(s);
}

function toggleHex() {
    const hex_enabled = $(this).is(':checked');
    const data = parseNumbersString($("#any-data").val(), !isDefaultHex());
    const s = isDefaultHex() ? hs(data) : hs0x(data);
    $("#any-data").val(s);
}

function setupUIHandler() {
    $('#inputs').on('click', 'input.port-enable', onClickInputEnable);
    $('#outputs').on('click', 'input.port-enable', onClickOutputEnable);
    $('.btSend').on('click', onClickBtSend);
    $('input.slider').on('change', onSliderChange);
    $('input.slider').on('input', onSliderInput);
    $('#btSendIDRequest').on('click', onClickBtSendIDRequest);
    $('#btSendBytes').on('click', onClickBtSendBytes);
    $('#btClearMessages').on('click', onClickBtClearMessages);
    $('#select-inputs-all').on('click', selectAllInputs);
    $('#select-inputs-none').on('click', unselectAllInputs);
    $('#select-outputs-all').on('click', selectAllOutputs);
    $('#select-outputs-none').on('click', unselectAllOutputs);
    $('#clear-saved-messages').on('click', clearSavedMessages);
    $('#import-messages').on('click', upload);
    $('#export-messages').on('click', download);
    $('#input-file').on('change', loadfile);
    $('#make-sysex').on('click', makeSysex);
    $('#apply-mask').on('click', applyMask);
    $('#check-hex').on('click', toggleHex);

    displaySavedMessages();
}


//=============================================================================
// Save
//-----------------------------------------------------------------------------

function storeMessages(messages) {
    localStorage.setItem('studiocode.dev.webmidi.tester.messages', JSON.stringify(messages));
}

function saveMessage(name, data){
    let messages = getMessages();
    const i = messages.findIndex((element) => element['name'] === name);
    if (data == null) {
        if (i >= 0) messages.splice(i, 1);
    } else {
        if (i >= 0) {
            messages[i] = {name, data};
        } else {
            messages.push({name, data});
        }
    }
    storeMessages(messages);
}

function getMessages() {
    const data = JSON.parse(localStorage.getItem('studiocode.dev.webmidi.tester.messages') || "[]");
    if (data.length === 0) {
        return [
            {
                name:'Device ID Request',
                data: [
                    SYSEX_START,
                    ...SYSEX_ID_REQUEST,
                    SYSEX_END
                ]
            }
        ];
    } else {
        return data;
    }
}

function getSavedMessageName(event) {
    return decodeURI($(event.target).data('savedMsg'));
}
function getSavedMessage(event) {
    let messages = getMessages();
    let name = getSavedMessageName(event);
    const m = messages.find((element) => element['name'] === name);
    if (m) {
        return m['data'];
    } else {
        return null;
    }
}

function sendSavedMessage(event) {
    let data = getSavedMessage(event);
    if (data) {
        sendAny(data);
    }
}

function editSavedMessage(event) {
    let data = getSavedMessage(event);
    if (data) {
        $("#any-data").val(hs0x(data));
    }
}

function deleteSavedMessage(event) {
    let name = getSavedMessageName(event);
    saveMessage(name, null);
    displaySavedMessages();
}

function displaySavedMessages() {
    const messages = getMessages();
    document.getElementById("saved-messages").innerHTML = "";
    for (const message of messages) {
        if (message === null) continue;
        const name = message['name'];
        document.getElementById("saved-messages").insertAdjacentHTML("beforeend",
            `<div class="saved-message-name">${name}</div>
            <div class="data">${hs(message['data'])}</div>
            <div><button class="saved-msg-edit" data-saved-msg="${encodeURI(name)}" title="Copy the message in the input field for editing.">edit</button></div>
            <div><button class="saved-msg-delete" data-saved-msg="${encodeURI(name)}" title="Remove this message for the saved messages.">delete</button></div>
            <div><button class="saved-msg-send" data-saved-msg="${encodeURI(name)}"title="Send the message to all selected outputs.">send</button></div>`
        );
    }

    $('.saved-msg-edit').on('click', editSavedMessage);
    $('.saved-msg-delete').on('click', deleteSavedMessage);
    $('.saved-msg-send').on('click', sendSavedMessage);
}

function clearSavedMessages() {
    storeMessages([]);
    displaySavedMessages();
}

/**
 * Format : "<name>" "hex" data...
 */
function download() {
    let data = '';
    for (const message of getMessages()) {
        if (message === null) continue;
        data = data + `"${message['name'].replace(/"/g, '\\"')}" hex ${hs(message['data'])}\n`;
    }
    let downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(new Blob([data]));
    downloadLink.download = "midi-messages.txt";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function upload() {
    $('#import-export').hide();
    $('#file-chooser').show();
}

function loadfile() {
    let reader = new FileReader();
    reader.onload = (e) => {
        const file = e.target.result;
        const lines = file.split(/\r\n|\n/);
        loadMessagesFromStrings(lines);
    };
    reader.onerror = (e) => alert(e.target.error.name);
    reader.readAsText(this.files[0]);
}

function loadMessagesFromStrings(strings) {
    const messages = [];
    const regex = /"(.*?)" hex (.*)/
    let matches;
    for (const s of strings) {
        const found = s.trim().match(regex);
        if (found) {
            messages.push({
                name: found[1].replace(/\\"/g, '"'),
                data: parseNumbersString(found[2], true)
            })
        }
    }
    if (messages.length > 0) {
        storeMessages(messages);
        displaySavedMessages();
    }
    $('#file-chooser').hide();
    $('#import-export').show();
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
    MIDI.inputs.forEach(function(port, key) {
        let label = `${port.manufacturer} ${port.name}`.trim();
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" data-port-id="${encodeURIComponent(port.id)}" 
                      ${inputs[port.id]?.enabled ? 'checked' : ''}>${label}</div>`
        );
    });

    MIDI.outputs.forEach(function(port, key) {
        let label = `${port.manufacturer} ${port.name}`.trim();
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<div class=""><input type="checkbox" class="port-enable" data-port-id="${encodeURIComponent(port.id)}" 
                      ${outputs[port.id]?.enabled ? 'checked' : ''}>${label}</div>`
        );
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
        document.getElementById("unsupported").classList.add('show');

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
