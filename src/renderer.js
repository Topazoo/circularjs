// Library for rendering widgets.
angular.module('Renderer_Library', []).service('Renderer', ['$compile', function ($compile) { 
    this.render_template = function(scope, element, template, models, api_template, api_models) {
        /**
            Fetch a template and models from the API. Compile the template with the fetched data and add it to 
            the passed DOM element.
           
            --> scope - The scope passed from the directive link function.
            --> element - The DOM element to add the template to. Passed from the directive link function.
            --> api_models - A list of models to compile the template with, in the proper format for GET() (e.g. {'model': 'mymodel'} or 
                        {'model': 'mymodel', 'filter': 'name:model_name'}). Optional.
            --> api_template - TODO - Doc
            --> models - A list of objects to compile the widget with. Optional. *If api_models is also specified, the models fetched from the API are combined
                                  with the passed models*
            --> template - An HTML template (in string form) to use to render the widget. Used in place of fetching the template from the API. 
                                    Optional (must specify api_template if not used).
            --> template_data_path - A dot-seperated path of keys to access the template value in the API response JSON.
        **/

        Renderer = this;
        API = Bootstrapper.fetch_module_service('API');
    
        if(api_models && api_models.length > 0 && (model = api_models[0]) && (key = Renderer.pop_model_key(model)))                                                                      
            API.GET({                                   // Since API.GET runs asynchronously, recurse to get all models                                              
                url: Renderer.pop_attr(model, 'url'),   // from the API using API.GET's optional callback. 
                params: api_models.shift(), 
                callback: function(response) {
                    Renderer.insert_model(scope, response, Renderer.pop_model_key(model)); 
                    Renderer.render_template(scope, element, template, models, api_template, api_models); 
                }, 
                response_data_path: (model.data_path) ? model.data_path : Fixtures.settings.default_model_data_path 
            });

        else if (! template)          // The final recursive call if loading the template from the API.
            API.GET({                 // Fetches the template after all models are retrieved, compiles them with the template.
                url: (api_template.url) ? api_template.url : Fixtures.settings.default_template_url,
                params: (api_template.params) ? api_template.params : Fixtures.settings.default_template_params,
                callback: (template) => Renderer.add_to_DOM(scope, element, template, models),
                response_data_path: (api_template.data_path) ? api_template.data_path : Fixtures.settings.default_template_data_path,
            });

        else                          // The final recursive call if loading the template directly (as a string).
            Renderer.add_to_DOM(scope, element, template, models);
    };

    this.splice_models = (scope, models) => 
        models && models.forEach(model => Renderer.insert_model(scope, model))
        /**
            Combine passed objects with objects fetched from the API as neatly as possible.
            If the passed objects have a 'scope_key' or 'model' attribute, they will be stored by that key
            in the scope the template is compiled with (e.g. {'model': 'extra'} would be 
            referenced as {{ extra }} on the DOM). Multiple models of the same name are stored as
            a list. 
           
            --> scope - The scope containing the models loaded from the API.
            --> models - A list of objects to add to the scope.
        **/


    this.insert_model = function(scope, model, key) {
        /**
            Add a model to the scope, handling existing models. Repeating models are stored in a list
           
            --> scope - The scope containing the models loaded from the API.
            --> model - The model object to add to the scope.
            --> key - The scope containing the models loaded from the API. (Optional - set to the 'scope_key' attribute,
                      the model attribute, or the the default key in settings in that order).
        **/
    
       !key && (key = Renderer.pop_model_key(model));
    
       if (key)             
       { 
           if(scope[key]) // Existing Name
               (Array.isArray(scope[key])) ? scope[key].push(model) : scope[key] = [scope[key], model];

           else                   // New Name
               scope[key] = model;
       }
       
       else                      // Store with Default Key
           (scope[Fixtures.settings.default_model_scope_key]) ? 
               scope[Fixtures.settings.default_model_scope_key].push(model) : 
               scope[Fixtures.settings.default_model_scope_key] = [model];
        
    }

    this.add_to_DOM = function(scope, element, template, models) { 
        /**
            Final logic used by render_template() to compile the template
            into an HTML element and add it to the DOM.
            
            --> scope - The scope containing the models loaded from the API.
            --> element - The DOM element to append the template to.
            --> template - The HTML template to add to the DOM (in string form).
            --> models - A list of objects to add to the scope.
        **/

        Renderer.splice_models(scope, models);
        element.append($compile(template)(scope));
        scope.$apply();
    };

    this.pop_model_key = (model) => Renderer.pop_attr(model, 'scope_key') || model.model;
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