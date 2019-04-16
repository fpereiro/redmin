/*
redmin - v0.1.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source (but not yet!).
*/

var dale   = require ('dale');
var teishi = require ('teishi');
var lith   = require ('lith');

var type = teishi.t;

var redmin = exports;

redmin.scan = function (match, count, cb) {
   var keys = {}, cursor = '0', scan = function () {
      redmin.redis.scan (cursor, 'MATCH', match, function (error, result) {
         if (error) return cb (error);
         cursor = result [0];
         dale.do (result [1], function (key) {
            keys [key] = true;
         });
         if (result [0] === '0' || Object.keys (keys).length >= count) return cb (null, Object.keys (keys).sort ());
         scan ();
      });
   }
   scan ();
}

redmin.get = function (opts, cb) {

   redmin.scan (opts.match, opts.count, function (error, keys) {
      if (error) return cb (error);

      var multi = redmin.redis.multi ();
      dale.do (keys, function (key) {multi.type (key)});

      multi.exec (function (error, types) {
         if (error) return cb (error);

         var multi = redmin.redis.multi ();
         dale.do (keys, function (key, i) {
            multi.ttl (key);
            multi.memory ('usage', key);
            if (types [i] === 'string') multi.get      (key);
            if (types [i] === 'hash')   multi.hgetall  (key);
            if (types [i] === 'list')   multi.lrange   (key, 0, -1);
            if (types [i] === 'set')    multi.smembers (key);
            if (types [i] === 'zset')   multi.zrange   (key, 0, -1, 'WITHSCORES');
         });

         multi.exec (function (error, values) {
            if (error) return cb (error);
            cb (null, dale.obj (keys, function (key, i) {
               return [key, {
                  type: types [i],
                  ttl:  values [i * 3],
                  mem:  values [i * 3 + 1],
                  val:  values [i * 3 + 2],
               }];
            }));
         });
      });
   });
}

redmin.html = function (i) {
   i = i || {};
   return lith.g ([
      ['!DOCTYPE HTML'],
      ['html', [
         ['head', [
            ['meta', {charset: 'utf-8'}],
            ['meta', {name: 'viewport', content: 'width=device-width,initial-scale=1'}],
            ['title', 'redmin'],
            ['link', {rel: 'stylesheet', href: i.pure || 'https://unpkg.com/purecss@1.0.0/build/pure-min.css'}],
         ]],
         ['body', [
            ['script', 'var AJAXPATH = "' + (i.server || '/redmin') + '";'],
            ['script', {src: i.gotob  || 'redmin/gotoB.min.js'}],
            ['script', {src: i.client || 'redmin/client.js'}]
         ]]
      ]]
   ]);
}

redmin.api = function (body, cb) {
   if (body.action === 'get')  return redmin.get  (body, cb);
   if (body.action === 'exec') return redmin.exec (body, cb);
}

redmin.exec = function (body, cb) {
   // TODO to be implemented.
   cb ();
}

redmin.monitor = function (time, args, reply) {
   if (args [0] === 'scan' || args [1] === 'redminmonitor') return;
   redmin.redis.lpush ('redminmonitor', JSON.stringify (args));
   redmin.redis.ltrim ('redminmonitor', 0, 10000);
}
