var nconf = require('nconf');
nconf.file({ file: './config.json' });
var aqualinkdConfig = nconf.get('aqualinkd');
var aqualinkdAPIRequest = require('./aqualinkdAPIRequest');
var logger = require("../tools/logger.js");

var diff = require('deep-diff').diff;
var observableDiff = require('deep-diff').observableDiff;
var applyChange = require('deep-diff').applyChange;

function cleanJson(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var val = obj[key];
            if (typeof val === "object") {
                cleanJson(val);
            }
            else{
                obj[key] = "";
            }
        }
    }
}

var aqualink = {
    "address": "aqualinkd.eduaralm.com",
    "port": "80",
    "panelConfig": {
        "type": "status",
        "status": "Ready",
        "version": "PDA-PS6 Combo PPD PDA. 5.0",
        "aqualinkd_version": "2.1.0",
        "date": "SAT",
        "time": "12:22PM",
        "pool_htr_set_pnt": "86",
        "spa_htr_set_pnt": "95",
        "frz_protect_set_pnt": "38",
        "air_temp": "97",
        "pool_temp": "81",
        "spa_temp": " ",
        "swg_percent": "95",
        "swg_ppm": "3500",
        "temp_units": "f",
        "battery": "ok",
        "leds": {
            "Filter_Pump": "on",
            "Spa_Mode": "off",
            "Aux_1": "off",
            "Aux_2": "off",
            "Aux_3": "off",
            "Aux_4": "on",
            "Aux_5": "off",
            "Aux_6": "off",
            "Aux_7": "off",
            "Pool_Heater": "off",
            "Spa_Heater": "off",
            "Solar_Heater": "on",
            "SWG": "off",
            "SWG/Boost": "off",
            "Freeze_Protect": "enabled"
        }
    }
}

function refreshAqualinkd(){
    var difaqualinkconfig = JSON.parse(JSON.stringify(aqualinkdConfig))
    cleanJson(difaqualinkconfig);

    observableDiff(aqualinkdConfig, aqualink, function (d) {
        // Apply all changes except to the name property...
        if (d.path[d.path.length - 1] !== 'type' && d.path[d.path.length - 1] !== 'status' && d.path[d.path.length - 1] !== 'version' && d.path[d.path.length - 1] !== 'aqualinkd_version' && d.path[d.path.length - 1] !== 'date' && d.path[d.path.length - 1] !== 'time') {
            applyChange(difaqualinkconfig, aqualink, d);
            console.log("###################################");
            console.log(JSON.stringify(d.path[d.path.length - 1]));
        }
    });

    console.log("######################################################################");
    console.log("aqualinkdConfig: "+JSON.stringify(aqualinkdConfig));
    console.log("aqualink: "+JSON.stringify(aqualink));
    console.log("difaqualinkconfig: "+JSON.stringify(difaqualinkconfig));


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
    aqualinkdAPIRequest('/api/status', 'GET', '', function(responseObject) {
        logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + JSON.stringify(responseObject));
        // logger("aqualinkdAPIRequestcallback","aqualinkdAPIRequestcallback responseObject: " + responseObject.version);
        nconf.set('aqualinkd:panelConfig', responseObject);
        nconf.save(function (err) {
            if (err) {
            logger("Subscribe",'Configuration error: '+err.message);
            //res.status(500).json({ error: 'Configuration error: '+err.message });
            return;
            }
        });
    });    
}

module.exports = {
    refreshAqualinkd: refreshAqualinkd
};