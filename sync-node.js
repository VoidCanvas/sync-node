
(function () {
/**
 * ----------- Required variables------------
 */
var syncTaskPointer = null;
var jobQueue = [];

/**
 * ----------- Helper functiosn --------------
 */
function* syncTaskRunner() {
	while (jobQueue.length > 0) {
		var jobObj = jobQueue.shift();
		yield taskHandler(jobObj);
	}
	syncTaskPointer = null;
}

function taskHandler (jobObj) {
	var response = (jobObj.context)? jobObj.job.apply(jobObj.context) : jobObj.job();
	if(response && typeof response.then === "function"){
		response.then(function (data) {
			jobObj.isResolved = true;
			jobObj.response = data;
			syncTaskPointer.next();
		}, function (err) {
			jobObj.isResolved = false;
			jobObj.response = err;
			syncTaskPointer.next();
		})
	}
	else{
		jobObj.isResolved = true;
		jobObj.response = response;
		syncTaskPointer.next();
	}
}


function pushJob (job, context) {
	console.log(job);
	var monitorObject = {
		job: job,
		context: context,
		isResolved : null,
		response: null
	}
	
	jobQueue.push(monitorObject);

	return new Promise(function (resolve, reject) {
		function observerFunction() {
			if (monitorObject.isResolved!=null) {
				Object.unobserve(monitorObject, observerFunction);
				if(monitorObject.isResolved===true){
					resolve(monitorObject.response);
				}
				else{
					reject(monitorObject.response);
				}
			}
		}
		Object.observe(monitorObject, observerFunction);
	});
}

/**
 * ------------------ Apis -------------------
 */

	/**
	 * SyncNode constructor
	 */
	var SyncNode = function (obj) {
		obj = obj || {};
		this.timeout = obj.timeout;
	}

	/**
	 * push a new job at the end of the job queue
	 * The input `job` can be of multiple types					
	 * @param  {Function} job [the function to be executed]
	 * @param  {Object} context [you can pass `this` or any other context]
	 * @return {Object}         [{jobId, promise}]
	 */
	SyncNode.prototype.pushJob = function (job, context) {
		var returnObj = null;
		if(job){
			if(typeof job === "function"){
				returnObj = pushJob(job);
				this.checkAndStartGenerator();
			}
		}
		return returnObj;
	}

	/**
	 * to check if the generator is started and everually start it
	 * @return {Void} 
	 */
	SyncNode.prototype.checkAndStartGenerator = function() {
		if(jobQueue.length==1 && !syncTaskPointer){
			this.stepAhead();
		}
	}

	/**
	 * The helps to move ahed the current pointer.
	 * It's exposed as api as sometime the person using the library may want a force stepAhead
	 * @return {Object} GeneratorValue
	 */
	SyncNode.prototype.stepAhead = function () {
		if(!syncTaskPointer)
			syncTaskPointer = syncTaskRunner();
		return syncTaskPointer.next();
	}


	module.exports = new SyncNode();
})();
