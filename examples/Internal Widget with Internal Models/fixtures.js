var Fixtures = {
    widgets: [ 
        {
            tag: 'hello',
            template: '<h1> {{ string[0].string }} {{ string[1].string }} {{ end.phrase }} {{ string[1].punc }} </h1>',
            models: [
                {
                    model: 'string',
                    string: 'Hello'
                },
                {
                    model: 'string',
                    string: 'World',
                    punc: '!'
                },
                {
                    model: 'string',
                    phrase: '(with models)',
                    scope_key: 'end'
                }
            ]
        },
    ],

    settings: {
        DOM_attach_point: 'body',
    }
};

