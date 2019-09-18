// Library for interacting with the server's API
angular.module('API_Library', []).service('API', ['$http', function ($http) { 
    this.GET = function({url, params, callback, response_data_path}) {
        /**
            Simplifies the boilerplate code necessary to send an AngularJS GET request to the server.
            IMPORTANT: Since requests are asynchronous, function passes the returned response to a
            callback function when received and DOES NOT return the response.
           
            --> $http - The AngularJS HTTP serviced passed from the controller sending the request.
            --> url - The url to send the GET request to.
            --> params - A map of parameters to send with the request (e.g. {'model': 'mymodel'}).
            --> callback - The function to call when a response from the server is received. *The passed
                           callback function MUST specify a response parameter (e.g. func(response){})*.
            --> response_data_path - A dot seperated path to specify a partial chunk of the response to send to the callback 
                                     instead of the whole response (e.g. 'model.name' to access the sub-value name 
                                     of the value model in the response).
        **/
    
        $http({ url: (url) ? url : Fixtures.settings.default_api_url, method: "GET",  params: params })
        .then((! response_data_path) ? callback : (response) => API.parse_response(response, response_data_path, callback));
    };
    
    this.parse_response = function(response, key, callback) {
        /**
            Handles parsing the JSON response for the specified value or sub-value.
           
            --> response - The raw JSON response from the server to parse.
            --> key - A dot seperated path to specify a partial chunk of the response to send to the callback 
                      (e.g. 'models.0.name' to access the sub-value name of the first model in the response's array of models).
            --> callback - The function to call with the retreived chunk. *The passed
                           callback function MUST specify a response parameter (e.g. func(response){})*.
        **/
    
        key.split('.').forEach((path) => response = (Array.isArray(response[path])) ? API.fix_json_list(response[path]) : response[path]);
    
        callback(response);
    };
    
    this.fix_json_list = function(json_list) {
        /**
            Fixes nested JSON in lists (if it is in string form). Fixes occur on-demand by either calling function
            with a list of JSON in string form, or when a parsing a response in parse_response().
           
            --> json_list - A list of JSON in string form (e.g. [ "{"key1": "value1"}", "{"key2": "value2"}" ]).
           
            <-- List<Object> A list of containing the parsed JSON objects.
        **/
    
        try { return json_list.map(JSON.parse); } catch (e) { return json_list; }
    };
}]);