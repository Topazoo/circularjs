// Library for loading arbitrary modules, routes and widgets from a specified fixtures file (fixtures.js).
var Bootstrapper =  {
    bootstrap: function() {
        /**
                                        *CALLED AUTOMATICALLY*
            Load fixtures from <<STATIC_ROOT>>/js/fixtures.js and register them with AngularJS on page load.
        **/

        angular.element(document).ready(function () { 
            Fixtures.widgets.map(widget => Bootstrapper.register_widget(widget));
            angular.bootstrap(angular.element(document).find(Fixtures.settings.DOM_attach_point), Array.from(Fixtures.modules));    
        });
    }(),

    register_widget: function({name, models, directive_template, models_override, template_override, template_data_path}) {
        /**
            Register a widget that can be added to the DOM with a custom HTML tag. Widgets should be declared in a fixtures.js
            or by calling this function ( Bootstrapper.register_module() ).
            
            A widget is an HTML template and an optional set of models from the API that is fetched, compiled, and displayed when 
            specified on the DOM using an HTML tag of the widget's name (e.g. <widget-name></widget-name>).
            
            --> name - The name of the widget template to register. *Becomes an HTML tag that can render the widget on the DOM*
            --> models - A list of models (with optional filter and sort) to compile the template with, in the proper format for GET() (e.g. {'model': 'mymodel'} or 
                        {'model': 'mymodel', 'filter': 'name:model_name'}). Optional.
            --> directive_template - The template to specify in the directive. Optional.
            --> models_override - A list of objects to compile the widget with. Optional. *If models is also specified, the models fetched from the API are combined
                                    with the passed models*
            --> template_override - An HTML template (in string form) to use to render the widget. Used in place of fetching the template from the API. 
                                    Optional (must specify template_name if not used).
            --> template_data_path - A dot-seperated path of keys to access the template value in the API response JSON.                                    
        **/

        var Renderer = Bootstrapper.fetch_module_service('Renderer');

        var new_widget_module = angular.module(name, []); // Widget module can be referenced as <<name>>-widget.
        
        new_widget_module.directive(name, () => // Link the custom HTML tag to the widget renderer.
            ({
                restrict: 'E',
                template: directive_template,
                link: (scope, element) => Renderer.render_template(scope, element, name, models, models_override, template_override, template_data_path)
            })
        );

        this.register_module(new_widget_module.name);
    },

    register_module: (name, create) => (Fixtures.modules.push(name) && create) ? angular.module(name, []) : null,
        /**
            Register or create an AngularJS module to use in the application. Modules can be declared in any script included in the DOM but must be 
            registered in fixtures.js or by calling this function ( Bootstrapper.register_module() ) before they can be used.
            
            --> name - The name of the module to register.
            --> create - True if the module should be created as it is being registered. False (or null) if the module has
                            already been created.
        **/

    fetch_module_service: (service_name, library_name) => angular.injector(['ng', (library_name) ? library_name : `${service_name}_Library`]).get(service_name)
        /**
            Allow access to the service of a declared AngularJS module without injecting it directly.

            --> service_name - The name of the service to access.
            --> library_name - The name of the module to access. Optional, defaults to <<service_name>>_Library.

            <-- AngularJS Module if a model was created. Otherwise null. 
        **/
};



// Library for rendering widgets.
angular.module('Renderer_Library', []).service('Renderer', ['$compile', function ($compile) { 
    this.render_template = function(scope, element, name, models, models_override, template_override, template_data_path) {
        /**
            Fetch a template and models from the API. Compile the template with the fetched data and add it to 
            the passed DOM element.
           
            --> scope - The scope passed from the directive link function.
            --> element - The DOM element to add the template to. Passed from the directive link function.
            --> models - A list of models to compile the template with, in the proper format for GET() (e.g. {'model': 'mymodel'} or 
                        {'model': 'mymodel', 'filter': 'name:model_name'}). Optional.
            --> name - The name of the template to load from the API (excluding the extension).
            --> models_override - A list of objects to compile the widget with. Optional. *If models is also specified, the models fetched from the API are combined
                                  with the passed models*
            --> template_override - An HTML template (in string form) to use to render the widget. Used in place of fetching the template from the API. 
                                    Optional (must specify name if not used).
            --> template_data_path - A dot-seperated path of keys to access the template value in the API response JSON.
        **/

        Renderer = this;
        API = Bootstrapper.fetch_module_service('API');
    
        if(models && models.length > 0 && (model = models[0]) && (key = Renderer.pop_model_key(model))) // Since API.GET runs asynchronously, recurse to get all models                                                                     
            API.GET({                                                                                   // from the API using API.GET's optional callback. 
                url: Renderer.pop_attr(model, 'url'),
                params: models.shift(), 
                callback: function(response) {
                    scope[key] = response; 
                    Renderer.render_template(scope, element, name, models, models_override, template_override, template_data_path); 
                }, 
                response_data_path: (model.data_path) ? model.data_path : Fixtures.settings.default_models_data_path 
            });

        else if (! template_override) // The final recursive call if loading the template from the API.
            API.GET({                 // Fetches the template after all models are retrieved, compiles them with the template.
                params: {'model': 'widget', 'filter': `name:${name}`},
                callback: (template) => Renderer.add_to_DOM(scope, element, template, models_override),
                response_data_path: (template_data_path) ? template_data_path : Fixtures.settings.default_template_data_path
            });

        else                          // The final recursive call if loading the template directly (as a string).
            Renderer.add_to_DOM(scope, element, template_override, models_override);
    };

    this.splice_models = function(scope, models_override) {
        /**
            Combine passed objects with objects fetched from the API as neatly as possible.
            If the passed objects have a <<model>> attribute, they will be stored by that key
            in the scope the template is compiled with (e.g. {'model': 'extra'} would be 
            referenced as {{ extra }} on the DOM). Multiple models of the same name are stored as
            a list. 
            
            *The default key is +models ( {{ +models }} on the DOM )*
           
            --> scope - The scope containing the models loaded from the API.
            --> models_override - A list of objects to add to the scope.
        **/

        models_override && models_override.forEach(model => {
            model_name = Renderer.pop_model_key(model);

            if (model_name)             
            { 
                if(scope[model_name]) // Existing Name
                    (Array.isArray(scope[model_name])) ? scope[model_name].push(model) : scope[model_name] = [scope[model_name], model];

                else                   // New Name
                    scope[model_name] = model;
            }
            
            else                      // Store with Default Key
                (scope[Fixtures.settings.default_model_scope_key]) ? 
                    scope[Fixtures.settings.default_model_scope_key].push(model) : 
                    scope[Fixtures.settings.default_model_scope_key] = [model];
        });
    };

    this.add_to_DOM = function(scope, element, template, models_override) { 
        /**
            Final logic used by render_template() to compile the template
            into an HTML element and add it to the DOM.
            
            --> scope - The scope containing the models loaded from the API.
            --> element - The DOM element to append the template to.
            --> template - The HTML template to add to the DOM (in string form).
            --> models_override - A list of objects to add to the scope.
        **/
       
        Renderer.splice_models(scope, models_override);
        element.append($compile(template)(scope));
        scope.$apply();
    };

    this.pop_model_key = (model) => (Renderer.pop_attr(model, 'scope_key') || Renderer.pop_attr(model, 'model'));
        /**
            Remove and return the key to be used to store the model
            in the scope. Uses the 'scope_key' attribute if specified or
            the 'model' attribute if no host key is specified.
            
            --> model - The model to remove the name from.
            <-- (String || null) - The model name (if it exists).
        **/


    this.pop_attr = (object, key) => { (val = object[key]); delete object[key]; return val; };
        /**
            Remove a key from an object and retrun it's value.
            
            --> object - The object to retrieve and remove the value from.
            --> key - The key of the object to retreive.

            <-- (any) - The value of the object at the key.
        **/
}]);



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