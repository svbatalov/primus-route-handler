var qs     = require('qs');
var xtend  = require('xtend');
var log    = require('debug')('primus-express-router');

var httpStatus = require('http-status');

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
 *  @return {Function} primus event handler (metadata || String, data, fn)
 **/
module.exports = function (spark, router) {
  return function (meta, data, fn) {

    if ('string' === typeof meta) {
      /::/.test(meta) || (meta = 'GET::'+meta);
      var parts = meta.split('::');
      meta = {
        meth: parts[0],
        path: parts[1],
      };
    }

    if ('function' === typeof data) {
      fn = data;
      data = null;
    }
    meta.meth    = (meta.meth || 'get').toLowerCase();
    meta.path    = meta.path || '/';
    meta.query   = meta.query || qs.parse( meta.path.replace(/.*\?/, '') );
    meta.headers = meta.headers || {};

    var res = {
      sent: false,
      status: function (code, text) {
        if (code !== 200) {
          this.error = {status: code, statusText: text};
        }
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
    res.setHeader = function (k, v) {};
    res.sendStatus = function (status) {
      var text = '';
      (typeof status === 'number') && (text = httpStatus[status]);
      this.status(status, text).send();
    };

    var req = {
      url: meta.path,
      spark: spark,
      query: meta.query,
      body: data,
      method: meta.meth,
      headers: xtend({ 'content-type': 'application/json' }, meta.headers),
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
