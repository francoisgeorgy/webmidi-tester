import {setAutoConnect, requestMIDIAccess} from './modules/midi.js';

console.log("in modules-main.js");

function autoConnect() {
    setAutoConnect(/.*midi.*/i);
}

function askForMIDIAccess() {
    console.group("main :: askForMIDIAccess");
    let m = requestMIDIAccess();
    console.log("main :: askForMIDIAccess ::", m);
    m.then((r) => {
        console.log("main :: askForMIDIAccess :: then", r);
        autoConnect();
    });
    console.groupEnd();
}

function clickAutoConnect() {
    console.log("main :: clickAutoConnect");
    autoConnect();
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    askForMIDIAccess();
    document.getElementById("btAutoConnect").addEventListener("click", function() {
        // console.log("#btAutoConnect click");
        clickAutoConnect();
    });
}

function whenReadyCall(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyCall(main);

