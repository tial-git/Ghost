// # Is Helper
// Usage: `{{#is "paged"}}`, `{{#is "index, paged"}}`
// Checks whether we're in a given context.
var _               = require('lodash'),
    logging         = require('../logging'),
    i18n            = require('../i18n'),
    is;

is = function (context, options) {
    options = options || {};

    var currentContext = options.data.root.context;

    if (!_.isString(context)) {
        logging.warn(i18n.t('warnings.helpers.is.invalidAttribute'));
        return;
    }

    function evaluateContext(expr) {
        return expr.split(',').map(function (v) {
            return v.trim();
        }).reduce(function (p, c) {
            return p || _.includes(currentContext, c);
        }, false);
    }

    if (evaluateContext(context)) {
        return options.fn(this);
    }
    return options.inverse(this);
};

module.exports = is;
