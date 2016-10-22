"use strict";
console.log("got here");
var page = require('webpage').create();

function StepManager(cbNextStep, cbEnd) {
	var steps = [];
	
	this.addSteps = function addSteps() {
		for(var i = 0; i < arguments.length; i++) {
			//assert(typeof arguments[i] == 'function');
			steps.push(arguments[i]);
		}
	}
	
	
	this.nextStep = function nextStep() {
		var nextStep = steps.shift();
		if(nextStep == undefined) {
			cbEnd();
			return;
		}
		
		if(cbNextStep)
			cbNextStep();
		console.log("calling step", nextStep ? nextStep.name : "");
		nextStep();
	}
	
}


module.exports = StepManager;
