var diff = require('deep-diff').diff;
var observableDiff = require('deep-diff').observableDiff;
var applyChange = require('deep-diff').applyChange;

var lhs = {
  name: 'my object',
  description: 'it\'s an object!',
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'elements']
  }
};

var rhs = {
  name: 'updated object',
  description: 'it\'s an object!',
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'more', 'elements', { than: 'before' }]
  }
};

var differences = diff(lhs, rhs);

//console.log(differences);

observableDiff(lhs, rhs, function (d) {
    // Apply all changes except to the name property...
    if (d.path[d.path.length - 1] !== 'name') {
      applyChange(lhs, rhs, d);
    }
    console.log(JSON.stringify(d));
});

//console.log(JSON.stringify(lhs));