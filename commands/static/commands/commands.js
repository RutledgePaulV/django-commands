define(['module', 'jquery'], function (module, $) {

	/**
	 * Exports
	 */
	var _ = {};


	/**
	 * Constructs a command object to be passed to the command service.
	 *
	 * @param {string} name The command key that the server will respond to.
	 * @param {object.<string,*>} [params] The required parameters for the command.
	 * @param {object.<string,*>} [defaults] Any defaults that should be applied.
	 * @param {string} [endpoint] The endpoint that the command should hit when fired.
	 * @constructor
	 */
	_.Command = function (name, params, defaults, endpoint) {
		this.name = name.toUpperCase();
		this.params = params || {};
		this.defaults = defaults || {};
		this.endpoint = endpoint || '';
	};


	_.Command.prototype = {

		constructor: _.Command,

		/**
		 * Executes a command and appropriately calls the success and failure callbacks.
		 *
		 * @param {object} [data]
		 * @param {function} [success]
		 * @param {function} [failure]
		 */
		fire: function (data, success, failure) {
			data = this.build(data || {});
			if (_.Validation.validateCommand(this, data)) {

				var promise = _.post(this.endpoint, data);

				if (success) {
					promise.done(success);
				}

				if (failure) {
					promise.fail(failure);
				}

				return promise;
			} else {
				var message = this.toMessage(data);
				if (failure) {
					failure(new Error(message));
				}
				else {
					console.error(message);
				}
				return null;
			}
		},

		/**
		 * A method for testing a command during development.
		 * It simply takes the response and logs it to the console.
		 *
		 * @param {object} [data] The data with which to initiate the command.
		 * @returns {*}
		 */
		test: function (data) {
			var successHandler = function (data) {
				console.log(data)
			};
			var failureHandler = function (data) {
				console.error(data)
			};
			return this.fire(data, successHandler, failureHandler);
		},

		/**
		 * Builds the data request given some input data for the specific command and any defaults that were defined.
		 * Any data that is passed in takes preference over the defaults if they share a key.
		 *
		 * @param data
		 * @returns {object}
		 */
		build: function (data) {
			var commandData = $.extend(true, {}, this.defaults, data);
			commandData.command = this.name;
			return commandData;
		},


		/**
		 * Builds a message to dump to the console comparing a command definition
		 * and the provided data so that a developer can debug why it failed.
		 *
		 * @param {object} data
		 * @returns {string}
		 */
		toMessage: function (data) {
			var message = "The provided command definition was: " + this.toString();
			message += "\nThe provided data was: " + JSON.stringify(data);
			return message;
		},

		/**
		 * Returns a more readable representation of a command definition. Does not include defaults.
		 *
		 * @returns {string}
		 */
		toString: function () {
			var params = [];
			for (var key in this.params) {
				if (this.params.hasOwnProperty(key)) {
					var param = this.params[key];
					params.push(key + ":<" + param.type + ">");
				}
			}
			return this.name + "=[" + params.join(", ") + "]";
		}
	};


	_.Validation = {

		/**
		 * Validates a command prior to execution according to the definitions
		 * received from the server, and any defaults that have been set on the
		 * front end.
		 *
		 * @param {_.Command} command The command key to be validated.
		 * @param {object} data The data intended to be sent along with the command.
		 * @private
		 */
		validateCommand: function (command, data) {
			if (_.registry.hasOwnProperty(command.name)) {
				for (var key in _.registry[command.name].params) {
					var param = _.registry[command.name].params[key];
					if (param.required && !data.hasOwnProperty(key)) {
						console.error('Required Parameter: ' + key + " was missing.");
						return false;
					}
					if (data.hasOwnProperty(key)) {
						if (!this._validateType(data[key], param.type)) {
							console.error("Invalid property type for property: " + key + ".");
							return false;
						}
					}
				}
			} else {
				console.warn("Could not find command: " + command.name + " in registry. Allowing execution anyway.");
			}
			return true;
		},

		/**
		 * Checks that a given object matches a type of the available options.
		 * Used for validation parameter types before sending a request to the server.
		 *
		 * @param {*} obj
		 * @param {string} type
		 */
		_validateType: function (obj, type) {

			if (!(type in this._validators)) {
				return false;
			}

			return this._validators[type](obj);
		},

		/**
		 * Provides a single function for each
		 * supported data type that returns a boolean
		 * indicating whether the provided data matches that type.
		 *
		 * @enum {function(data):boolean}
		 */
		_validators: {
			'blob': function (data) {
				return (data instanceof Blob);
			},
			'file': function (data) {
				return (data instanceof File);
			},
			'string': function (data) {
				return (data instanceof String || data.constructor === String);
			},
			'string[]': function (data) {
				if (!Array.isArray(data)) {
					return false;
				}
				return data.every(function (entry) {
					return this.string(entry);
				}, this);
			},
			'float': function (data) {
				return (data instanceof Number || data.constructor === Number);
			},
			'float[]': function (data) {
				if (!Array.isArray(data)) {
					return false;
				}
				return data.every(function (entry) {
					return this.float(entry);
				}, this);
			},
			'integer': function (data) {
				if (!this.float(data)) {
					return false;
				}
				return data === Math.floor(data);
			},
			'integer[]': function (data) {
				if (!Array.isArray(data)) {
					return false;
				}
				return data.every(function (entry) {
					return this.integer(entry);
				}, this);
			},
			'object': function (data) {
				return data === Object(data);
			},
			'object[]': function (data) {
				if (!Array.isArray(data)) {
					return false;
				}
				return data.every(function (entry) {
					return this.object(entry);
				}, this);
			}
		}
	};


	/**
	 * This method builds an appropriate data payload that can
	 * be sent to the server via ajax. We have to do custom building
	 * in case the user wanted to include both serializable types and
	 * binary types.
	 *
	 * @param {object} obj
	 * @returns {FormData}
	 */
	_.buildPayload = function (obj) {
		var form = new FormData();
		for (var key in obj) {
			var entry = obj[key];
			switch (entry.constructor) {
				case File:
				case Blob:
					form.append(key, entry);
					break;
				default:
					form.append(key, JSON.stringify(entry));
			}
		}
		return form;
	};

	/**
	 * We're defining our own version of jQuery's post method that will
	 * process the data according to our own build method instead of
	 * only stringifying everything.
	 *
	 * @param {string} uri
	 * @param {object} data
	 * @returns {jQuery.xhr}
	 */
	_.post = function (uri, data) {
		var payload = this.buildPayload(data);
		return $.ajax({
			url: uri,
			type: "POST",
			data: payload,
			cache: false,
			contentType: false,
			processData: false
		});
	};


	/**
	 * Holds the uris / urls  for interacting with the backend.
	 *
	 * @type {{available: string, execution: string}}
	 */
	_.Endpoints = {
		available: module.config().availableUrl,
		execution: module.config().executionUrl
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
		console.error(new Error(error));
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

		return $.get(_.Endpoints.available).done(done).fail(fail);
	};

	$.ajax({
		url: _.Endpoints.available,
		success: doneUpdatingCallback,
		error: errorUpdatingCallback,
		async: false
	});

	return _;
});