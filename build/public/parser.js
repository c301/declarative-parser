var __hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operation", "q"], factory);
  } else {
    return root.Parser = factory(root.operation, root.Q);
  }
})(this, function(operation, Q) {
  var Parser;
  Parser = (function() {
    function Parser(config) {
      var parser;
      config = config || document;
      if (config instanceof HTMLDocument) {
        this.doc = config;
      } else if (typeof config === "string") {
        parser = new DOMParser();
        this.doc = parser.parseFromString(config, "application/xml");
      } else if (typeof config === "object") {
        this.handleConfig(config);
      }
      this.result = {};
      this.value = function(valName) {
        return this.result[valName] || false;
      };
      this.setAttr = function(attrName, value) {
        return this[attrName] = value;
      };
      this.getAttr = function(attrName) {
        return this[attrName] || null;
      };
    }

    Parser.prototype.handleConfig = function(config) {
      this.doc = config.document || document;
      this.config = config;
      this.config.onGetValue = this.config.onGetValue || function() {
        return null;
      };
      this.config.beforeParse = this.config.beforeParse || function() {
        return null;
      };
      this.config.afterParse = this.config.afterParse || function() {
        return null;
      };
      this.config.beforeParseValue = this.config.beforeParseValue || function() {
        return null;
      };
      this.config.afterParseValue = this.config.afterParseValue || function() {
        return null;
      };
      this.config.onGetValue = this.config.onGetValue || function() {
        return null;
      };
      this.addOperations(this.config.operations || {});
      return this.addDecorators(this.config.decorators || {});
    };

    Parser.prototype.addOperations = function(operations) {
      var name, _results;
      _results = [];
      for (name in operations) {
        if (!__hasProp.call(operations, name)) continue;
        operation = operations[name];
        _results.push(Operation.prototype.operations[name] = operation);
      }
      return _results;
    };

    Parser.prototype.addDecorators = function(decorators) {
      var decorator, name, _results;
      _results = [];
      for (name in decorators) {
        if (!__hasProp.call(decorators, name)) continue;
        decorator = decorators[name];
        _results.push(Operation.prototype.decorators[name] = decorator);
      }
      return _results;
    };

    return Parser;

  })();
  Parser.prototype.parse = function(config) {
    var d, toWait, value, _fn, _i, _len;
    toWait = [];
    d = Q.defer();
    this.result = {};
    _fn = (function(_this) {
      return function(value) {
        _this.result[value.name] = Q.fcall(function() {
          return _this.resolveValue(value);
        }).then(function(res) {
          return _this.result[value.name] = res;
        }, function(error) {
          return console.log("Error resolveValue", error.stack);
        });
        return toWait.push(_this.result[value.name]);
      };
    })(this);
    for (_i = 0, _len = config.length; _i < _len; _i++) {
      value = config[_i];
      _fn(value);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function() {
        return d.resolve(_this.result);
      };
    })(this));
    return d.promise;
  };

  /*
  @value {object} value linked with operation
  @evalConfig {mixed} config for newly created operation
   */
  Parser.prototype.createOperationForValue = function(value, evalConfig) {
    return new Operation(evalConfig).setField(value).setParser(this);
  };
  Parser.prototype.resolveValue = function(value) {
    var o;
    o = this.createOperationForValue(value, value.operations);
    return o.evaluate(value.value).then((function(_this) {
      return function(res) {
        return _this.finalizeValue(value, res);
      };
    })(this));
  };
  Parser.prototype.handlers = {
    required: function(config, result) {
      if (config.required && !result) {
        console.log(config);
        if (config.prompt_text) {
          return result = prompt(config.prompt_text);
        } else {
          return result = prompt("Please set value for " + (config.label ? config.label : config.name));
        }
      } else {
        return result;
      }
    },
    site_specific_fields: function(config, result) {
      var siteName, value, _ref;
      if (!this.result['site_specific_fields']) {
        this.result['site_specific_fields'] = {};
      }
      _ref = config['site_specific_fields'];
      for (siteName in _ref) {
        value = _ref[siteName];
        if (!this.result['site_specific_fields'][siteName]) {
          this.result['site_specific_fields'][siteName] = {};
        }
        this.result['site_specific_fields'][siteName][config.name] = value;
      }
      return result;
    }
  };
  Parser.prototype.finalizeValue = function(config, result) {
    var defer, found, func, handlerName, toReturn, toWait, _ref;
    defer = Q.defer();
    toReturn = result;
    found = false;
    toWait = null;
    _ref = Parser.prototype.handlers;
    for (handlerName in _ref) {
      func = _ref[handlerName];
      if (typeof config[handlerName] !== "undefined") {
        (function(_this) {
          return (function(handlerName, func) {
            if (toWait === null) {
              return toWait = Q(func.call(_this, config, result)).then(function(r) {
                return result = r;
              });
            } else {
              return toWait = toWait.then(function(r) {
                return Q(func.call(_this, config, result)).then(function(r) {
                  return result = r;
                });
              });
            }
          });
        })(this)(handlerName, func);
        found = true;
      }
    }
    if (!found) {
      defer.resolve(toReturn);
    } else {
      toWait.then(function() {
        return defer.resolve(result);
      });
    }
    return defer.promise;
  };
  return Parser;
});
