'use strict';

if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/flycharts.esm.production.js');
} else {
	module.exports = require('./dist/flycharts.esm.development.js');
}
