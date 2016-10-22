
function jobQueue(cbFinish, concurrencyLimit, jobs) {
	var self = this;
	var actualConcurrency = 0;
	
	function runNextJob() {
		var nextJob = jobs.shift();
		if(nextJob == undefined) {
			//queue end!
			if(actualConcurrency <= 0)
				cbFinish();
			return;
		}
		
		if(actualConcurrency >= concurrencyLimit)
			return;
			
		actualConcurrency++;
		
		nextJob(function jobQueueCb() {
			actualConcurrency--;
			runNextJob();
		});
		
		if(actualConcurrency < concurrencyLimit)
			runNextJob();
	};
	runNextJob();
}

module.exports = jobQueue;
