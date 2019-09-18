// Library for rendering widgets.

angular.module('Renderer_Library', []).service('Renderer', ['$compile', function ($compile) { 
    this.render_template = function(scope, element, models, template_name, models_override, template_override) {
        /**
            Fetch a template and models from the API. Compile the template with the fetched data and add it to 
            the passed DOM element.
           
            --> scope - The scope passed from the directive link function.
            --> element - The DOM element to add the template to. Passed from the directive link function.
            --> models - A list of models to compile the template with, in the proper format for GET() (e.g. {'model': 'mymodel'} or 
                        {'model': 'mymodel', 'filter': 'name:model_name'}). Optional.
            --> template_name - The name of the template to load from the API (excluding the extension).
            --> models_override - A list of objects to compile the widget with. Optional. *If models is also specified, the models fetched from the API are combined
                                  with the passed models*
            --> template_override - An HTML template (in string form) to use to render the widget. Used in place of fetching the template from the API. 
                                    Optional (must specify template_name if not used).
        **/

        Renderer = this;
        API = Bootstrapper.fetch_module_service('API');
    
        if(models && models.length > 0) // Since API.GET runs asynchronously, recurse to get all models from the API using API.GET's optional
            API.GET({                   // callback. 
                url: models[0].url,
                params: models[0], 
                callback: function(response) {
                    scope[Renderer.pop_model_key(models[0])] = response; 
                    Renderer.render_template(scope, element, models.slice(1), template_name, models_override, template_override); 
                }, 
                response_data_path: Fixtures.settings.default_models_data_path //TODO - PRefer local rule
            });

        // TODO - ADD OVERRIDES FOR URL PER TEMPLATE?
        else if (! template_override) // The final recursive call if loading the template from the API.
            API.GET({                 // Fetches the template after all models are retrieved, compiles them with the template.
                params: {'model': 'widget', 'filter': `name:${template_name}`},
                callback: (template) => Renderer.add_to_DOM(scope, element, template, models_override),
                response_data_path: Fixtures.settings.default_template_data_path
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

    this.pop_model_key = function(model) {
        /**
            Remove and return the key to be used to store the model
            in the scope. Uses the 'scope_key' attribute if specified or
            the 'model' attribute if no host key is specified.
            
            --> model - The model to remove the name from.
            <-- (String || null) - The model name (if it exists).
        **/

        var model_name = (model.scope_key) ? model.scope_key : (model.model) ? model.model : null;  
        delete model.model && delete model.scope_key;

        return model_name;
    };
}]);




