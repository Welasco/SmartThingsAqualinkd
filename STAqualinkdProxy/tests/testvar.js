var nconf = require('nconf');
nconf.file({ file: './config.json' });

var var1 = "var1";
const const1 = "const1";
let let1 = "let1";

function funcvar1(param) {
    console.log("1: "+ param);
    param = "paramfuncvar1";
    console.log("2: "+ param);
}
funcvar1(var1);
console.log("3: "+ var1);

/////////////////////////////////////////////////////////////////////

nconf.file({ file: './config.json' });
var aqualinkdConfig = nconf.get('aqualinkd');
// Falta limpar o segundo nivel do objeto no nested function
function cleanJson(varobj) {
    let robj = varobj;
    //var robj = JSON.parse(JSON.stringify(varobj))
    for (var key in robj) {
        if (robj.hasOwnProperty(key)) {
            var val = robj[key];
            // console.log(key + ":" + val);
            if (typeof val === "object") {
                cleanJson(val);
            }
            else{
                robj[key] = "";
            }
        }
    }
    // return robj;
}
console.log("Obj1: "+JSON.stringify(aqualinkdConfig));
var newjsonobj = JSON.parse(JSON.stringify(aqualinkdConfig))
cleanJson(newjsonobj);
console.log("\r\nObj2: "+JSON.stringify(aqualinkdConfig));
console.log("\r\nObj3 CleanOBJ: "+JSON.stringify(newjsonobj));