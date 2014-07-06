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
        var field, res, toResolve, valResult;
        valResult = this.result[valName];
        if (typeof valResult === 'string' || typeof valResult === 'number') {
          if (cb && typeof cb === 'function') {
            return cb(valResult);
          } else {
            return valResult;
          }
        } else if (this.preBuildResults[valName]) {
          if (cb && typeof cb === 'function') {
            return Q(this.preBuildResults[valName] || null).then(function(val) {
              return cb(val);
            });
          } else {
            return this.preBuildResults[valName] || null;
          }
        } else if (this.parsingConfig[valName]) {
          field = this.parsingConfig[valName];
          toResolve = field;
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
      this.config = config;
      this.defaultParsingConfig = false;
      this.defaultValues = config.defaultValues || {};
      if (config instanceof HTMLDocument) {
        return this.doc = config;
      } else if (typeof config === "string") {
        parser = new DOMParser();
        return this.doc = parser.parseFromString(config, "application/xml");
      } else if (typeof config === "object") {
        this.doc = config.document || document;
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
    var cb, config, d, toWait, value, _i, _j, _len, _len1, _parse, _ref;
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
    if (this.config.defaultConfig) {
      this.defaultParsingConfig = {};
      _ref = this.config.defaultConfig;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        value = _ref[_j];
        this.defaultParsingConfig[value.name] = value;
      }
    }
    _parse = (function(_this) {
      return function(config) {
        var ld, _fn, _k, _len2;
        ld = Q.defer();
        _fn = function(value) {
          _this.result[value.name] = Q.fcall(function() {
            return _this.resolveValue(value);
          }).then(function(res) {
            if (!res && _this.defaultParsingConfig[value.name]) {
              return Q.fcall(function() {
                return _this.resolveValue(_this.defaultParsingConfig[value.name]);
              }).then(function(res) {
                if (!res && _this.defaultValues[value.name]) {
                  return _this.result[value.name] = _this.defaultValues[value.name];
                } else {
                  return _this.result[value.name] = res;
                }
              }, function(error) {
                return console.log("Error resolveValue in default config", error.stack);
              });
            } else {
              return _this.result[value.name] = res;
            }
          }, function(error) {
            return console.log("Error resolveValue", error.stack);
          });
          return toWait.push(_this.result[value.name]);
        };
        for (_k = 0, _len2 = config.length; _k < _len2; _k++) {
          value = config[_k];
          _fn(value);
        }
        Q.allSettled(toWait).then(function() {
          return ld.resolve(_this.result);
        });
        return ld.promise;
      };
    })(this);
    _parse(config).then((function(_this) {
      return function() {
        return _this.afterParse(_this.result).then(function() {
          if (cb && typeof cb === 'function') {
            return cb(_this.result);
          } else {
            return d.resolve(_this.result);
          }
        });
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
  Parser.prototype.afterParse = function() {
    var d, field, fieldName, _ref;
    d = Q.defer();
    _ref = this.parsingConfig;
    for (fieldName in _ref) {
      field = _ref[fieldName];
      if (!this.result[field.name] && field.required) {
        if (this.defaultValues[field.name]) {
          this.result[field.name] = this.defaultValues[field.name];
        } else if (field.prompt_text) {
          this.result[field.name] = prompt(field.prompt_text);
        } else {
          this.result[field.name] = prompt("Please set value for " + (field.label ? field.label : field.name));
        }
      }
    }
    d.resolve();
    return d.promise;
  };
  Parser.prototype.handlers = {
    postprocessing: function(config, result) {
      if (config.postprocessing) {
        return new Operation(config.postprocessing).evaluate(result);
      }
    },
    "default": function(config, result) {
      if (!result) {
        if (config["default"]) {
          return result = config["default"];
        } else {
          return result;
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
