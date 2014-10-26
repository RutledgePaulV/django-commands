/**
 * This module acts as the main entry point for dealing with FE -> BE commands.
 * In particular, it fetches the available commands and builds command objects
 * from the response and maintains a registry of those commands for easy execution.
 *
 * @module _
 */
var _ = (function (_) {

	/**
	 * Holds the uris / urls  for interacting with the backend.
	 *
	 * @type {{available: string, execution: string}}
	 */
	_.Endpoints = {
		available: '',
		execution: ''
	};


	/**
	 * The command definitions by command name as defined per the latest definition update.
	 * In general, there's no reason to not access a command out of the registry for execution
	 * since is the most closely related to the server definitions since it will be populated by
	 * them.
	 *
	 * @enum Command
	 */
	_.registry = {};


	/**
	 * This is the success function from a command definition retrieval.
	 * It will populate the registry with defined commands.
	 *
	 * @param {{name:string,required:{name:string, type:string}[]}[]} results
	 * @private
	 */
	var doneUpdatingCallback = $.proxy(function (response) {
		response.results.forEach(function (def) {
			var params = {}, defaults = {};
			for (var index in def.params) {
				if (def.params.hasOwnProperty(index)) {
					var param = def.params[index];
					params[param.name] = {type: param.type, required: param.required};
					if (param.default !== undefined) {
						defaults[param.name] = param.default;
					}
				}
			}
			this.registry[def.name] = new _.Command(def.name, params, defaults, this.Endpoints.execution);
		}, this);
	}, _);


	/**
	 * This represents the error function on an unsuccessful command definition retrieval.
	 *
	 * @param {error} error
	 * @private
	 */
	var errorUpdatingCallback = $.proxy(function (error) {
		alert('An error was encountered while retrieving available commands. Logging error to console.');
		console.error(error);
	}, _);


	/**
	 * A publicly accessible method that reloads the available commands
	 * cache that is used to validate commands before they are sent to the server.
	 *
	 * @param {function} [ready] A callback that gets fired after the command definitions have been loaded.
	 * @param {function} [error] A callback that gets fired if there is an error when loading command definitions.
	 */
	_.UpdateDefinitions = function (ready, error) {
		this.registry = {};

		var done = function (data) {
			doneUpdatingCallback(data);
			if (ready) {
				ready(data);
			}
		};

		var fail = function (data) {
			errorUpdatingCallback(data);
			if (error) {
				error(data);
			}
		};

		$.get(_.Endpoints.available).done(done).fail(fail);
	};

	return _;
})(_ || {});