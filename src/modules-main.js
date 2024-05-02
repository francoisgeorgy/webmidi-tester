import {setAutoConnect, requestMIDIAccess} from './modules/midi.js';

console.log("in modules-main.js");

function autoConnect() {
    setAutoConnect(/.*midi.*/i);
}

function setupMIDI() {
    console.group("setupMIDI");
    let m = requestMIDIAccess();
    console.log("setupMIDI ::", m);
    m.then((r) => {
        console.log("setupMIDI :: then", r);
        autoConnect();
    });
    console.groupEnd();
}

function clickAutoConnect() {
    console.log("clickAutoConnect");
    autoConnect();
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    setupMIDI();
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

