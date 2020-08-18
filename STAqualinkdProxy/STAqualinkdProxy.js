//#!/usr/bin/env node

////////////////////////////////////////
// Starting Variables and Dependencies
////////////////////////////////////////
console.log("Starting STAqualinkdProxy");

// Loading Dependencies
var http = require("http");
var https = require('https');
var express = require("express");
var app = express();
var nconf = require('nconf');
nconf.file({ file: './config.json' });
fs = require('fs');
const aqualinkdAPIRequest = require('./aqualinkd/aqualinkdAPIRequest');

////////////////////////////////////////
// Logger Function
////////////////////////////////////////
var logger = function(mod,str) {
    console.log("[%s] [%s] %s", new Date().toISOString(), mod, str);
}

logger("Modules","Modules loaded");

// Setting Variables
var httpport = nconf.get('httpport');

//////////////////////////////////////////////////////////////////
// Creating Endpoints
// Those Endpoints will receive a HTTP GET Request
// Execute the associated Method to make the following:
//  "/" - Used to check if the STAqualinkdProxy is running
//  "/api/status" - Used to get Aqualinkd status
//////////////////////////////////////////////////////////////////

// Used only to check if NodeJS is running
app.get("/", function (req, res) {
    res.send("<html><body><h1>STAqualinkdProxy Running</h1></body></html>");
});

// Used to get Aqualinkd status
app.get("/api/status", function (req, res) {
    //alarmArm();
    //res.send("200 OK");
    res.end();
});

/**
 * discover
 */
// Used to discover all Aqualinkd devices
app.get("/discover", function (req, res) {
    aqualinkdDiscover();
    res.end();
}); 

/**
 * Subscribe route used by SmartThings Hub to register for callback/notifications and write to config.json
 * @param {String} host - The SmartThings Hub IP address and port number
 */
app.get('/subscribe/:host', function (req, res) {
    var parts = req.params.host.split(":");
    nconf.set('notify:address', parts[0]);
    nconf.set('notify:port', parts[1]);
    nconf.save(function (err) {
      if (err) {
        logger("Subscribe",'Configuration error: '+err.message);
        res.status(500).json({ error: 'Configuration error: '+err.message });
        return;
      }
    });
    res.end();
    logger("Subscribe","SmartThings HUB IpAddress: "+parts[0] +" Port: "+ parts[1]);
});

// Used to save the DSCAlarm password comming from SmartThings App
app.get('/config/:host', function (req, res) {
    //var parts = req.params.host.split(":");
    var parts = req.params.host;
    if(parts != "null"){
        nconf.set('dscalarm:alarmpassword', parts);
        nconf.save(function (err) {
            if (err) {
                logger("SaveConfig",'Configuration error: '+err.message);
                res.status(500).json({ error: 'Configuration error: '+err.message });
                return;
            }
        });
        logger("SaveConfig","DSCAlarm Panel Code Saved: "+parts);
        alarmPassword = nconf.get('dscalarm:alarmpassword');
        logger("SaveConfig","DSCAlarm Panel Reloading Config File: "+alarmPassword);
        
    }
    else{
        logger("SaveConfig","Failed to save DSCAlarm Panel Code password cannot be null");
    }
    res.end();
    
});

logger("HTTP Endpoint","All HTTP endpoints loaded");

////////////////////////////////////////
// Creating Server
////////////////////////////////////////
var server = http.createServer(app);
server.listen(httpport);
logger("HTTP Endpoint","HTTP Server Created at port: "+httpport);

//////////////////////////////////////////////////////////////////////////////////////
// Alarm DSC Serial Communication Fucntions
// List of function used to send the action to Alarm Board
//////////////////////////////////////////////////////////////////////////////////////

// Send the Arm command to Alarm
function alarmArm() {
    var cmd = "0331" + alarmPassword + "00";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// Send all aqualinkd devices from config.json back to SmartThings
// SmartThings will create one child device based on this settings
function aqualinkdDiscover(){
    if (nconf.get('aqualinkd:panelConfig')) {
        notify(JSON.stringify(nconf.get('aqualinkd:panelConfig')));
        logger("aqualinkdDiscover","Seding devices back: " + JSON.stringify(nconf.get('aqualinkd:panelConfig')));
    } else {
        logger("aqualinkdDiscover","PanelConfig not set.");
    }
    return;
}

///////////////////////////////////////////
// Function to send alarm msgs to SmartThing
///////////////////////////////////////////
function sendSmartThingMsg(command) {
    var msg = JSON.stringify({type: 'zone', command: command});
    notify(msg);
    logger("SendMartthingsMsg","Sending SmartThing comand: " + msg);
}

///////////////////////////////////////////
// Send HTTP callback to SmartThings HUB
///////////////////////////////////////////
/**
 * Callback to the SmartThings Hub via HTTP NOTIFY
 * @param {String} data - The HTTP message body
 */
var notify = function(data) {
    if (!nconf.get('notify:address') || nconf.get('notify:address').length == 0 ||
      !nconf.get('notify:port') || nconf.get('notify:port') == 0) {
      logger("Notify","Notify server address and port not set!");
      return;
    }
  
    var opts = {
      method: 'NOTIFY',
      host: nconf.get('notify:address'),
      port: nconf.get('notify:port'),
      path: '/notify',
      headers: {
        'CONTENT-TYPE': 'application/json',
        'CONTENT-LENGTH': Buffer.byteLength(data),
        'device': 'dscalarm'
      }
    };
  
    var req = http.request(opts);
    req.on('error', function(err, req, res) {
      logger("Notify","Notify error: "+err);
    });
    req.write(data);
    req.end();
}

// function aqualinkdAPIRequestcallback(responseObject) {
//     logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + JSON.stringify(responseObject));
//     logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + responseObject.version);
//     nconf.set('aqualinkd:panelConfig', responseObject);
//     nconf.save(function (err) {
//         if (err) {
//           logger("Subscribe",'Configuration error: '+err.message);
//           //res.status(500).json({ error: 'Configuration error: '+err.message });
//           return;
//         }
//     });
// }
// aqualinkdAPIRequest('/api/status', 'GET', '', aqualinkdAPIRequestcallback);