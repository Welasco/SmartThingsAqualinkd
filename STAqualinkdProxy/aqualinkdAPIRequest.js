var http = require("http");
var nconf = require('nconf');
var logger = require("../tools/logger.js");
nconf.file({ file: './config.json' });

function aqualinkdAPIRequest(path, method, data, aqualinkdAPIRequestcallback) {
    if (!nconf.get('notify:address') || nconf.get('notify:address').length == 0 ||
      !nconf.get('notify:port') || nconf.get('notify:port') == 0) {
      logger("Notify","Notify server address and port not set!");
      return;
    }
  
    var opts = {
      method: method,
      host: nconf.get('aqualinkd:address'),
      port: nconf.get('aqualinkd:port'),
      path: path,
      headers: {
        'CONTENT-TYPE': 'application/json',
        'CONTENT-LENGTH': Buffer.byteLength(data),
      }
    };
  
    var req = http.request(opts,function(res) {
        res.setEncoding('utf-8');
    
        var responseString = '';
    
        res.on('data', function(data) {
          responseString += data;
        });
    
        res.on('end', function() {
          console.log(responseString);
          logger("aqualinkdAPIRequest","AqualinkD API Response: " + responseString);
          var responseObject = JSON.parse(responseString);
          aqualinkdAPIRequestcallback(responseObject);
        });
    });

    req.on('error', function(err, req, res) {
      logger("aqualinkdAPIRequest","aqualinkdAPIRequest error: "+err);
    });
    
    req.write(data);
    req.end();
}