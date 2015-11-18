var assert = require('chai').assert;

describe("Client-server tests", function () {

  var api_handler = require('../');
  var express = require('express');
  var Primus = require('primus.io');
  var app = express();
  var router = express.Router();
  var port = process.env.PORT || 5555;
  var server = require('http').createServer(app);
  var primus = new Primus(server);
  var client;

  before(function (done) {

    router.get('/ping', function (req, res) {
      res.send('pong');
    });

    router.get('/error/:status', function (req, res) {
      var status = req.params.status;
      status = parseInt(status, 10);
      res.sendStatus(status);
    });

    router.all('/get-req', function (req, res) {
      var data = {};
      for(var k in req) {
        if (typeof req[k] !== 'function' && k !== 'spark') {
          data[k] = req[k]
        }
      }
      res.send(data);
    });

    primus.on('connection', function (spark) {
      spark.on('api', api_handler(spark, router));
    });
    client = new primus.Socket("http://localhost:"+port);
      server.listen(port, done);
  });

  it('should ping the server and receive pong', function (done) {
    client.send('api', '/ping', function (err, res) {
      assert.isNull(err);
      assert.equal(res, 'pong');
      done();
    });
  });

  it('should answer with 401', function (done) {
    client.send('api', '/not-exists', function (err, res) {
      assert.deepEqual(err, {
        status: 404,
        statusText: 'Not Found'
      });
      assert.isUndefined(res);
      done();
    });
  });

  it('should answer with 500', function (done) {
    client.send('api', '/error/500', function (err, res) {
      assert.deepEqual(err, {
        status: 500,
        statusText: 'Internal Server Error'
      });
      assert.isUndefined(res);
      done();
    });
  });

  it('should parse query string', function (done) {
    client.send('api', '/get-req?x=1&y=2&q=hi%20there', function (err, req) {
      console.log("REQ", err, req);
      assert.isNull(err);
      assert.deepEqual(req.query, { x: '1', y: '2', q: 'hi there' });
      done();
    });
  });
});
