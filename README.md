# sync-node

This tiny node module will help you to make your tasks synchronous without blocking the main JavaScript thread.

	$ npm install sync-node

## The problem
JavaScript is single threaded; thus forces you to write asynchronous code. But there are scenarios where we may want some functions or tasks to run one after another. `Promises` are one of the best things to be used in these scenarios, but if you have a number of tasks like that, well putting `.then()` one after another will certainly make an ugly looking code.

In the other hand, there are libraries which makes things purely synchronous. But the problem with that is, JavaScript has only one thread, blocking which will paralyse your application for a while.

## The solution
This plugin works with a middle way, where it doesn't block anything, but still makes things synchronous.

The concept here is to provide you with a job queue, where you can push your functions one after another and they will be executed in the sequence they pushed. If a function is asynchronous, the next one of that will not be run till it gets resolved.

## Example
	var SN = require('sync-node');
	var pn = SN.createQueue();
	pn.pushJob(function(){
		return new Promise(function (resolve, reject) {
			setTimeout(function() {
				console.log("I am supposed to be first!!");
				resolve();
			}, 5000);
	
		})
	});
	pn.pushJob(function(){
	        console.log("I should come second!!");
	});
	
	pn.pushJob(function(){
		return new Promise(function (resolve, reject) {
			setTimeout(function() {
				console.log("Yes, I am third!!");
				resolve();
			}, 1000);
	
		})
	});
	
	
	pn.pushJob(function(){
	        console.log("Oh no.. I'm last!!");
	});

