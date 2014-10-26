/**
 * This file adds capabilities for front-end command validation
 * to the command module. This is used to do a quick check
 * on the validity of a command before sending the actual
 * request to the backend. It is primarily a developer convenience.
 *
 * @module _.Validation
 */
var _ = (function (_) {

	_.Validation = _.Validation || {

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

	return _;
})(_ || {});