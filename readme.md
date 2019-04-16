# redmin

A web admin for redis.

## Current status of the project

The current version of redmin, v0.1.1, is considered to be *experimental*. Please use it with caution. This status will hopefully change as I use the tool repeatedly and with growing confidence.

## Installation

redmin is meant to be used as a complement to a web application based on node.js. To install it: `npm install redmin`.

The dependencies of redmin are six:

- [dale](https://github.com/fpereiro/dale)
- [teishi](https://github.com/fpereiro/teishi)
- [lith](https://github.com/fpereiro/lith)
- [gotoB](https://github.com/fpereiro/gotoB)
- [redis](https://github.com/NodeRedis/node_redis)
- [PureCSS](https://purecss.io/) - this is an optional dependency.

## Purpose

redmin is a admin tool for redis meant to be used together with an existing web application also based in redis. This makes redmin very simple for three reasons: 1) the auth/session logic can be delegated to the web application; 2) redis doesn't have to be exposed to the internet; 3) redmin does not need to be hosted independently.

Despite its simplicity, redmin will hopefully replace the redis command line for many operations, saving time and improving the safety of direct database manipulations.

## Usage

redmin has to be included within a set of routes within your web application. If your application is exposed to the internet, you should put the redmin routes *after* a certain user is logged in as an admin - **otherwise any user (or anyone) will have direct read and write database to your redis**.

To connect redmin to your redis database, assign `redmin.redis` to your redis instance. For example:

```javascript
var redis  = require ('redis').createClient ();
var redmin = require ('redmin');
redmin.redis = redis;
```

The following routes should only be accessible to admin users which are fully trusted.

To serve the HTML for bootstrapping the redmin client in `GET /redmin` (could be any other route as well), serve the output of `redmin.html` - this function will generate an HTML page that will load redmin. The function can be invoked without arguments, or with an object with these parameters (all of them optional):

- `pure`: path to PureCSS. Defaults to `https://unpkg.com/purecss@1.0.0/build/pure-min.css`.
- `server`: path to make queries to redmin. Defaults to `redmin`.
- `gotob`: path to gotoB. Defaults to `redmin/gotoB.min.js`.
- `client`: path to the redmin client. Defaults to `redmin/client.js`.

To serve gotoB and the redmin client, you'll need to add GET routes for accessing those two static resources.

To allow the client to reach the redmin server, add an endpoint at `POST /redmin` (or the endpoint you specified in the `server` parameter passed to `redmin.client`). This endpoint should invoke `redmin.api` with two arguments: the body received plus a callback.

If you're using [cicek](https://github.com/fpereiro/cicek), this is what the redmin routes could look like:

```javascript
['get', 'redmin', reply, redmin.html ()],
['post', 'redmin', function (rq, rs) {
   redmin.api (rq.body, function (error, data) {
      if (error) return cicek.reply (rs, 500, {error: error});
      cicek.reply (rs, 200, data);
   });
}],
['get', 'redmin/client.js',    cicek.file, 'node_modules/redmin/client.js'],
['get', 'redmin/gotoB.min.js', cicek.file, 'node_modules/gotob/gotoB.min.js'],
```

## Performance

When listing keys, redmin uses `scan` to incrementally iterate redis keys, so it can be used against large databases in production environments without fear of blocking the database. However, large lists, sets and zsets are retrieved at once instead of being scanned - this should be changed in the future.

Please remember that redmin is experimental, for the time being.

## Source code

The complete source code is contained in `client.js` and `server.js`. It is about 240 lines long.

Annotated source code will be forthcoming when the library stabilizes.

## License

redmin is written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.
