"use strict"
expect = chai.expect

require.config
  paths:
    "q": "../public/vendor/q"
    "jquery": "../public/vendor/jquery-2.0.3.min"
    "xdomain": "../public/vendor/xdomain"
    "parser": "../public/parser"
    "operation": "../public/operation"
    "operations": "../public/operations"
    "utils": "../public/utils"


require ["parser", "operation", "jquery", "q"], ( Parser, Operation, $, Q )->
  require ["xdomain"], ()->
    $(document).ready ()->
      window.Parser = Parser
      window.Operation = Operation
      window.$ = $
      window.Q = Q

      require ["test.general", "test.operation", "test.operations", "test.parser"], ()->
        mocha.run()