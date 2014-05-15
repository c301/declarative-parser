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
      this.handleConfig(config);
      this.result = {};
      this.preBuildResults = {};
      this.value = function(valName, op, cb) {
        var field, res, toResolve;
        if (this.preBuildResults[valName]) {
          if (cb && typeof cb === 'function') {
            return Q(this.preBuildResults[valName] || null).then(function(val) {
              return cb(val);
            });
          } else {
            return this.preBuildResults[valName] || null;
          }
        } else if (this.parsingConfig[valName]) {
          field = this.parsingConfig[valName];
          toResolve = {
            name: field.name,
            operations: field.operations || field.value
          };
          res = this.resolveValue(toResolve, op);
          if (cb && typeof cb === 'function') {
            res.then(function(val) {
              return cb(val);
            });
          }
          return res;
        } else {
          if (cb && typeof cb === 'function') {
            return cb(null);
          }
        }
      };
      this.setAttr = function(attrName, value) {
        return this[attrName] = value;
      };
      this.getAttr = function(attrName) {
        return this[attrName] || null;
      };
    }

    Parser.prototype.handleConfig = function(config) {
      var parser;
      config = config || document;
      if (config instanceof HTMLDocument) {
        return this.doc = config;
      } else if (typeof config === "string") {
        parser = new DOMParser();
        return this.doc = parser.parseFromString(config, "application/xml");
      } else if (typeof config === "object") {
        this.doc = config.document || document;
        this.config = config;
        this.addOperations(this.config.operations || {});
        return this.addDecorators(this.config.decorators || {});
      }
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

    Parser.prototype.addFieldDecorators = function(handlers) {
      var handler, name, _results;
      _results = [];
      for (name in handlers) {
        if (!__hasProp.call(handlers, name)) continue;
        handler = handlers[name];
        _results.push(Parser.prototype.handlers[name] = handler);
      }
      return _results;
    };

    return Parser;

  })();

  /*
  @param {array} config
  @param {array} config
  ...
  @param {function} cb callback
   */
  Parser.prototype.parse = function() {
    var cb, config, d, toWait, value, _fn, _i, _j, _len, _len1;
    toWait = [];
    d = Q.defer();
    this.result = {};
    this.parsingConfig = {};
    if (arguments.length > 1) {
      if (typeof arguments[arguments.length - 1] === 'function') {
        cb = arguments[arguments.length - 1];
        config = Parser.prototype.mergeConfigs(Array.prototype.slice.call(arguments, 0, arguments.length - 1));
      } else {
        config = Parser.prototype.mergeConfigs(Array.prototype.slice.call(arguments, 0, arguments.length));
      }
    } else if (!arguments.length) {
      d.resolve(new Error("Wrong arguments"));
    } else {
      config = arguments[0];
    }
    for (_i = 0, _len = config.length; _i < _len; _i++) {
      value = config[_i];
      this.parsingConfig[value.name] = value;
    }
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
    for (_j = 0, _len1 = config.length; _j < _len1; _j++) {
      value = config[_j];
      _fn(value);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function() {
        if (cb && typeof cb === 'function') {
          return cb(_this.result);
        } else {
          return d.resolve(_this.result);
        }
      };
    })(this));
    return d.promise;
  };

  /*
  @param {object|array} configs
  @returns {object}
   */
  Parser.prototype.mergeConfigs = function(configs) {
    var config, field, res, _i, _j, _len, _len1;
    res = {};
    for (_i = 0, _len = configs.length; _i < _len; _i++) {
      config = configs[_i];
      for (_j = 0, _len1 = config.length; _j < _len1; _j++) {
        field = config[_j];
        if (typeof res[field.name] === "undefined") {
          res[field.name] = field;
        }
      }
    }
    return Object.keys(res).map(function(key) {
      return res[key];
    });
  };

  /*
  @value {object} value linked with operation
  @evalConfig {mixed} config for newly created operation
   */
  Parser.prototype.createOperationForValue = function(value, evalConfig) {
    return new Operation(evalConfig).setField(value).setParser(this);
  };
  Parser.prototype.resolveValue = function(value, operation) {
    var o;
    if (operation) {
      if (value.parentFields) {
        value.parentFields.push(operation.getField());
      } else {
        value.parentFields = [operation.getField()];
      }
    }
    o = this.createOperationForValue(value, value.operations || value.value);
    return o.evaluate(value.value).then((function(_this) {
      return function(res) {
        return _this.finalizeValue(o.getField(), res);
      };
    })(this));
  };
  Parser.prototype.handlers = {
    postprocessing: function(config, result) {
      if (config.postprocessing) {
        return new Operation(config.postprocessing).evaluate(result);
      }
    },
    required: function(config, result) {
      if (config.required && !result) {
        if (config.prompt_text) {
          return result = prompt(config.prompt_text);
        } else {
          return result = prompt("Please set value for " + (config.label ? config.label : config.name));
        }
      } else {
        return result;
      }
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
