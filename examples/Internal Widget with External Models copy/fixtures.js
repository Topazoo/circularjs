var Fixtures = {

    modules: [],

    widgets: [ 
        {
            tag: 'response',
            template: `<h1> API CALL 1:</h1>
                       <h2> Fetched Text: "{{ todo[0].title }}" </h2>
                       <h3> Fetched ID: "{{ todo[0].id }}" </h3>
                       <br><hr><br>
                       <h1> API CALL 2:</h1>
                       <h2> Fetched Text: "{{ todo[1].title }}" </h2>
                       <h3> Fetched ID: "{{ todo[1].id }}" </h3>`,
            api_models: [
                {
                    model: 'todo',
                    url: 'https://jsonplaceholder.typicode.com/todos/1',
                    data_path: 'data'
                },
                {
                    model: 'todo',
                    url: 'https://jsonplaceholder.typicode.com/todos/2',
                    data_path: 'data'
                },
            ]
        },
    ],

    routes: [],

    settings: {
        DOM_attach_point: 'body',
    }
};

