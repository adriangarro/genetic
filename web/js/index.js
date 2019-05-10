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

class Data {

    constructor() {
        // default values, user can change it
        this.maxAgentQuantToCreate = 50;
        this.maxOrderQuantToCreate = 200;
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

    getServices() {
        return this.services;
    }

    setMaxAgentQuantToCreate(n) {
        this.maxAgentQuantToCreate = n;
    }

    setMaxOrderQuantToCreate(n) {
        this.maxOrderQuantToCreate = n;
    }

    createAgents() {
        let agents = {};
        for (let a = 0; a < this.maxAgentQuantToCreate; ++a) {
            // take some services randomly
            let servicesKeys = Object.keys(this.services);
            let maxQuantOfKeys =  ( faker.random.number() % servicesKeys.length ) + 1;
            let keysToUse = [];
            for (let loop = 0; loop < maxQuantOfKeys; ++loop) {
                let randKeyIndex = faker.random.number() % (servicesKeys.length);
                if (!keysToUse.includes(servicesKeys[randKeyIndex])) {
                    keysToUse.push(servicesKeys[randKeyIndex]);
                }
            }
            let services = {};
            for (let key of keysToUse) {
                services[this.services[key].code] = true;
            }
            // create random agent
            let agentUUID = "a" + faker.random.uuid();
            agents[agentUUID ] = {
                "name" : faker.name.findName(),
                "services" : services
            }
        }
        return agents;
    }

    createOrders() {
        let orders = {};
        for (let o = 0; o < this.maxOrderQuantToCreate; ++o) {
            // get random service
            let servicesKeys = Object.keys(this.services);
            let randKeyIndex = faker.random.number() % (servicesKeys.length);
            let serviceKey = servicesKeys[randKeyIndex];
            let service = this.services[serviceKey].code;
            // create random order
            let orderUUID = "o" + faker.random.uuid();
            orders[orderUUID ] = {
                "client" : faker.name.findName(),
                "service" : service
            }
        }
        return orders;
    }
}

let data = new Data();

class Genetic {

    constructor() {
        this.services = data.getServices();
        this.servicesKeys = Object.keys(this.services);
        this.agents = JSON.parse( sessionStorage.getItem("agentsJSON") );
        this.orders = JSON.parse( sessionStorage.getItem("ordersJSON") );
        this.agentsKeys = Object.keys(this.agents);
        this.ordersKeys = Object.keys(this.orders);
        this.population = {};
        this.totalHours = 34;
        this.heuristicVal = 0;
    }

    getGenHours(gen) {
        // param: gen = { service0 : quant0, service1 : quant1, ...}
        let hours = 0;
        for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
            let key = this.servicesKeys[keyIndex];
            // add gen hours
            hours = hours + ( gen[key] * this.services[key].hours );
        }
        return hours;
    }

    getGenCost(gen) {
        // param: gen = { service0 : quant0, service1 : quant1, ...}
        let cost = 0;
        for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
            let key = this.servicesKeys[keyIndex];
            // add gen hours
            cost = cost + ( gen[key] * this.services[key].cost );
        }
        return cost;
    }

    setInitPopulation() {
        let genQuant = this.agentsKeys.length * this.ordersKeys.length;
        for (let loop = 0; loop < genQuant; ++loop) {
            let gen = {};
            // all services start at 0
            for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
                let serviceKey = this.servicesKeys[keyIndex];
                gen[serviceKey] = 0;
            }
            // increase services little by little
            while (this.getGenHours(gen) <= this.totalHours) {
                // pick random service
                let randKeyIndex = faker.random.number() % (this.servicesKeys.length);
                let serviceKey = this.servicesKeys[randKeyIndex];
                gen[serviceKey] = gen[serviceKey] + 1;
            }
            let genUUID = "g" + faker.random.uuid();
            this.population[genUUID] = gen;
        }
    }

    getPopulation() {
        return this.population;
    }

    getServiceKeyByCode(code) {
        for (let index = 0; index < this.servicesKeys.length; ++index) {
            let serviceKey =  this.servicesKeys[index];
            if (this.services[serviceKey].code == code) return serviceKey;
        }
    }

    setHeuristicVal() {
        let cost = 0;
        for (let index = 0; index < this.ordersKeys.length; ++index) {
            let orderKey = this.ordersKeys[index];
            let serviceCode = this.orders[orderKey].service;
            let serviceKey = this.getServiceKeyByCode(serviceCode);
            cost = cost + this.services[serviceKey].cost;
        }
        this.heuristicVal = cost;
    }

    fitness(gen) {
        // close to zero is the best
        return Math.abs( this.getGenCost(gen) - this.heuristicVal);
    }
}

/* UI */

function setAgentsInTable(jsn) {
    // clean table
    $("#tblBodyAgents").empty();
    let count = 0;
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
        count = count + 1;
    });
    $("#quantAgents").text("N=" + count);
}

function setOrdersInTable(jsn) {
    // clean table
    $("#tblBodyOrders").empty();
    let count = 0;
    Object.keys(jsn).forEach(function(key) {
        let row = "<tr>"
            + "<td>" + key + "</td>"
            + "<td>" + jsn[key].client + "</td>"
            + "<td>" + jsn[key].service + "</td>"
            + "</tr>";
        $(row).appendTo("#tblBodyOrders");
        count = count + 1;
    });
    $("#quantOrders").text("N=" + count);
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
            $("#quantAgents").text("");
            $("#quantOrders").text("");
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
        if (event.target.files[0]) {
            reader.readAsText(event.target.files[0]);
        }
    });
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
                    // SET AGENTS QUANT
                    else if (command[0] == "AGENTES" || command[0] == "AGENTE") {
                        if ( isPositiveInt(command[1]) ) {
                            data.setMaxAgentQuantToCreate( parseInt(command[1]) );
                            voiceProcessor.readOutLoud(
                                "La cantidad de agentes para crear se ha cambiado a " + command[1]
                            );
                        } else {
                            voiceProcessor.readOutLoud("Valor inválido.");
                        }
                    }
                    // SET ORDERS QUANT
                    else if (command[0] == "ORDENES" || command[0] == "ORDEN") {
                        if ( isPositiveInt(command[1]) ) {
                            data.setMaxOrderQuantToCreate( parseInt(command[1]) );
                            voiceProcessor.readOutLoud(
                                "La cantidad de órdenes para crear se ha cambiado a " + command[1]
                            );
                        } else {
                            voiceProcessor.readOutLoud("Valor inválido.");
                        }
                    }
                    // CREATE FILE
                    else if (command[0] == "CREAR") {
                        if (command[1] == "AGENTES" || command[1] == "AGENTE") {
                            $("#agentsJSON").val(null);
                            let jsn = data.createAgents();
                            setAgentsInTable(jsn);
                            searchIn("searchAgent", "tblBodyAgents");
                            $("#seeAgentsDiv").show();
                            sessionStorage.setItem("agentsJSON", JSON.stringify(jsn));
                            voiceProcessor.readOutLoud("Los agentes han sido creados.");
                        } else if (command[1] == "ORDENES" || command[1] == "ORDEN") {
                            $("#ordersJSON").val(null);
                            let jsn = data.createOrders();
                            setOrdersInTable(jsn);
                            searchIn("searchOrder", "tblBodyOrders");
                            $("#seeOrdersDiv").show();
                            sessionStorage.setItem("ordersJSON", JSON.stringify(jsn));
                            voiceProcessor.readOutLoud("Las órdenes han sido creadas.");
                        } else {
                            voiceProcessor.readOutLoud("Comando no identificado.");
                        }
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

function test() {
    let g = new Genetic();
    g.setHeuristicVal();
}

jQuery(
    $(document).ready(function () {
        loadJSON("agentsJSON"),
        loadJSON("ordersJSON"),
        controlModalTables(),
        main(),
        test()
    })
);
