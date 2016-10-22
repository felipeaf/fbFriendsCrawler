"use strict";
console.log("got here");
var webpage = require('webpage');
var utils = require('./utils.js');
var StepManager = require('./stepManager.js');
var jobQueue = require('./jobQueue.js');
var fs = require('fs');

var getStackTrace = function() {
  var obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};


function FacebookCrawler(stepManager, fbConfig) {
	
	var self = this;
    
    var page = webpage.create();
    page.onConsoleMessage = function(msg) {
        console.log(msg);
    };
    
    function firstStepGoingToFriendsPage() {
        page.open("https://www.facebook.com/"+fbConfig.userBase+"/friends", function(status) {
            console.log("open friends page with status", status);
            utils.waitComplete(page, stepManager.nextStep); /*if not logged, next step should be login*/
        });
    }
    
    function handleLoginPage() {
        page.evaluate(function(fbConfig) {
            document.querySelector("input[name='email']").value = fbConfig.email;
            document.querySelector("input[name='pass']").value = fbConfig.password;
            document.querySelector("#login_form").submit();
        
            console.log("Login submitted!");
        }, fbConfig);
        
        //waitComplete(nextStep);
        utils.waitCompletePlusTime(page, stepManager.nextStep); //TODO se não esperar nada ou mesmo tempo pequeno (100ms) o waitComplete só não funciona, continua na mesma pag
    }
    
    function handleFriendsPage() {
        
        console.log("ENTROU NO FRIENDS");
        var interval = window.setInterval(function() {
			
          var count = page.content.match(/class="uiHeader"/g);//document.querySelector('div[class=uiHeader]')

          if(count === null) { // Didn't find
            page.evaluate(function() {
              // Scrolls to the bottom of page
              window.document.body.scrollTop = document.body.scrollHeight;
            });
            return;
          }
          else { // Found
            var friends = page.evaluate(function() {
                var divNodeList = document.querySelectorAll('div[class="fsl fwb fcb"]');
                var friends = [];
                for(var i = 0; i < divNodeList.length; i++) {
                    var link = divNodeList[i].children[0];
                    friends.push ({"name": link.textContent, "url": link.href});
                }
                return friends;
            });
            
		    self.friends = friends;
		    console.log(friends.length);
		    clearInterval(interval);
            stepManager.nextStep();
          }
      }, 500); // Number of milliseconds to wait between scrolls
    }
    
    function handleAFriendPage(page, friend) {
        var mora = page.evaluate(function () {
            var i = document.querySelector('i[class="_2m_3 _3-91 _8o _8s lfloat _ohe img sp_vSpiFuU7MD8 sx_50af10"]');
            if(i == null) {
				console.log("Não encontrou ícone cidade onde mora para amigo...");
				return null;
			}
            console.log(i.parentElement.children[1].firstChild.firstChild.firstElementChild.textContent);
            return i.parentElement.children[1].firstChild.firstChild.firstElementChild.textContent;
        });
        if(mora == null)
			console.log("Não encontrou cidade onde mora para amigo", friend.name);
        var origem = page.evaluate(function () {
            var i = document.querySelector('i[class="_2m_3 _3-91 _8o _8s lfloat _ohe img sp_vSpiFuU7MD8 sx_6029c3"]');
            if(i == null) {
				console.log("Não encontrou ícone cidade de onde veio para amigo...");
				return null;
			}
            console.log(i.parentElement.children[1].firstChild.firstChild.firstElementChild.textContent);
            return i.parentElement.children[1].firstChild.firstChild.firstElementChild.textContent;
        });
        if(origem == null)
			console.log("Não encontrou cidade onde veio para amigo", friend.name);
        friend.mora = mora;
        friend.origem = origem;
    }
    
    function handleAFriendWithFriendsListInfo(friend,cb) {
		var friendPage = require('webpage').create();
		friendPage.open(friend.url, function(status) {
			//console.log("open friends page with status", status);
			utils.waitComplete(friendPage, function() {
				handleAFriendPage(friendPage, friend);
				friendPage.close();
				cb();
			}); /*if not logged, next step should be login*/
		});
	}
    
    function handleFriendsList() {
		var friends = self.friends.slice(0,10);
		console.log("found", friends.length, "friends");
		var friendsJobs = [];
		var stream = fs.open(fbConfig.outputFile, {
			mode: 'w',
			charset: 'UTF-8'
		});
		stream.write('name;city;from;link\n');
		friends.forEach(function (friend) {
			friendsJobs.push(function (cbDone) {
				handleAFriendWithFriendsListInfo(friend, function() {
					console.log("\n\PROCESSADO NOVO USUÁRIO", "nome:", friend.name, "mora em:", friend.mora, "origem:", friend.origem);
					stream.write(friend.name+';'+friend.mora+';'+friend.origem+';'+friend.url+'\n');
					cbDone();
				});
			});
		});
		console.log("Started visiting friends page");
		jobQueue(function done() {
			console.log("FIM!");
			stream.close();
			}, 10, friendsJobs);
	}
    
    function constructor() {
        stepManager.addSteps(
            firstStepGoingToFriendsPage,
            handleLoginPage,
            handleFriendsPage,
            handleFriendsList
        );
    }
    constructor();
    
    this.run = function run() {
		console.log("run");
        stepManager.nextStep();
    };
}

module.exports = FacebookCrawler;

