// Library for loading arbitrary modules, routes and widgets from a specified fixtures file (fixtures.js).
var Bootstrapper =  {
    bootstrap: function() {
        /**
                                        *CALLED AUTOMATICALLY*
            Load fixtures from <<STATIC_ROOT>>/js/fixtures.js and register them with AngularJS on page load.
        **/
        
        angular.element(document).ready(function () { 
            var Renderer = Bootstrapper.fetch_module_service('Renderer');
            var _modules = Array.from(Fixtures.modules);
            
            (! Fixtures.modules) && (Fixtures.modules = []);

            Fixtures.widgets.map(widget => Bootstrapper.register_widget(widget));

            angular.bootstrap(angular.element(document).find(Fixtures.settings.DOM_attach_point), Fixtures.modules);
            _modules.map((module) => Renderer.register_controllers(module));
        });
    }(),

    register_widget: function({tag, template, models, api_template, api_models, directive_template}) {
        /**
            Register a widget that can be added to the DOM with a custom HTML tag. Widgets should be declared in a fixtures.js
            or by calling this function ( Bootstrapper.register_module() ).
            
            A widget is an HTML template and an optional set of models from the API that is fetched, compiled, and displayed when 
            specified on the DOM (e.g. <widget-tag></widget-tag>).
            
            --> tag - The HTML tag that renders the widget on the DOM
            --> api_models - A list of models (with optional filter and sort) to compile the template with, in the proper format for GET() (e.g. {'model': 'mymodel'} or 
                        {'model': 'mymodel', 'filter': 'name:model_name'}). Optional.
            --> directive_template - The template to specify in the directive. Optional.
            --> models - A list of objects to compile the widget with. Optional. *If api_models is also specified, the models fetched from the API are combined
                                    with the passed models*
            --> template - An HTML template (in string form) to use to render the widget. Used in place of fetching the template from the API. 
                                    Optional (must specify template_name if not used).
            --> api_template - //TODO - DOC
        **/

        var Renderer = Bootstrapper.fetch_module_service('Renderer');

        var new_widget_module = angular.module(tag, []); 
        
        new_widget_module.directive(tag, () => // Link the custom HTML tag to the widget renderer.
            ({
                scope: true,
                restrict: 'E',
                template: directive_template,
                link: (scope, element) => Renderer.render_template(scope, element, template, models, api_template, api_models)
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