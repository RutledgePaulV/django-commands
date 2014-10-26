/**
 * This file adds to the _ module a class definition for the _.Command
 * type which represents an executable command. Typically these will be
 * defined by the server to the front-end via _.UpdateDefinitions();
 *
 * @module _
 */
var _ = (function (_) {

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

	/**
	 * @lends _.Command
	 */
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
				success = success || function (data) {console.log(data);};
				_.post(this.endpoint, data).done(success).fail(failure);
			} else {
				var message = this.toMessage(data);
				if (failure) {failure(new Error(message));}
				else {console.error(message);}
			}
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
		toMessage: function(data) {
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

	return _;
})(_ || {});


