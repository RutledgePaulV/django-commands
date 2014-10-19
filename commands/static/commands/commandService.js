/**
 * This module acts as the main entry point for dealing with FE -> BE commands.
 * In particular, it provides validation per the definitions provided by the backend
 * to prevent sending requests that would be rejected anyway. This may not be necessary
 * as the amount of ajax content shouldn't be excessive yet, but nonetheless it forces
 * clean and maintainable structure.
 *
 *
 * @module _
 */
var _ = (function (_) {

	_.Endpoints = {
		all: '',
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
	 * A publicly accessible method that reloads the available commands
	 * cache that is used to validate commands before they are sent to the server.
	 *
	 * @param {function} [ready] A callback that gets fired after the command definitions have been loaded.
	 * @param {string} [uriEndpoint] An optional alternative endpoint from which to populate the commands.
	 */
	_.UpdateDefinitions = function (ready, uriEndpoint) {
		this.registry = {};
		var done = $.proxy(this._doneUpdatingCallback, this);

		var callback = function (data) {
			done(data);
			if (ready) {
				ready(data);
			}
		};

		$.get(uriEndpoint || _.Endpoints.available).done(callback).fail(this._errorUpdatingCallback);
	};

	/**
	 * A publicly accessible method that executes a given command
	 * after first performing validation.
	 *
	 * @param {_.Command} command
	 * @param {object} [data]
	 * @param {function} [success]
	 * @param {function} [failure]
	 */
	_.ExecuteCommand = function (command, data, success, failure) {

		if (!command instanceof _.Command) {
			throw new Error("Invalid command object provided. Aborting execution of command.");
		}

		data = command.buildData(data || {});

		if (this._validateCommand(command, data)) {

			data = this.stringifyApplicable(data);

			// If no success function was given, let's just print it to the console.
			if (!success) {
				success = function (data) {
					console.log(data);
				};
			}

			// This is the actual execution of the validated command.
			$.post(_.Endpoints.execution, data).done(success).fail(failure);

		} else {

			var message = this._buildCommandMessage(command, data);

			// either passing the error to their failure callback or just throwing it.
			if (failure) {
				failure(new Error(message));
			} else {
				console.error(message);
			}
		}
	};

	/**
	 * This builds a meaningful message intended to provide the necessary information
	 * to diagnose why a given command failed validation.
	 *
	 * @param {_.Command} command
	 * @param {object} data
	 */
	_._buildCommandMessage = $.proxy(function (command, data) {

		var message;

		if (this.registry.hasOwnProperty(command.name)) {
			message = "The server definition was: " + this.registry[command.name].toString();
		} else {
			message = 'No server definition of this command was found.';
		}

		message += "\nThe provided command definition was: " + command.toString();
		message += "\nThe provided data was: " + JSON.stringify(data);

		return message;
	}, _);

	/**
	 * This method stringifies fields on the data for the command POST that
	 * would otherwise be interpreted incorrectly. We only stringify a subset
	 * of the fields so that you can still post things like binary data via a
	 * command.
	 *
	 * @param {object}
	 * @returns {object}
	 */
	_.stringifyApplicable = $.proxy(function(data){
		var resultData = data;
		var regDefinition = this.registry[data.command];

		for(var key in regDefinition.params){
			var param = regDefinition.params[key];
			switch(param.type){
				case 'blob':
				case 'blob[]':
				case 'file':
				case 'file[]':
					resultData[key] = data[key];
					break;
				default:
					resultData[key] = JSON.stringify(data[key]);
			}
		}

		return resultData;
	}, _);

	/**
	 * This represents the success function from a command definition retrieval.
	 *
	 * @param {{name:string,required:{name:string, type:string}[]}[]} results
	 * @private
	 */
	_._doneUpdatingCallback = $.proxy(function (response) {
		response.results.forEach(function (command) {
			this.registry[command.name] = _.Command.fromServer(command);
		}, this);
	}, _);

	/**
	 * This represents the error function on an unsuccessful command definition retrieval.
	 *
	 * @param {error} error
	 * @private
	 */
	_._errorUpdatingCallback = $.proxy(function (error) {
		alert('An error was encountered while retrieving available commands. Logging error to console.');
		console.error(error);
	}, _);

	/**
	 * Validates a command prior to execution according to the definitions
	 * received from the server, and any defaults that have been set on the
	 * front end.
	 *
	 * @param {_.Command} command The command key to be validated.
	 * @param {object} data The data intended to be sent along with the command.
	 * @private
	 */
	_._validateCommand = function (command, data) {
		if (this.registry.hasOwnProperty(command.name)) {
			for (var key in this.registry[command.name].params) {
				var param = this.registry[command.name].params[key];
				if (param.required && !data.hasOwnProperty(key)) {
					console.error('Required Parameter: ' + key + " was missing.");
					return false;
				}
				if (data.hasOwnProperty(key)) {
					if (!_.Validation.typeIs(data[key], param.type)) {
						console.error("Invalid property type for property: " + key + ".");
						return false;
					}
				}
			}
		} else {
			console.warn("Could not find command: " + command.name + " in registry. Allowing execution anyway.");
		}
		return true;
	};

	return _;
})(_ || {});