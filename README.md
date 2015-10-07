# primus-route-handler
Declare your API via express [router](http://expressjs.com/4x/api.html#router)
and communicate with it via [Primus.io](https://github.com/cayasso/primus.io)
or [Primus](https://github.com/primus/primus)+[primus-emitter](https://github.com/cayasso/primus-emitter)
(required for ack-callbacks) websocket.

### API
This module exports single function
```
var ws_api_handler = require('primus-route-handler');
```
which returns a callback for your api requests:
```
spark.on('api', ws_api_handler(spark, router));
```
You can use anything else instead of `'api'` here, but make sure
that client uses the same channel.

### Example
Server:
```js
// sample routes
var router = require('express').Router();
router.use(checkAuth);
router.get('/user/:id', function (req, res) {
	... get user info from database ...
	res.send(userinfo);
});

...
var ws_api_handler = require('primus-route-handler');

primus.on('connection', function (spark) {
	spark.on('api', ws_api_handler(spark, router));
});
```
Client:
```
var socket = new Primus('http://localhost:3000');
socket.send('api', '/user/1234', function (err, userinfo) {
	if (err) {
		// handle error
		// err.status contains status code
		// err.statusText may contain further description
	}
	console.log('User info:', userinfo);
});
```

Alternatively you can specify path as part of your data:
```
socket.send('api', {path: '/user/1234'}, cb);
```
Also you can specify method in the data object, if it matters for your routes:

Client:
```
socket.send('api', {path: '/user', method: 'post', user: {name: 'john', age: 30}}, cb);
```
Server:
```
router.post('/user', addUser)
```

Preferred way to specify path and optionally method is to use
string argument of the form `METHOD::PATH`
```
socket.send('api', 'POST::/user', {name: 'john', age: 30}, cb);
```

Method defaults to `'get'`.

### Routes
You specify routes as usually with express 4 router
([router](https://www.npmjs.com/package/router) module should work too.)
In route callbacks `req` argument can be used to gather information about request
and `res` allows to send response and set status. The same router may be usually
mounted into your express app to handle AJAX requests.

#### req
Available standard express fields are: `req.url`, `req.query` 
(parsed with [qs](https://github.com/hapijs/qs)), `req.body`, `req.method`,
`req.headers={'content-type': 'application/json'}` (default).
Additionally `req.spark` is available in case you want to do something specific
and do not plan to use this route for ajax. You can get original request object
via `req.spark.request`.

#### res
To send client response use `res.send(data)`. To set status use `res.status(code [, description]).send()`.
`res.send`, `res.end`, `res.json` are all the same function.

### Client library
Browserify users may require this module in client code to obtain simple api wrapper
with standard methods `get`, `post`, `put`, `delete` and `patch`:
```
var socket = new Primus();
var api = require('primus-route-handler')(socket);
api.post('/user', {name: 'Vasja', age: 50}, function (err, res) {...});
```

### Final handler
- If there are no matching route or last route handler calls `next()` an error
`{status: 404, statusText: 'Not Found'}` is sent to client.
- If middleware calls `next(ErrorObject)` then  error
`{status: ErrorObject.status || 500, statusText: ErrorObject.text || ErrorObject+''}`
 is returned to client.
- If `next(ErrorCode)` is used then `{status: ErrorCode, statusText: ErrorCode+''}`
 is sent.

### restify
You can generate REST routes for your Mongoose models using
[express-restify-mongoose](https://florianholzapfel.github.io/express-restify-mongoose/):
```
var router = express.Router();
var restify = require('express-restify-mongoose');
restify.serve(router, SomeMongooseModel);
```
Resulting `router` can be used to provide access to `SomeMongooseModel` over HTTP:
```
app.use(router);
```
as well as to provide the same routes over websocket:
```
primus.on('connection', function (spark) {
	spark.on('api', ws_api_handler(spark, router));
});
```

Other modules working with `express.Router()` should work with `primus-route-handler`
too (with minor tweaks maybe). This is actually the whole point of this module
-- to re-use existing code as much as possible.

### License
MIT
