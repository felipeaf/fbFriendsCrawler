
//wait for ready state be complete
function waitComplete(page, cb) {
	setTimeout(function () {
		var readyState = page.evaluate(function () {
			return document.readyState;
		});

		if ("complete" === readyState) {
			cb();
		} else {
			waitComplete(page, cb);
		}
	});
}

//TODO inventar um nome melhor pra isso
function waitCompletePlusTime(page, cb) {
	window.setTimeout(function() {
		waitComplete( page, cb)
	}, 2000)
};




module.exports = {
	waitComplete: waitComplete,
	waitCompletePlusTime: waitCompletePlusTime
}
