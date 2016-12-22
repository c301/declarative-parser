var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operation", "q"], factory);
  } else {
    return root.Parser = factory(root.operation, root.Q);
  }
})(this, function(operation, Q) {
  var Parser, StopParsingError;
  Parser = (function() {
    function Parser(config) {
      this.handleConfig(config);
      this.parsingConfig = {};
      this.afterParseRule = config ? config.afterParse : false;
      this.result = {};
      this.value = function(valName, op, cb) {
        var field, res, toResolve, valResult;
        valResult = this.result[valName];
        if (valResult !== void 0) {
          if (cb && typeof cb === 'function') {
            return cb(valResult);
          } else {
            return valResult;
          }
        } else if (this.preBuildResults[valName] || this.preBuildResults[valName] === false) {
          if (cb && typeof cb === 'function') {
            return Q(this.preBuildResults[valName] || Operation.EMPTY_VALUE).then(function(val) {
              return cb(val);
            });
          } else {
            return this.preBuildResults[valName] || Operation.EMPTY_VALUE;
          }
        } else if (this.parsingConfig[valName]) {
          field = this.parsingConfig[valName];
          toResolve = field;
          res = Q.fcall((function(_this) {
            return function() {
              return _this.resolveValue(toResolve, op);
            };
          })(this));
          res.then((function(_this) {
            return function(val) {
              _this.result[valName] = val;
              if (cb && typeof cb === 'function') {
                return cb(val);
              }
            };
          })(this), (function(_this) {
            return function(error) {
              if (error.type = "StopParsingError") {
                return _this.stopParsing();
              } else {
                if (cb && typeof cb === 'function') {
                  return cb(false);
                }
              }
            };
          })(this));
          return res;
        } else {
          if (cb && typeof cb === 'function') {
            return cb(Operation.EMPTY_VALUE);
          } else {
            return Operation.EMPTY_VALUE;
          }
        }
      };
      this.setAttr = function(attrName, value) {
        return this[attrName] = value;
      };
      this.getAttr = function(attrName) {
        if (this[attrName] === void 0 || this[attrName] === null || this[attrName] === false) {
          return Operation.EMPTY_VALUE;
        } else {
          return this[attrName];
        }
      };
    }

    Parser.prototype.handleConfig = function(config) {
      var parser;
      config = config || document;
      this.config = config;
      this.config.prompt = this.config.prompt || prompt.bind(window);
      this.defaultParsingConfig = false;
      this.defaultValues = config.defaultValues || {};
      this.preBuildResults = config.preBuildResults || {};
      this.debug = config.debug || false;
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
  Parser.prototype.log = function() {
    if (this.debug) {
      return console.log.apply(console, arguments);
    }
  };

  /*
  @param {array} config
  @param {array} config
  ...
  @param {function} cb callback
   */
  Parser.prototype.parse = function() {
    var cb, config, d, toWait, value, _i, _j, _len, _len1, _parse, _ref;
    if (this.config.onParsingStart) {
      this.config.onParsingStart();
    }
    toWait = [];
    d = Q.defer();
    this.result = {};
    this.parsingConfig = {};
    this.configs = [];
    if (arguments.length > 1) {
      if (typeof arguments[arguments.length - 1] === 'function') {
        cb = arguments[arguments.length - 1];
        this.configs = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
      } else {
        this.configs = Array.prototype.slice.call(arguments, 0, arguments.length);
      }
      config = Parser.prototype.mergeConfigs(this.configs);
    } else if (!arguments.length) {
      d.resolve(new Error("Wrong arguments"));
    } else {
      config = arguments[0];
      this.configs = [config];
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
        var handleValue, queue, _parseDeferred;
        _parseDeferred = Q.defer();
        handleValue = function(value) {
          var handleDeferred;
          if (_this.debug) {
            value.debug = _this.debug;
          }
          handleDeferred = Q.defer();
          _this.log("= Parser: calculating " + value.name + ". Config:", value);
          Q.fcall(function() {
            return _this.resolveValue(value);
          }).then(function(res) {
            if (!res && _this.defaultParsingConfig[value.name]) {
              return Q.fcall(function() {
                return _this.resolveValue(_this.defaultParsingConfig[value.name]);
              }).then(function(res) {
                if (!res && _this.defaultValues[value.name]) {
                  _this.result[value.name] = _this.defaultValues[value.name];
                } else {
                  _this.result[value.name] = res;
                }
                return handleDeferred.resolve();
              }, function(error) {
                if (error instanceof StopParsingError) {
                  console.log(error.message);
                  return handleDeferred.reject(error);
                } else {
                  console.log("Error resolveValue", error.stack);
                  return handleDeferred.resolve();
                }
              });
            } else {
              _this.log("= Parser: calculated " + value.name + ". Result:", res);
              _this.result[value.name] = res;
              return handleDeferred.resolve();
            }
          }, function(error) {
            if (error instanceof StopParsingError) {
              console.log(error.message);
              return handleDeferred.reject(error);
            } else {
              console.log("Error resolveValue", error.stack);
              return handleDeferred.resolve();
            }
          });
          return handleDeferred.promise;
        };
        queue = Q(true);
        queue.then(function() {
          config.forEach(function(value) {
            queue = queue.then(function() {
              return handleValue(value);
            });
            return queue = queue.then(function() {
              if (_this.config.parserHooks && _this.config.parserHooks[value.name] && _this.config.parserHooks[value.name].after) {
                return Q(_this.config.parserHooks[value.name].after(_this.result[value.name])).then(function(res) {
                  return _this.result[value.name] = res;
                });
              }
            });
          });
          return queue.then(function() {
            return _parseDeferred.resolve();
          }, function(error) {
            return _parseDeferred.reject(error);
          });
        });
        return _parseDeferred.promise;
      };
    })(this);
    _parse(config).then((function(_this) {
      return function() {
        return _this.afterParse(_this.result).then(function() {
          if (_this.config.onParsingEnd) {
            _this.config.onParsingEnd();
          }
          if (cb && typeof cb === 'function') {
            return cb(_this.result);
          } else {
            return d.resolve(_this.result);
          }
        });
      };
    })(this), (function(_this) {
      return function(error) {
        if (cb && typeof cb === 'function') {
          return cb(error);
        } else {
          return d.reject(error);
        }
      };
    })(this));
    return d.promise;
  };
  Parser.cache = {};
  Parser.clearCache = (function(_this) {
    return function() {
      return Parser.cache = {};
    };
  })(this);

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
    var o, ops;
    if (this.config.onFieldParsing) {
      this.config.onFieldParsing(value.name, value);
    }
    if (Parser.cache[value.name]) {
      return Parser.cache[value.name];
    } else if (this.result[value.name]) {
      return this.result[value.name];
    } else if (this.preBuildResults[value.name] || this.preBuildResults[value.name] === false) {
      return this.preBuildResults[value.name];
    } else {
      if (operation) {
        if (value.parentFields) {
          value.parentFields.push(operation.getField());
        } else {
          value.parentFields = [operation.getField()];
        }
      }
      ops = value.operations;
      if (this.afterParseRule && this.afterParseRule[value.name] && ops) {
        ops = ops.concat(this.afterParseRule[value.name] || []);
      }
      o = this.createOperationForValue(value, ops || value.value);
      return o.evaluate(value.value).then((function(_this) {
        return function(res) {
          if (value.persist) {
            Parser.cache[value.name] = res;
          }
          return _this.finalizeValue(o.getField(), res);
        };
      })(this));
    }
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
    required: function(config, result) {
      var promptText;
      if (this.defaultValues[config.name] && !result) {
        return this.defaultValues[config.name];
      } else if (config.required && !result) {
        promptText = config.prompt_text || "Please set value for " + (config.label ? config.label : config.name);
        result = this.config.prompt(promptText, config);
        return Q.when(result).then((function(_this) {
          return function(userInput) {
            if (userInput === null) {
              return _this.stopParsing();
            } else {
              return userInput;
            }
          };
        })(this));
      } else {
        return result;
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
    var found, func, handlerName, toReturn, toWait, _ref;
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
      return toReturn;
    } else {
      return toWait.then(function() {
        return result;
      });
    }
  };
  Parser.prototype.stopParsing = function() {
    var error;
    error = new StopParsingError("User canceled parsing");
    error.type = "StopParsingError";
    throw error;
  };
  StopParsingError = (function(_super) {
    __extends(StopParsingError, _super);

    function StopParsingError(message) {
      this.message = message;
      StopParsingError.__super__.constructor.call(this, this.message);
    }

    return StopParsingError;

  })(Error);
  return Parser;
});
