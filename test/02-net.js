var assert = require('chai').assert;
var api_handler = require('../');
var express = require('express');
var Primus = require('primus.io');

describe("Client-server tests", function () {

  var app = express();
  var router = express.Router();
  var port = process.env.PORT || 5555;
  var server = require('http').createServer(app);
  var primus = new Primus(server);
  var client, api;

  before(function (done) {

    router.get('/', function (req, res) {
      res.send('OK');
    });

    router.get('/ping', function (req, res) {
      res.send('pong');
    });

    router.get('/bad-middleware', function (req, res) {
      throw new Error('test-error');
    });

    router.get('/failing-middleware', function (req, res, next) {
      next(500);
    });

    router.get('/double-send', function (req, res, next) {
      res.send(1);
      res.send(2);
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
          data[k] = req[k];
        }
      }
      res.send(data);
    });

    primus.on('connection', function (spark) {
      spark.on('api', api_handler(spark, router));
    });
    client = new primus.Socket("http://localhost:"+port);
    api = require('../browser')(client);
    server.listen(port, done);
  });

  describe('raw interface', function () {

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
        assert.isNull(err);
        assert.deepEqual(req.query, { x: '1', y: '2', q: 'hi there' });
        done();
      });
    });

    it('should figure out correct method', function (done) {
      client.send('api', 'POST::/get-req', function (err, req) {
        assert.isNull(err);
        assert.equal(req.method, 'post');
        done();
      });
    });

    it('should pass correct body', function (done) {
      var body = {string: 'this is a string', pi: 3.1415};
      client.send('api', '/get-req', body, function (err, req) {
        assert.isNull(err);
        assert.deepEqual(req.body, body);
        done();
      });
    });

    it('should assume path /', function (done) {
      var body = {};
      client.send('api', body, function (err, res) {
        assert.isNull(err);
        assert.equal(res, 'OK');
        done();
      });
    });

    it('should return 500', function (done) {
      client.send('api', '/bad-middleware', function (err, res) {
        assert.deepEqual(err, {
          status: 500,
          statusText: 'Error: test-error'
        });
        assert.isUndefined(res);
        done();
      });
    });

    it('should return 500 via next(500) in middleware', function (done) {
      client.send('api', '/failing-middleware', function (err, res) {
        assert.deepEqual(err, {
          status: 500,
          statusText: '500'
        });
        assert.isUndefined(res);
        done();
      });
    });

    it('should reset content-type', function (done) {
      client.send('api', {
        path: '/get-req',
        headers: {
          'content-type': 'application/xml'
        }
      }, function (err, req) {
        assert.isNull(err);
        assert.deepEqual(req.headers, {
          'content-type': 'application/xml'
        });
        done();
      });
    });

    it('should not consider error code 200 as actual error', function (done) {
      client.send('api', '/error/200', function (err, res) {
        assert.isNull(err);
        assert.isUndefined(res);
        done();
      });
    });

  });

  describe('browser lib', function () {

    it('should do GET request', function (done) {
      api.get('/get-req', function (err, res) {
        assert.isNull(err);
        done();
      });
    });

    it('should add slash to the path', function (done) {
      api.get('get-req', function (err, req) {
        assert.isNull(err);
        assert.equal(req.url, '/get-req');
        done();
      });
    });

    it('should do POST request', function (done) {
      var body = { data: "some data" };
      api.post('get-req', body, function (err, req) {
        assert.isNull(err);
        assert.deepEqual(req.body, body);
        done();
      });
    });

    it('should do DELETE request', function (done) {
      api.delete('get-req', function (err, req) {
        assert.isNull(err);
        done();
      });
    });

    it('should do PUT request', function (done) {
      var body = { data: "some data" };
      api.put('get-req', body, function (err, req) {
        assert.isNull(err);
        assert.deepEqual(req.body, body);
        done();
      });
    });

    it('should do PATCH request', function (done) {
      var body = { data: "some data" };
      api.patch('get-req', body, function (err, req) {
        assert.isNull(err);
        assert.deepEqual(req.body, body);
        done();
      });
    });
  });

});
