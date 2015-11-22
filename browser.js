module.exports = function (socket, chan) {
  return {
    _send: function (path, meth, data, cb) {
      var meta = { path: path, meth: meth };

      if ("object" === typeof path) {
        meta = path;
        meta.meth = meth;
      }

      cb || (cb = data, data = null);

      socket.send(chan || 'api', meta, data, cb);
    },
    get: function (path, data, cb) {
      return this._send(path, 'GET', data, cb);
    },
    delete: function (path, data, cb) {
      return this._send(path, 'DELETE', data, cb);
    },
    put: function (path, data, cb) {
      return this._send(path, 'PUT', data, cb);
    },
    post: function (path, data, cb) {
      return this._send(path, 'POST', data, cb);
    },
    patch: function (path, data, cb) {
      return this._send(path, 'PATCH', data, cb);
    },
  };
};
