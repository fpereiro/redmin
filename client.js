(function () {

   // *** SETUP ***

   var dale = window.dale, teishi = window.teishi, lith = window.lith, c = window.c, B = window.B;
   var type = teishi.t, clog = console.log;

   // *** INITIALIZATION OF STATE/DATA ***

   B.do ({from: {ev: 'initialize'}}, 'set', 'State', {});
   B.do ({from: {ev: 'initialize'}}, 'set', 'Data',  {});

   window.State = B.get ('State'), window.Data = B.get ('Data');

   // *** INITIALIZATION ***

   c.ready (function () {
      B.mount ('body', Views.base ());
   });

   // *** VIEWS ***

   var Views = {};

   Views.base = function () {return [
      ['style', [
         ['body', {
            padding: 10,
         }],
         ['span.action', {
            cursor: 'pointer',
            color: 'blue',
         }],
      ]],
      B.view (['neverredraw'], {listen: [
         ['retrieve', 'keys', function () {
            c.ajax ('post', AJAXPATH, {}, {action: 'get', count: 100, match: '*' + B.get ('State', 'query') + '*'}, function (error, data) {
               if (error) return alert (error.responseText);
               var redminmonitor = data.body.redminmonitor;
               delete data.body.redminmonitor;
               B.do ('set', ['Data', 'keys'], data.body);
               return;
               if (redminmonitor) B.do ('set', ['Data', 'monitor'], redminmonitor);
               else {
                  c.ajax ('post', 'redmin/keys', {}, {count: 1, match: 'redminmonitor'}, function (error, data) {
                     if (error) return alert (error);
                     B.do ('set', ['Data', 'monitor'], data.body.redminmonitor);
                  });
               }
            });
         }],
         ['change', ['State', 'query'], function () {
            B.do ('retrieve', 'keys');
         }],
         ['delete', 'key', function (x, key) {
            if (! confirm ('Are you sure you want to delete the key ' + key + '?')) return;
            return alert ('Not implemented yet.');
            c.ajax ('delete', 'redmin/key', {}, {key: key}, function (error) {
               if (error) return alert (error);
               B.do ('retrieve', 'keys');
            });
         }],
         ['flushdb', '*', function () {
            if (! confirm ('Are you sure you want to empty the ENTIRE database?')) return;
            alert ('Not implemented yet.');
         }],
         ['change', ['State', 'sort'], function () {
            B.do ('change', ['Data', 'keys']);
         }],
      ], ondraw: function () {
         if (! B.get ('State', 'query')) B.do ('set', ['State', 'query'], '');
         if (! B.get ('State', 'show')) B.do ('set', ['State', 'show'], 'keys');
      }}, function () {
         return [
            ['span', B.ev ({class: 'action'}, ['onclick', 'retrieve', 'keys']), ' Refresh '],
            //['span', B.ev ({class: 'action'}, ['onclick', 'flushdb', '*']), 'Clear out entire db'],
            B.view (['State', 'show'], {tag: 'label'}, function (x, show) {
               if (show === 'monitor') return ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'show'], 'keys']), ' Show keys'];
               //return ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'show'], 'monitor']), ' Show monitor'];
            }),
            ['br'], ['br'],
         ];
      }),
      B.view (['State', 'show'], function (x, show) {
         if (! show) return;
         if (show === 'keys') return B.view (['Data', 'keys'], function (x, keys) {
            var Keys = dale.keys (keys), sort = B.get ('State', 'sort');
            if (sort) {
               Keys.sort (function (a, b) {
                  return keys [a] [sort] > keys [b] [sort] ? 1 : -1;
               });
            }
            return [
               B.view (['State', 'query'], function (x, query) {
                  return ['input', B.ev ({placeholder: 'filter', value: query}, ['onchange', 'set', ['State', 'query']])];
               }),
               ['br'],
               ['table', {class: 'pure-table pure-table-bordered'}, [
                  ['thead', ['tr', [
                     ['th', ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'sort'], 'mem']), 'Memory']],
                     ['th', ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'sort'], 'ttl']), 'Expires']],
                     ['th', ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'sort'], 'type']), 'Type']],
                     // Keys come sorted by keyname from the server.
                     ['th', ['span', B.ev ({class: 'action'}, ['onclick', 'set', ['State', 'sort'], undefined]), 'Name']],
                     ['th', 'Value'],
                  ]]],
                  dale.do (Keys, function (key) {
                     var value = keys [key];
                     return ['tr', [
                        ['td', value.mem],
                        ['td', value.ttl !== -1 ? value.ttl : ''],
                        ['td', value.type],
                        ['td', [key, ['br'], ['span' /*, B.ev ({class: 'action'}, ['onclick', 'delete', 'key', key]), 'delete'*/]]],
                        ['td', teishi.simple (value.val) ? value.val : (function () {
                           var keys = type (value.val) === 'array' ? dale.keys (value.val) : dale.keys (value.val).sort ();
                           return ['table', {class: 'pure-table pure-table-bordered pure-table-striped'}, dale.do (keys, function (key) {
                              return ['tr', [['td', key], ['td', value.val [key]]]];
                           })];
                        }) ()],
                     ]];
                  }),
               ]]
            ];
         });
         if (show === 'monitor') return B.view (['Data', 'monitor'], function (x, monitor) {
            return B.view (['State', 'monquery'], function (x, monquery) {
               var counter = 0;
               return [
                  ['input', B.ev ({placeholder: 'filter', value: monquery}, ['oninput', 'set', ['State', 'monquery']])],
                  ['ul', dale.do (monitor.val, function (item, k) {
                     if (counter > 300 || ! item.match (monquery)) return;
                     return ['li', [++counter, ' ', dale.do (JSON.parse (item), function (sitem) {
                        return sitem;
                     }).join (' ')]];
                  })],
               ];
            });
         });
      }),
   ]}

}) ();
