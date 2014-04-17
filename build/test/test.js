"use strict";
var expect;

expect = chai.expect;

require.config({
  paths: {
    "q": "../public/vendor/q",
    "jquery": "../public/vendor/jquery-2.0.3.min",
    "xdomain": "../public/vendor/xdomain",
    "parser": "../public/parser",
    "operation": "../public/operation",
    "operations": "../public/operations",
    "utils": "../public/utils"
  }
});

require(["parser", "operation", "jquery", "q", "xdomain"], function(Parser, Operation, $, Q) {
  return $(document).ready(function() {
    window.Parser = Parser;
    window.Operation = Operation;
    window.$ = $;
    window.Q = Q;
    return require(["test.general", "test.operation", "test.operations", "test.parser"], function() {
      return mocha.run();
    });
  });
});
