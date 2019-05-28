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

function shuffle(array) {
    // Fisher–Yates Algorithm
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
}

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
        this.totalHoursFixed = 40;
        this.heuristicVal = 0;
        this.survivorsPercentage = 0.25;
        this.matchedGens = [];
        this.solutions = [];
    }

    getServices() {
        return this.services;
    }

    getAgents() {
        return this.agents;
    }

    getAgents() {
        return this.orders;
    }

    getGens() {
        return this.population;
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
        this.heuristicVal = cost / this.agentsKeys.length;
        // console.log("H:" + this.heuristicVal);
    }

    fitness(gen) {
        // close to zero is the best
        return Math.abs( this.getGenCost(gen) - this.heuristicVal);
    }

    getBestGenKey() {
        let populationKeys = Object.keys(this.population);
        let bestGenKey = populationKeys[0];
        let bestGen = this.population[bestGenKey];
        for (let index = 1; index < populationKeys.length; ++index) {
            let currentGenKey = populationKeys[index];
            let currentGen = this.population[currentGenKey];
            if (this.fitness(currentGen) < this.fitness(bestGen)) {
                bestGenKey = currentGenKey;
                bestGen = currentGen;
            }
        }
        return bestGenKey;
    }

    selection() {
        let newPopulation = {};
        // get the half of best agents
        // half of the population xD
        let thanosSnapQuant = Object.keys(this.population).length / 2;
        for (let survivorQuant = 0; survivorQuant < thanosSnapQuant; ++survivorQuant) {
            let survivorKey = this.getBestGenKey();
            newPopulation[survivorKey] = this.population[survivorKey];
            delete this.population[survivorKey];
        }
        this.population = newPopulation;
    }

    crossing() {
        let populationKeys = Object.keys(this.population);
        shuffle(populationKeys);
        for (let genIndex = 0; genIndex < (populationKeys.length - 1); ++genIndex) {
            // genA
            let genAKey = populationKeys[genIndex];
            let genA = this.population[genAKey];
            // gen B
            let genBKey = populationKeys[genIndex + 1];
            let genB = this.population[genBKey];
            // crossing genA and genB into genC
            let genC = {};
            for (let serviceIndex = 0; serviceIndex < this.servicesKeys.length; ++serviceIndex) {
                let serviceKey = this.servicesKeys[serviceIndex];
                let randChoice = Math.random();
                if (randChoice <= 0.5) {
                    genC[serviceKey] = genA[serviceKey];
                } else {
                    genC[serviceKey] = genB[serviceKey];
                }
            }
            // is genC good?
            if ( this.getGenHours(genC) <= this.totalHoursFixed ) {
                let gens = [genA, genB, genC];
                // sort gens by fitness in ascending order:
                gens.sort((a, b) => this.fitness(a) - this.fitness(b));
                // get best 2 of [genA, genB, genC]
                // gettig them in a random way:
                let zeroOrOne = Math.round( Math.random() );
                this.population[genAKey] = gens[zeroOrOne];
                if (zeroOrOne == 0)
                    this.population[genBKey] = gens[1];
                else
                    this.population[genBKey] = gens[0];
            }
        }
    }

    mutation() {
        let populationKeys = Object.keys(this.population);
        let genXKey = populationKeys[Math.floor ( Math.random() * populationKeys.length )];
        let genX = this.population[genXKey];
        let mutationFactor = Math.random();
        if (mutationFactor <= 0.1) {
            let randServiceKey = this.servicesKeys[
                Math.floor ( Math.random() * this.servicesKeys.length )
            ];
            let mutationTypeFactor = Math.random();
            /* change service demand */
            // increase demand
            if (mutationTypeFactor <= 0.5) {
                genX[randServiceKey] = genX[randServiceKey] + 1;
            } 
            // swap demand
            else {
                let anotherRandServiceKey = this.servicesKeys[
                    Math.floor ( Math.random() * this.servicesKeys.length )
                ];
                let temp = genX[anotherRandServiceKey];
                genX[anotherRandServiceKey] = genX[randServiceKey];
                genX[randServiceKey] = temp;
            }
            // apply only a good one mutation
            if (this.getGenHours(genX) <= this.totalHoursFixed) {
                this.population[genXKey] = genX;
                // this.printGen(genX);
            }
        }
    }

    printGen(gen) {
        console.log("Gen: ");
        console.log(gen);
        console.log("Hours: " + this.getGenHours(gen));
        console.log("Cost: " + this.getGenCost(gen));
    }

    printPopulation() {
        let populationKeys = Object.keys(this.population);
        console.log("N:" + populationKeys.length);
        for (let i = 0; i < populationKeys.length; ++i) {
            let key = populationKeys[i];
            let gen = this.population[key];
            this.printGen(gen);
        }
    }

    getPopulationQuant() {
        return Object.keys(this.population).length;
    }

    evolution() {
        this.setInitPopulation();
        this.setHeuristicVal();
        let survivors = this.getPopulationQuant() * this.survivorsPercentage;
        while (this.getPopulationQuant() > survivors) {
            // this.printPopulation();
            this.crossing();
            // this.printPopulation();
            this.mutation();
            // this.printPopulation()
            this.selection();
        }
        // this.printPopulation();
    }

    setServiceQuantInOrders() {
        for (let serviceKeyIndex = 0; serviceKeyIndex < this.servicesKeys.length; ++serviceKeyIndex) {
            let serviceKey = this.servicesKeys[serviceKeyIndex];
            let service = this.services[serviceKey];
            service["demand"] = 0;
            for (let orderKeyIndex = 0; orderKeyIndex < this.ordersKeys.length; ++orderKeyIndex) {
                let orderKey = this.ordersKeys[orderKeyIndex];
                let order = this.orders[orderKey];
                if (service.code == order.service) {
                    service["demand"] = service["demand"] + 1;
                }
            }
        }
    }

    areCompatible(agent, gen) {
        let agentServices = agent.services;
        let genServicesKeys = Object.keys(gen);
        // for every service in gene...
        for (let i = 0; i < genServicesKeys.length; ++i) {
            let serviceKey = genServicesKeys[i];
            let service = this.services[serviceKey];
            let serviceQuantInGen = gen[serviceKey];
            if (!agentServices.hasOwnProperty(service.code) && serviceQuantInGen > 0)
                return false;
        }
        return true;
    }

    agentMatchGens() {
        // clean matched gens
        this.matchedGens = [];
        // for every agent...
        for (let i = 0; i < this.agentsKeys.length; ++i) {
            let agentKey = this.agentsKeys[i];
            let agent = this.agents[agentKey];
            agent["gens"] = {};
            let populationKeys = Object.keys(this.population);
            // for every gene...
            for (let j = 0; j < populationKeys.length; ++j) {
                let genKey = populationKeys[j];
                let gen = this.population[genKey];
                if (this.areCompatible(agent, gen)) {
                    agent["gens"][genKey] = true;
                    this.matchedGens.push(genKey);
                }
            } 
        }
        // delete repeated elements...
        this.matchedGens = [...new Set(this.matchedGens)];
    }

    // get service demand of a genes array
    demand(gensArr) {
        let demand = {};
        for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
            let key = this.servicesKeys[keyIndex];
            demand[key] = 0;
        }
        for (let i = 0; i < gensArr.length; ++i) {
            let genKey = gensArr[i];
            let gen = this.population[genKey];
            for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
                let key = this.servicesKeys[keyIndex];
                demand[key] = demand[key] + gen[key];
            }
        }
        return demand;
    }

    fitnessByDemand(genKeys) {
        let demand = this.demand(genKeys);
        let result = 0;
        // for every service...
        for (let keyIndex = 0; keyIndex < this.servicesKeys.length; ++keyIndex) {
            let key = this.servicesKeys[keyIndex];
            result = result + (this.services[key]["demand"] - demand[key]);
        }
        return result;
    }

    buildSolutions() {
        shuffle(this.matchedGens);
        this.solutions = [];
        while (this.solutions.length < this.agentsKeys.length) {
            let genKey = this.matchedGens[Math.floor(Math.random() * this.matchedGens.length)];
            if (!this.solutions.includes(genKey)) this.solutions.push(genKey);
        }
        // remove randoms gens until fitness will be positive
        // zero is the optimal
        while ( this.fitnessByDemand(this.solutions) < 0 ) {
            this.solutions.splice(Math.floor(Math.random() * this.solutions.length), 1);
        }
    }

    agentMatchSolution() {
        // for every solution...
        for (let j = 0; j < this.solutions.length; ++j) {
            let genKey = this.solutions[j];
            // for every agent...
            for (let i = 0; i < this.agentsKeys.length; ++i) {
                let agentKey = this.agentsKeys[i];
                let agent = this.agents[agentKey];
                if (agent["gens"][genKey]) {
                    agent["gens"][genKey] = "ok";
                }
            }
        }
    }

    distribution() {
        this.setServiceQuantInOrders();
        // console.log(this.services);
        this.agentMatchGens();
        // console.log(this.agents);
        // console.log( this.matchedGens );
        this.buildSolutions();
        // console.log(this.solutions);
        // console.log( this.fitnessByDemand(this.solutions) );
        this.agentMatchSolution();
        // console.log(this.agents);
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
    $("#dna").modal("show");
    setTimeout(function() {
        let g = new Genetic();
        g.evolution();
        g.distribution();
        $("#dna").modal("hide");
        // TODO table with Sols
    }, 5000);
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
