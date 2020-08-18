var nconf = require('nconf');
nconf.file({ file: './config.json' });
var objJson = nconf.get('aqualinkd');

var diff = require('deep-diff').diff;
var observableDiff = require('deep-diff').observableDiff;
var applyChange = require('deep-diff').applyChange;

//console.log(JSON.stringify(objJson));

// for(var attributename in objJson){
//     console.log(attributename+": "+objJson[attributename]);
// }

// for (var prop in objJson) {
//     if (objJson.hasOwnProperty(prop)) {
//         switch (prop) {
//             // obj[prop] has the value
//         }
//         console.log(prop+": "+objJson[prop]);
//     }
// }

// var keys = Object.keys( objJson );
// for( var i = 0,length = keys.length; i < length; i++ ) {
//     objJson[ keys[ i ] ];
// }

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

var newaqualink = {
    "address": "",
    "port": "",
    "panelConfig": {
        "type": "",
        "status": "",
        "version": "",
        "aqualinkd_version": "",
        "date": "",
        "time": "",
        "pool_htr_set_pnt": "",
        "spa_htr_set_pnt": "",
        "frz_protect_set_pnt": "",
        "air_temp": "",
        "pool_temp": "",
        "spa_temp": " ",
        "swg_percent": "",
        "swg_ppm": "",
        "temp_units": "",
        "battery": "",
        "leds": {
            "Filter_Pump": "",
            "Spa_Mode": "",
            "Aux_1": "",
            "Aux_2": "",
            "Aux_3": "",
            "Aux_4": "",
            "Aux_5": "",
            "Aux_6": "",
            "Aux_7": "",
            "Pool_Heater": "",
            "Spa_Heater": "",
            "Solar_Heater": "",
            "SWG": "",
            "SWG/Boost": "",
            "Freeze_Protect": ""
        }
    }
}    

// var keys = Object.keys(objJson);
// for(var i = 0; i < keys.length; i++) 
// {
//     var key = keys[i];
//     //console.log(key);
//     console.log(objJson[key]);
// }

observableDiff(objJson, aqualink, function (d) {
    // Apply all changes except to the name property...
    if (d.path[d.path.length - 1] !== 'type' && d.path[d.path.length - 1] !== 'status' && d.path[d.path.length - 1] !== 'version' && d.path[d.path.length - 1] !== 'aqualinkd_version' && d.path[d.path.length - 1] !== 'date' && d.path[d.path.length - 1] !== 'time') {
        applyChange(newaqualink, aqualink, d);
        console.log("###################################");
        console.log(JSON.stringify(d.path[d.path.length - 1]));
    }    
});

console.log(JSON.stringify(newaqualink));