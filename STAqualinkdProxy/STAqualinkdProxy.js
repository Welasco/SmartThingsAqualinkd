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
//  "/" - Used to check if the alarm is running
//  "/api/alarmArmAway" - Used to arm the alarm in away mode
//////////////////////////////////////////////////////////////////

// Used only to check if NodeJS is running
app.get("/", function (req, res) {
    res.send("<html><body><h1>STAqualinkdProxy Running</h1></body></html>");
});

// Used to arm the alarm using the alarm password
app.get("/api/status", function (req, res) {
    //alarmArm();
    //res.send("200 OK");
    res.end();
});

/**
 * discover
 */
// Used to send all zones back to SmartThings
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

// Send the ArmAway command to Alarm
function alarmArmAway() {
    var cmd = "0301";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// Send the ArmStay command to Alarm
function alarmArmStay() {
    var cmd = "0321";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// Send the Disarm command to Alarm
function alarmDisarm() {
    var cmd = "0401" + alarmPassword + "00";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// Send the Break command to Alarm
function alarmSendBreak() {
    var cmd = "070^";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// Send the Enable Chime command to Alarm
function alarmChimeToggle() {
    var cmd = "070c";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
    // wait for 1800 and call alarmSendBreak
    setTimeout(alarmSendBreak, 1800);
}

// Send the Activate Panic command to Alarm
function alarmPanic() {
    var cmd = "0603";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// This command will send the code to the alarm when ever the alarm ask for it with a 900
function alarmSendCode() {
    var cmd = "2001" + alarmPassword + "00";
    cmd = appendChecksum(cmd);
    sendToSerial(cmd);
}

// alarm Status Request
function alarmUpdate() {
    var cmd = "001";
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

function aqualinkdAPIRequestcallback(responseObject) {
    logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + JSON.stringify(responseObject));
    logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + responseObject.version);
    nconf.set('aqualinkd:panelConfig', responseObject);
    nconf.save(function (err) {
        if (err) {
          logger("Subscribe",'Configuration error: '+err.message);
          //res.status(500).json({ error: 'Configuration error: '+err.message });
          return;
        }
    });
    
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

aqualinkdAPIRequest('/api/status', 'GET', '', aqualinkdAPIRequestcallback);