# :eight_pointed_black_star: RectangularJS  :eight_pointed_black_star:

[![AngularJS](https://img.shields.io/badge/AngularJS-1.7.8-blue.svg)](https://angularjs.org/)

### Render templates and data locally or from an API using a single file 

#### Author: Peter Swanson

## Overview

This AngularJS library makes developing dynamic web applications a breeze. Just specify an HTML template, the JSON data to compile it with, and the template tag to load it.  

Templates and data can passed directly, or loaded from one or more arbitrary APIs.

## Getting Started

1. Include RectangularJS in your HTML

    ```HTML
    <script src="https://cdn.jsdelivr.net/gh/Topazoo/rectangularjs@master/rectangular-min.js"></script>
    ```

2. Create and include a fixtures.js file

    ```HTML
    <script src="fixtures.js"></script>
    ```

    ```JavaScript
    var Fixtures = {
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

        settings: {
            DOM_attach_point: 'body',
        }
    };
    ```

3. Add your tag(s) to your document

    ```HTML
    <html>
        <head>
            <script src="https://cdn.jsdelivr.net/gh/Topazoo/rectangularjs@master/rectangular-min.js"></script>
            <script src="fixtures.js"></script>
        </head>
        <body>
            <response></response>
        </body>
    </html>
    ```

4. Done!
\
    <a href="https://imgur.com/J1EmOEK"><img src="https://i.imgur.com/J1EmOEK.png" title="source: imgur.com" /></a>

## [More Examples](https://github.com/Topazoo/rectangularjs/tree/master/examples/)
