var qs     = require('qs');
var log    = require('debug')('primus-express-router');

/**
 *  Returns a callback to reemit 'api' requests
 *  on 'router' with express-like req, res
 *  arguments prefilled.
 *
 *  E.g. res.send() sends response over websocket.
 *
 *  This allows to use express route callbacks
 *  to handle websocket events.
 *
 *  @param {spark} Primus spark object
 *  @param {router} Express router
 *  @return {Function} primus event handler (path, data, fn)
 **/
module.exports = function (spark, router) {
  return function (path, data, fn) {

    var method;

    if ('string' !== typeof path) {
      fn = data;
      data = path;
      path = data && data.path || '/';
    }

    if ('function' === typeof data) {
      fn = data;
      data = null;
    }

    // parse querystring if present
    var parts = path.split('?');
    var query = qs.parse( parts[1] );

    parts = path.split('::');
    if (parts.length === 2) {
      method = parts[0];
      path = parts[1];
    }

    var res = {
      sent: false,
      status: function (code, text) {
        if (code !== 200) { this.error = {status: code, statusText: text}; }
        this.statusCode = code;
        this.statusText = text;
        return this;
      },
      send: function () {
        if (this.sent) {
          throw new Error('You called res.send() more than once.');
        }
        this.sent = true;
        [].unshift.call(arguments, this.error);
        log('send(err=%j)', this.error);
        fn && fn.apply(this, arguments);
      }
    };

    res.json = res.send;
    res.end = res.send;
    res.setHeader = function () {};

    var req = {
      url: path,
      spark: spark,
      query: query,
      body: data,
      method: (method || data && data.method || 'get').toLowerCase(),
      headers: {
        'content-type': 'application/json'
      },
    };

    var fin = function fin (err) {

      log('calling final handler for %j (method=%j, err=%j)', req.url, req.method, err);

      if (err) {
        if ("object" === typeof err) {
          return res.status(err.status || 500, err.text || err+'').send();
        }
        return res.status(err, err + '').send();
      }

      return res.status(404, 'Not Found').send();
    };

    router(req, res, fin);
  };
};
