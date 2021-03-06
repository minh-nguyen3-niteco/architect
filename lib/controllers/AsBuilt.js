var assert = require("assert");

var ApiGeek = require("meta4qa"), _ = ApiGeek._, cli = ApiGeek.cli, Dialect = ApiGeek.Dialect, Runtime = ApiGeek.Runtime, helps = ApiGeek.helpers;

var util = require("util");
var helper = require("./helper");
var marked = require("marked");

var express = require('express');

var debug = require("debug")("apigeek:asbuilt");

// remote (results) logging

module.exports = function(apigeek) {

    assert(apigeek, "Missing ApiGeek");
    assert(apigeek.dialect, "Missing ApiGeek Dialect");
    assert(apigeek.config, "Missing ApiGeek Config");
    assert(apigeek.logger, "Missing ApiGeek Logger");

    var docs = apigeek.config.paths.docs;

    var api = {};
    var logger = apigeek.logger;

    var to_html = {};

    to_html.md = function (path, context) {
        assert(path, "Missing path");
        var md = helps.files.load(path);
        var html = marked (md);
        return html;
    };

    to_html.default = function(path, context) {
        assert(path, "Missing path");
        debug("load from: %s", path);
        try {
            var txt = helps.files.load(path);
            return txt;
        } catch(e) {
            return false;
        }
    };


    api.static = function (rootDir) {
        debug("static from: %s",rootDir);
        return express.static(rootDir);
    };

    api.render = function(rootDir, defaultExtn, view) {
        assert(rootDir, "Missing render root folder");

        view = view || "main";
        debug("renders %s with %s", rootDir, view);

        return function (req, res) {
            assert(req.params, "Missing path param");
            var file = req.params[0] || "index.html" ;
            if (defaultExtn && file.indexOf(".")<0) file = file+"."+defaultExtn;
            var extn = defaultExtn || helps.files.extension(file) || "default";

            var renderer = to_html[extn] || to_html.default;
            var path = helps.files.path(rootDir, file);
            var context = {};

            debug("rendered %s from: %s", extn, path);

            var body = renderer(path, context);
            if (body) {
                res.render (view, {"body": body});
            } else {
                res.status(404);
            }

        }
    };

    return api;
};