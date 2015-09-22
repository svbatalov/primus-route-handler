module.exports = function (socket, chan) {
  return {
    _send: function (path, meth, data, cb) {
      cb || (cb = data, data = null);
      path[0] !== '/' && (path = '/' + path);
      var p = meth + '::' + path;
      console.log('send', chan||'api', p, data, cb);
      socket.send(chan || 'api', p, data, cb);
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
