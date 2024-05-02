import {requestMIDIAccess} from './modules/midi.js';

console.log("in modules-test1.js");

function askForMIDIAccess() {
    console.group("test1 :: askForMIDIAccess");
    let m = requestMIDIAccess();
    console.log("test1 :: askForMIDIAccess ::", m);
    m.then((r) => {
        console.log("test1 :: askForMIDIAccess :: then", r);
    });
    console.groupEnd();
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    askForMIDIAccess();
}

function whenReadyCall(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyCall(main);

