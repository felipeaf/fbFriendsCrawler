"use strict";
console.log("got here");
var webpage = require('webpage');
var utils = require('./utils.js');
var StepManager = require('./stepManager.js');
var FacebookCrawler = require("./facebook.js");


var facebookConfig = {
    email: "", //login
    password: "",
    userBase: "",//The user that we wanna get users list from. Usually, yourself.
    outputFile: "output.csv"
}

var stepManager = new StepManager(null, function() {
    console.log('done! crawler is exiting');
    phantom.exit();
});

if(facebookConfig.email == '' || facebookConfig.password == '' || facebookConfig.userBase == '' || facebookConfig.outputFile == '') {
	console.log("please configure the facebookConfig object in main.js");
	phantom.exit();
}
var fbcrawler = new FacebookCrawler(stepManager, facebookConfig);
fbcrawler.run();
