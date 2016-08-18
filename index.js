#!/usr/bin/env node

var elasticsearch = require('elasticsearch');
var program = require('commander');

program
  .option('-u, --url', 'url, defaul is: `localhost:9200`')
  .option('-i, --index [value]', 'index')
  .option('-t, --type [value]', 'type')
  .option('-q, --query [value]', 'query, e.g.: `{query: {match_all: {}}}`')
  .parse(process.argv);

if (!program.index || !program.type || !program.query) {
  program.outputHelp();
  process.exit(0);
}

var url = program.url || 'localhost:9200';

var client = new elasticsearch.Client({
  host: url,
  log: 'error'
});

remove(program.index, program.type, program.query);

function remove(index, type, query) {
  var  q = {
    index: index,
    type: type,
    body: query,
    size: 1000,
    fields: []
  };

  client.search(q, function (error, response) {
    var hits = response.hits.hits;
    if (hits.length === 0) {
      return;
    }
    var bulk = {};
    bulk.body = [];
    hits.forEach(function(h) {
      bulk.body.push({ delete: { _index: 'tbdev', _type: 'event', _id: h._id } });
    });

    client.bulk(bulk, function (error, response) {
      remove(index, type, query);
    });
  });
}

