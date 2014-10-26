/**
 * Adding functionality to build a command payload for any object of the
 * supported data types for a payload.
 *
 * @module _
 */
var _ = (function(_){

	/**
	 * This method builds an appropriate data payload that can
	 * be sent to the server via ajax. We have to do custom building
	 * in case the user wanted to include both serializable types and
	 * binary types.
	 *
	 * @param {object} obj
	 * @returns {FormData}
	 */
	_.buildPayload = function(obj){
		var form = new FormData();
		for(var key in obj){
			var entry = obj[key];
			switch(entry.constructor){
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
	_.post = function(uri, data){
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

	return _;
})(_ || {});