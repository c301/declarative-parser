"use strict";
var expect;

expect = chai.expect;

require.config({
  paths: {
    "q": "../public/vendor/q",
    "objectpath": "../public/vendor/objectpath",
    "jquery": "../public/vendor/jquery-2.0.3.min",
    "xdomain": "../public/vendor/xdomain",
    "parser": "../public/parser",
    "operation": "../public/operation",
    "operations": "../public/operations",
    "utils": "../public/utils"
  }
});

require(["parser", "operation", "jquery", "q", "objectpath"], function(Parser, Operation, $, Q, objectpath) {
  return require(["xdomain"], function() {
    return $(document).ready(function() {
      window.Parser = Parser;
      window.Operation = Operation;
      window.$ = $;
      window.Q = Q;
      window.objectpath = objectpath;
      return require(["test.general", "test.operation", "test.operations", "test.parser"], function() {
        return mocha.run();
      });
    });
  });
});
