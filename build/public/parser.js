var hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operation", "q"], factory);
  } else {
    return root.Parser = factory(root.operation, root.Q);
  }
})(this, function(operation, Q) {
  var Parser, StopParsingError;
  Parser = class Parser {
    constructor(config) {
      this.handleConfig(config);
      this.parsingConfig = {};
      this.afterParseRule = config ? config.afterParse : false;
      
      //reset result
      this.result = {};
      //value getter
      this.value = function(valName, op, cb) {
        var field, res, toResolve, valResult;
        valResult = this.result[valName];
        // console.log 'valResult for ', valName, valResult
        if (valResult !== void 0) {
          // value already parsed
          // console.log "parser.value return", valResult
          if (cb && typeof cb === 'function') {
            return cb(valResult);
          } else {
            return valResult;
          }
        } else if (this.preBuildResults[valName] || this.preBuildResults[valName] === false) {
          // return value from pre built results, eg results of prev parsing
          // console.log "parser.value return prebuilresult", @preBuildResults[valName]
          if (cb && typeof cb === 'function') {
            return Q(this.preBuildResults[valName] || Operation.EMPTY_VALUE).then(function(val) {
              return cb(val);
            });
          } else {
            return this.preBuildResults[valName] || Operation.EMPTY_VALUE;
          }
        } else if (this.parsingConfig[valName]) {
          // calculate value with config
          // console.log "Parser.value found", @parsingConfig[valName]
          field = this.parsingConfig[valName];
          toResolve = field;
          res = Q.fcall(() => {
            return this.resolveValue(toResolve, op);
          });
          res.then((val) => {
            // if( toResolve.persist )
            this.result[valName] = val;
            if (cb && typeof cb === 'function') {
              return cb(val);
            }
          }, (error) => {
            if (error.type = "StopParsingError") {
              return this.stopParsing();
            } else {
              if (cb && typeof cb === 'function') {
                return cb(false);
              }
            }
          });
          return res;
        } else {
          if (cb && typeof cb === 'function') {
            return cb(Operation.EMPTY_VALUE);
          } else {
            return Operation.EMPTY_VALUE;
          }
        }
      };
      //        val = Operation.EMPTY_VALUE
      //        if !@result[ valName ]
      //          search()
      //        else
      //          val = @result[ valName ]

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

    //set configuration and default values
    handleConfig(config) {
      var parser;
      //nothing passed
      config = config || document;
      if (typeof config === "string") {
        this.config = {};
      } else {
        this.config = config;
      }
      this.config.prompt = this.config.prompt || prompt.bind(window);
      this.defaultParsingConfig = false;
      this.defaultValues = config.defaultValues || {};
      this.preBuildResults = config.preBuildResults || {};
      this.debug = config.debug || false;
      
      //passed html doc
      if (config instanceof HTMLDocument) {
        return this.doc = config;
      //html string passed
      } else if (typeof config === "string") {
        parser = new DOMParser();
        return this.doc = parser.parseFromString(config, "application/xml");
      //config is object with settings
      } else if (typeof config === "object") {
        this.doc = config.document || document;
        this.addOperations(this.config.operations || {});
        return this.addDecorators(this.config.decorators || {});
      }
    }

    addOperations(operations) {
      var name, results;
      results = [];
      for (name in operations) {
        if (!hasProp.call(operations, name)) continue;
        operation = operations[name];
        results.push(Operation.prototype.operations[name] = operation);
      }
      return results;
    }

    addDecorators(decorators) {
      var decorator, name, results;
      results = [];
      for (name in decorators) {
        if (!hasProp.call(decorators, name)) continue;
        decorator = decorators[name];
        results.push(Operation.prototype.decorators[name] = decorator);
      }
      return results;
    }

    addFieldDecorators(handlers) {
      var handler, name, results;
      results = [];
      for (name in handlers) {
        if (!hasProp.call(handlers, name)) continue;
        handler = handlers[name];
        results.push(Parser.prototype.handlers[name] = handler);
      }
      return results;
    }

  };
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
    var _parse, cb, config, d, i, j, len, len1, ref, toWait, value;
    if (this.config.onParsingStart) {
      this.config.onParsingStart();
    }
    // console.log "Parser.parse"
    toWait = [];
    d = Q.defer();
    //clean this.result before next parse
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
    for (i = 0, len = config.length; i < len; i++) {
      value = config[i];
      this.parsingConfig[value.name] = value;
    }
    if (this.config.defaultConfig) {
      this.defaultParsingConfig = {};
      ref = this.config.defaultConfig;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        value = ref[j];
        this.defaultParsingConfig[value.name] = value;
      }
    }
    _parse = (config) => {
      var _parseDeferred, handleValue, queue;
      _parseDeferred = Q.defer();
      handleValue = (value) => {
        var handleDeferred;
        if (this.debug) {
          value.debug = this.debug;
        }
        handleDeferred = Q.defer();
        this.log(`= Parser: calculating ${value.name}. Config:`, value);
        Q.fcall(() => {
          return this.resolveValue(value);
        }).then((res) => {
          if (!res && this.defaultParsingConfig[value.name]) {
            // console.log "Calculating in def config #{value.name}", @defaultParsingConfig[ value.name ]
            return Q.fcall(() => {
              return this.resolveValue(this.defaultParsingConfig[value.name]);
            }).then((res) => {
              if (!res && this.defaultValues[value.name]) {
                this.result[value.name] = this.defaultValues[value.name];
              } else {
                this.result[value.name] = res;
              }
              return handleDeferred.resolve();
            }, (error) => {
              // console.log "Error resolveValue in default config", error.stack
              if (error instanceof StopParsingError) {
                console.log(error.message);
                return handleDeferred.reject(error);
              } else {
                console.log("Error resolveValue", error.stack);
                return handleDeferred.resolve();
              }
            });
          } else {
            this.log(`= Parser: calculated ${value.name}. Result:`, res);
            this.result[value.name] = res;
            return handleDeferred.resolve();
          }
        }, (error) => {
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
      // console.log config
      queue = Q(true);
      queue.then(() => {
        config.forEach((value) => {
          queue = queue.then(() => {
            return handleValue(value);
          });
          return queue = queue.then(() => {
            if (this.config.parseHooks && this.config.parseHooks[value.name] && this.config.parseHooks[value.name].after) {
              return Q(this.config.parseHooks[value.name].after(this.result[value.name])).then((res) => {
                return this.result[value.name] = res;
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
    _parse(config).then(() => {
      return this.afterParse(this.result).then(() => {
        if (this.config.onParsingEnd) {
          this.config.onParsingEnd();
        }
        if (cb && typeof cb === 'function') {
          return cb(this.result);
        } else {
          return d.resolve(this.result);
        }
      });
    }, (error) => {
      if (cb && typeof cb === 'function') {
        return cb(error);
      } else {
        return d.reject(error);
      }
    });
    return d.promise;
  };
  //set initial empty cache
  Parser.cache = {};
  //set empty cache
  Parser.clearCache = () => {
    return Parser.cache = {};
  };
  /*
  @param {object|array} configs
  @returns {object}
  */
  Parser.prototype.mergeConfigs = function(configs) {
    var config, field, i, j, len, len1, res;
    res = {};
    for (i = 0, len = configs.length; i < len; i++) {
      config = configs[i];
      for (j = 0, len1 = config.length; j < len1; j++) {
        field = config[j];
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
    // console.log "====  prebuildresult exist for #{value.name}",  @preBuildResults[value.name]
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
        // console.log "Set parent field for #{value.name}", operation.getField().name
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
      return o.evaluate(value.value).then((res) => {
        if (value.persist) {
          Parser.cache[value.name] = res;
        }
        return this.finalizeValue(o.getField(), res);
      });
    }
  };
  Parser.prototype.afterParse = function() {
    var d, field, fieldName, ref;
    d = Q.defer();
    ref = this.parsingConfig;
    for (fieldName in ref) {
      field = ref[fieldName];
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
        promptText = config.prompt_text || "Please provide a " + (config.label ? config.label : config.name);
        result = this.config.prompt(promptText, config);
        return Q.when(result).then((userInput) => {
          if (userInput === null) {
            return this.stopParsing();
          } else {
            return userInput;
          }
        });
      } else {
        return result;
      }
    },
    default: function(config, result) {
      if (!result) {
        if (config.default) {
          return result = config.default;
        } else {
          return result;
        }
      } else {
        return result;
      }
    }
  };
  // site_specific_config: ( config, result )->
  //   d = Q.defer()
  //   if !@result['site_specific_results']
  //     @result['site_specific_results'] = {}

  //   for siteName, value of config['site_specific_config']
  //     if !@result['site_specific_results'][siteName]
  //       @result['site_specific_results'][siteName] = {}
  //     op = @createOperationForValue( config, value )
  //     op.evaluate (val)=>
  //       @result['site_specific_results'][siteName][config.name] = val
  //       d.resolve result

  //     #return initial result
  //   d.promise
  Parser.prototype.finalizeValue = function(config, result) {
    var found, func, handlerName, ref, toReturn, toWait;
    toReturn = result;
    //place decorator here in right order
    found = false;
    toWait = null;
    ref = Parser.prototype.handlers;
    for (handlerName in ref) {
      func = ref[handlerName];
      if (typeof config[handlerName] !== "undefined") {
        ((handlerName, func) => {
          if (toWait === null) {
            return toWait = Q(func.call(this, config, result)).then((r) => {
              //                console.log "1 #{decoratorName} return #{r} and set value to #{r}"
              return result = r;
            });
          } else {
            return toWait = toWait.then((r) => {
              return Q(func.call(this, config, result)).then(function(r) {
                //                  console.log "2 #{decoratorName} return #{r} and set value to #{r}"
                return result = r;
              });
            });
          }
        })(handlerName, func);
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
  StopParsingError = class StopParsingError extends Error {
    constructor(message) {
      super();
      this.message = message;
    }

  };
  return Parser;
});

//define ["operation", "q"], ( Operation, Q )->
