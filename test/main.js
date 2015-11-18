var assert = require('chai').assert;

describe('Core', function () {
  var handler = require('../');
  before(function (done) {
    done();
  });

  it('should fill request and response objects', function (done) {
    var spark = {};
    var url = '/test?x=1&y="hi"'
    var body = {some: 'data'};

    var h = handler(spark, function (req, res) {
      
      assert.deepEqual(req, {
        method: "get",
        url: url,
        body: body,
        query: { "x":"1", "y": "\"hi\""},
        spark: spark,
        headers: {
          "content-type": "application/json"
        }
      });

      assert.isDefined(res.status, 'res.status() is defined');
      assert.isDefined(res.json, 'res.json() is defined');
      assert.isDefined(res.end, 'res.end() is defined');
      assert.isDefined(res.send, 'res.send() is defined');
      assert.isDefined(res.sendStatus, 'res.sendStatus() is defined');
      assert.isDefined(res.setHeader, 'res.setHeader() is defined');

      done();
    });

    h(url, body)
  });
});
