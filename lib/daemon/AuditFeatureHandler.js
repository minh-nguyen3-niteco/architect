var pkg = require("../../package");
var assert = require("assert");
var _ = require("underscore");
var Dialect = require("apigeek-dialect"), helps = Dialect.helpers;
var util = require("util");

// local (runtime) logging

var debug = require("debug")("apigeek:daemon:audit");

// remote (results) logging

var logger = require('winston');
var logsene = require('winston-logsene');

module.exports = function(apigeek) {

    assert(apigeek, "Missing ApiGeek");
    assert(apigeek.dialect, "Missing ApiGeek Dialect");
    assert(apigeek.config, "Missing ApiGeek Config");

    return function(req, res, next) {
        assert(req.params, "Missing Request Parameters");
        assert(req.params.feature, "Missing Feature Parameter");
        assert(apigeek.config.featuresPath, "Missing featuresPath");

        var featureName = helps.vars.sanitize(req.params.feature);
        assert(featureName, "Missing feature ID");
        var featuresPath = apigeek.config.featuresPath+"/"+featureName+".feature";

        var sourceIP = helps.http.getClientAddress(req);
        var correlationId = req.query.correlationId || helps.vars.sanitize(pkg.name+"_"+featureName+"_"+sourceIP);

        // execution-specific config
        var config = { reporter: "simple", featuresPath: featuresPath+".feature" };

        debug("Feature @ %s", config.featuresPath);

        // allow query parameters to over-ride defaults
        _.each(req.query, function(v,k) {
            helps.vars.set(config, k, v);
        });

        // run the features

        try {
            var audit = apigeek.dialect.audit(featuresPath);
            res.json( audit );
        } catch (e) {
            if (e.code == "ENOENT") {
console.log("Not Found: %j", e);
                res.sendStatus(404);
            } else {
                logger.error(util.format("FATAL AUDIT %s: %s", featureName, e));
                res.sendStatus(500);
            }
        }

    }
}