var MIDI = null;

export function printInputsAndOutputs() {
    if (MIDI === null) return;
    document.getElementById("inputs").innerHTML = "";
    document.getElementById("outputs").innerHTML = "";
    MIDI.inputs.forEach(function(port, key) {
        document.getElementById("inputs").insertAdjacentHTML("beforeend",
            `<pre class="">
ID:           ${port.id}
Manufacturer: ${port.manufacturer} 
Name:         ${port.name}
Version:      ${port.version}  
</pre>`);
    });
    MIDI.outputs.forEach(function(port, key) {
        document.getElementById("outputs").insertAdjacentHTML("beforeend",
            `<pre class="">
ID:           ${port.id}
Manufacturer: ${port.manufacturer} 
Name:         ${port.name}
Version:      ${port.version}  
</pre>`);
    });
}

//=============================================================================
// MIDI
//-----------------------------------------------------------------------------

function onMIDISuccess(midiAccess) {
    MIDI = midiAccess;
    MIDI.onstatechange = printInputsAndOutputs;
    printInputsAndOutputs();
}

function onMIDIFailure(msg) {
    console.warn("Access to WebMIDI is denied. Check your browser settings.");
}

//=============================================================================
// Bootstrap
//-----------------------------------------------------------------------------

function main() {
    document.getElementById("user-agent").insertAdjacentHTML("beforeend", navigator.userAgent);
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({sysex: true}).then(onMIDISuccess, onMIDIFailure);
    } else {
        console.warn("Your browser does not support WebMIDI.");
    }
}

function whenReadyCall(callback) {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

whenReadyCall(main);
