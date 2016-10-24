
require("object.observe");

(function () {
/**
 * ----------- Helper functiosn --------------
 */
	function pushJob (queue, job) {
		var monitorObject = {
			job: job,
			isResolved : null,
			response: null
		}
		
		queue.push(monitorObject);

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
		this.syncTaskPointer = null;
		this.jobQueue = [];
		this.lastResponse = {
			res:null,
			err:null,
		}
		this.isRunning = false;
		this.observer = null;
		this._observerResolve = null;
	}

	/**
	 * push a new job at the end of the job queue
	 * The input `job` can be of multiple types					
	 * @param  {Function} job [the function to be executed]
	 * @return {Object}         [{jobId, promise}]
	 */
	SyncNode.prototype.pushJob = function (job) {
		var returnObj = null;
		if(job){
			if(typeof job === "function"){
				returnObj = pushJob(this.jobQueue, job);
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
		if(this.jobQueue.length==1 && !this.syncTaskPointer){
			this.stepAhead();
		}
	}

	/**
	 * The helps to move ahed the current pointer.
	 * It's exposed as api as sometime the person using the library may want a force stepAhead
	 * @return {Object} GeneratorValue
	 */
	SyncNode.prototype.stepAhead = function () {
		if(!this.syncTaskPointer){
			this.isRunning = true;
			this.observer = new Promise((resolve, reject)=>{
				this._observerResolve = resolve;
			});
			this.syncTaskPointer = this.syncTaskRunner(this.jobQueue);
		}
		return this.syncTaskPointer.next();
	}

	/**
	 * This is the generator to make things synchronous
	 * @yield {Object} returns a generator object
	 */
	SyncNode.prototype.syncTaskRunner = function* () {
		var jobQueue = this.jobQueue;
		while (jobQueue.length > 0) {
			var jobObj = jobQueue.shift();
			yield this.taskHandler(jobObj);
		}
		this.syncTaskPointer = null;
		this.isRunning = false;
		this._observerResolve(this.lastResponse.res);
	}

	SyncNode.prototype.taskHandler = function(jobObj) {
		var response = jobObj.job(this.lastResponse.res, this.lastResponse.err);
		Promise.resolve(response).then(function (data) {
			jobObj.isResolved = true;
			jobObj.response = data;
			this.lastResponse.err=null;
			this.lastResponse.res=data;
			this.syncTaskPointer.next();
		}.bind(this), function (err) {
			jobObj.isResolved = false;
			jobObj.response = err;
			this.lastResponse.err=err;
			this.lastResponse.res=null;
			this.syncTaskPointer.next();
		}.bind(this));
	}

	module.exports = {
		createQueue: function () {
			return new SyncNode();
		}
	}
})();
