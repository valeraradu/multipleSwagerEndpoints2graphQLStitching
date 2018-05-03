const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const graphQLSchema = require('swagger-to-graphql');
const bodyParser = require('body-parser');

var http = require('http');
var fs = require('fs');

const server1ProxyUrl = 'http://localhost:8090';
const pathToServer1SwaggerSchema = './server1.json';

const server2ProxyUrl = 'http://localhost:8080';
const pathToServer2SwaggerSchema = './server2.json';

var server1json = new Promise(function(resolve, reject) {
      var file = fs.createWriteStream(pathToServer1SwaggerSchema);
      file.on("finish", () => {})
          .on("close", () => { 
              resolve(pathToServer1SwaggerSchema)
            })
      var request = http.get(server1ProxyUrl + "/v2/api-docs", function(response) {
        response.pipe(file);
      });

})

var server2json = new Promise(function(resolve, reject) {
      var file = fs.createWriteStream(pathToServer2SwaggerSchema);
      file.on("finish", () => {})
            .on("close", () => { 
              resolve(pathToServer2SwaggerSchema)
            })
      var request = http.get(server2ProxyUrl + "/v2/api-docs", function(response) {
        response.pipe(file);
      });
  
})

const customHeaders = {
  // Authorization: 'Basic YWRkOmJhc2ljQXV0aA=='
}

graphQLSchema(server1json, server1ProxyUrl, customHeaders).then(schema => {
  app.use('/graphql', graphqlHTTP(() => {
    return {
      schema,
      graphiql: true
    };
  }));

  app.listen(3009, '0.0.0.0', () => {
    console.info('http://localhost:3009/graphql');
  });
}).catch(e => {
  console.log(e);
});

graphQLSchema(server2json, server2ProxyUrl, customHeaders).then(schema => {
  app.use('/graphql', graphqlHTTP(() => {
    return {
      schema,
      graphiql: true
    };
  }));

  app.listen(3010, '0.0.0.0', () => {
    console.info('http://localhost:3010/graphql');
  });
}).catch(e => {
  console.log(e);
});


const PORT = process.env.PORT || 2999,
  { graphqlExpress } = require('apollo-server-express'),
  { mergeSchemas } = require('graphql-tools'),
  { getIntrospectSchema } = require('./introspection');

const endpoints = [
  'http://localhost:3009/graphql',
  'http://localhost:3010/graphql'
];

(async function () {
  try {
    allSchemas = await Promise.all(endpoints.map(ep => getIntrospectSchema(ep)));
    app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: mergeSchemas({ schemas: allSchemas }) }));
    app.listen(PORT, () => console.log('GraphQL API listening on port:' + PORT));
  } catch (error) {
    console.log('ERROR: Failed to grab introspection queries', error);
  }
})();