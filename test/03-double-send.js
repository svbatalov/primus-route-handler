var assert = require('chai').assert;
var api_handler = require('../');
var express = require('express');
var Primus = require('primus.io');

describe('Calling res.send() two times', function () {

  var app = express();
  var router = express.Router();
  var port = (process.env.PORT || 5555) + 1;
  var server = require('http').createServer(app);
  var primus = new Primus(server);
  var client;

  it("should throw error on double res.send()", function (done) {

    router.get('/double-send', function (req, res, next) {
      try {
        res.send(1);
        res.send(2);
      } catch (e) {
        assert.include(e+'', 'more than once');
        done();
      }
    });
    
    primus.on('connection', function (spark) {
      spark.on('api', api_handler(spark, router));
    });

    client = new primus.Socket('http://localhost:'+port);
    server.listen(port, function () {
        client.send('api', '/double-send');
    });

  });
});
