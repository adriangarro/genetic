// Artificial Intelligence
// System of Distribution of Orders of Service Making use of Genetic Algorithm.

/* VOICE HANDLER */

// stringHelpers

function removeAccents(strAccents) {
	strAccents = strAccents.split("");
	let strAccentsOut = new Array();
	let strAccentsLen = strAccents.length;
	let accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüŠšŸÿýŽž";
	let accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuSsYyyZz";
	for (let y = 0; y < strAccentsLen; y++) {
		if (accents.indexOf(strAccents[y]) !== -1) {
			strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
		} else {
			strAccentsOut[y] = strAccents[y];
		}
	}
	strAccentsOut = strAccentsOut.join("");
	return strAccentsOut;
}

// removeAccents + toUpperCase
function fixMessage(input) {
	return removeAccents(
        input
    ).toUpperCase();
}

function isPositiveInt(str) {
    let n = Number(str);
    return Number.isInteger(n) && n > 0;
}

// Voice Processor (ONLY GOOGLE CHROME => 2019)

class VoiceProcessor {
    constructor() {
        this.recognition = null;
        try {
            let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
        }
        catch(e) {
            console.error(e);
            $(".no-browser-support").show();
            $(".app").hide();
        }
        // Configure voice recognition 
        if (this.recognition) {
            // If false, the recording will stop after a few seconds of silence.
            // When true, the silence period is longer (about 15 seconds),
            // allowing us to keep recording even when the user pauses. 
            this.recognition.continuous = true;
            // This block is called every time the Speech APi captures a line. 
            this.recognition.onresult = function(event) {
                // event is a SpeechRecognitionEvent object.
                // It holds all the lines we have captured so far. 
                // We only need the current one.
                let current = event.resultIndex;
                // Get a transcript of what was said.
                let transcript = event.results[current][0].transcript;
                sessionStorage.setItem("transcript", transcript);
                console.log(transcript);
            }
            this.recognition.onstart = function() { 
                console.log("Voice recognition activated.");
            }
            this.recognition.onspeechend = function() {
                console.log("Voice recognition turned off.");
            }
            this.recognition.onerror = function(event) {
                if (event.error == "no-speech") {
                    console.log("No speech was detected. Try again.");  
                }
            }
        }
    }

    startRecognition() {
        this.recognition.start();
    }

    stopRecognition() {
        this.recognition.stop();
    }

    readOutLoud(message) {
        let speech = new SpeechSynthesisUtterance();
        // set text and voice attributes
        speech.text = message;
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.speak(speech);
    }
}

let voiceProcessor = new VoiceProcessor();

/* GENETIC ALGORITHM */

function setAgentsInTable(jsn) {
    Object.keys(jsn).forEach(function(key) {
        let row = "<tr>"
            + "<td>" + key + "</td>"
            + "<td>" + jsn[key].name + "</td>"
            + "<td>"
        Object.keys(jsn[key].services).forEach(function(s) {
            row = row + s + " ";
        });
        row = row + "</td>" + "</tr>";
        $(row).appendTo("#tblBodyAgents");
    });
}

function setOrdersInTable(jsn) {
    Object.keys(jsn).forEach(function(key) {
        let row = "<tr>"
            + "<td>" + key + "</td>"
            + "<td>" + jsn[key].client + "</td>"
            + "<td>" + jsn[key].service + "</td>"
            + "</tr>";
        $(row).appendTo("#tblBodyOrders");
    });
}

function searchIn(modal, table) {
    $("#" + modal).keyup(function () {
        let value = $(this).val().toLowerCase();
        $("#" + table + " tr").filter(function() {
          $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
}

function loadJSON(htmlInputID) {
    function onReaderLoad(event) {
        let jsn = JSON.parse(event.target.result);
        /* not generic code */
        try {    
            if (htmlInputID == "agentsJSON") {
                setAgentsInTable(jsn);
                searchIn("searchAgent", "tblBodyAgents");
                $("#seeAgentsDiv").show();
            } else if (htmlInputID == "ordersJSON") {
                setOrdersInTable(jsn);
                searchIn("searchOrder", "tblBodyOrders");
                $("#seeOrdersDiv").show();
            }
            sessionStorage.setItem(htmlInputID, JSON.stringify(jsn));
        } catch (error) {
            sessionStorage.clear();
            $("#tblBodyAgents").html("");
            $("#tblBodyOrders").html("");
            $("#seeAgentsDiv").hide();
            $("#seeOrdersDiv").hide();
            $("#agentsJSON").val("");
            $("#ordersJSON").val("");
            voiceProcessor.readOutLoud("Archivo inválido.");
        }
        /* not generic code, last line */
    }
    $("#" + htmlInputID).change(function (event) {
        let reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(event.target.files[0]);
    });
}

class Genetic {

    constructor() {
        this.agents = undefined;
        this.orders = undefined;
        this.services = {
            "s1" : {
                "code" : "ICE", 
                "hours" : 2, 
                "cost" : 250
            },
            "s2" : {
                "code" : "ICG", 
                "hours" : 4, 
                "cost" : 400
            },
            "s3" : {
                "code" : "ILA", 
                "hours" : 1, 
                "cost" : 200
            },
            "s4" : {
                "code" : "RCE", 
                "hours" : 4, 
                "cost" : 300
            },
            "s5" : {
                "code" : "RCG", 
                "hours" : 6, 
                "cost" : 500
            },
            "s6" : {
                "code" : "RLA", 
                "hours" : 6, 
                "cost" : 250
            }
        };
    }

    test() {

    }

}

function controlModalTables() {
    $("#seeAgents").click(function() {
        $("#consultAgents").modal("show");
    });
    $("#seeOrders").click(function() {
        $("#consultOrders").modal("show");
    });
}

function main() {
    $(document).on("keypress", function(e) {
        // if press 1
        if (e.which == 49) {
            voiceProcessor.startRecognition();
        }
        // if press 0
        else if (e.which == 48) {
            voiceProcessor.stopRecognition();
            // after stop recognition:
            setTimeout(function() {
                let transcript = sessionStorage.getItem("transcript");
                if (transcript) {
                    sessionStorage.removeItem("transcript");
                    let command = fixMessage(transcript).split(" ");
                    // CLEAR
                    if (command[0] == "LIMPIAR") {
                        sessionStorage.clear();
                        window.location = "index.html";
                    }
                    // REFRESH
                    else if (command[0] == "REFRESCAR") {
                        window.location = "index.html";
                    }
                    // ADD FILE
                    else if (command[0] == "AGREGAR") {
                        if (command[1] == "AGENTES" || command[1] == "AGENTE") {
                            $("#agentsJSON").click();
                        } else if (command[1] == "ORDENES" || command[1] == "ORDEN") {
                            $("#ordersJSON").click();
                        } else {
                            voiceProcessor.readOutLoud("Comando no identificado.");
                        }
                    }
                    // SEE DATA
                    else if (command[0] == "VER") {
                        if (command[1] == "AGENTES" || command[1] == "AGENTE") {
                            if ( $("#seeAgents").is(":visible") )
                                $("#seeAgents").click();
                            else
                                voiceProcessor.readOutLoud("No se han agregado agentes.");
                        } else if (command[1] == "ORDENES" || command[1] == "ORDEN") {
                            if ( $("#seeOrders").is(":visible") )
                                $("#seeOrders").click();
                            else
                                voiceProcessor.readOutLoud("No se han agregado órdenes.");
                        } else {
                            voiceProcessor.readOutLoud("Comando no identificado.");
                        }
                    }
                    else {
                        voiceProcessor.readOutLoud("Comando no identificado.");
                    }
                } else {
                    voiceProcessor.readOutLoud("No se ha procesado ninguna orden.");
                }
            }, 1000);
        }
    });
}

jQuery(
    $(document).ready(function () {
        loadJSON("agentsJSON"),
        loadJSON("ordersJSON"),
        controlModalTables(),
        main()
    })
);
