var __hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operations", "q"], factory);
  } else {
    return root.Operation = factory(root.operations, root.Q);
  }
})(this, function(operations, Q) {
  var Operation;
  Operation = (function() {
    function Operation(config) {
      this.config = config != null ? config : {
        type: null
      };
      this.parser = null;
      this.field = null;

      /*
      We have to use this shortcut to create new operation inside existing one, in order to save execution context
       */
      this.createOperation = function(config) {
        return new Operation(config).setParser(this.getParser()).setField(this.getField());
      };
      this._evaluate = function(res) {
        return res || null;
      };
      this.evaluate = function(value) {
        var d;
        d = Q.defer();
        if (this.config.final && value) {
          d.resolve(value);
        } else {
          if (!this._evaluate) {
            null;
          } else {
            Q.fcall((function(_this) {
              return function() {
                return _this._evaluate(value);
              };
            })(this)).then((function(_this) {
              return function(result) {
                return Q.fcall(function() {
                  return _this.decorate(result);
                }).then(function(res) {
                  return d.resolve(res);
                }, function(error) {
                  var val;
                  val = _this.getField();
                  val = val ? val.name : "undefined";
                  console.log("Error during decoration " + val + ": " + _this.type, error.stack);
                  return d.resolve(result);
                });
              };
            })(this), (function(_this) {
              return function(error) {
                var val;
                val = _this.getField();
                val = val ? val.name : "undefined";
                console.log("Error in " + val + ": " + _this.type, error.stack);
                return d.resolve(value);
              };
            })(this));
          }
        }
        return d.promise;
      };
      this.setParser = function(parser) {
        this.parser = parser;
        return this;
      };
      this.getParser = function() {
        return this.parser;
      };
      this.setField = function(field) {
        this.field = field;
        return this;
      };
      this.getField = function() {
        return this.field;
      };
      this.getDoc = function() {
        var parser;
        parser = this.getParser();
        if (parser) {
          return parser.doc;
        } else {
          return document;
        }
      };
      this.getValue = function(valName) {
        var parser;
        parser = this.getParser();
        if (parser) {
          return parser.value(valName);
        } else {
          return null;
        }
      };
      this.getType = function(config) {
        var attr, type, typeName, type_mapping;
        type = '';
        type_mapping = {
          "storedName": "stored",
          "xpath": "xpath",
          "regex": "regex",
          "valName": "parsed_val",
          "value": "manual",
          "attribute": "get_attribute",
          "template": "html_template",
          "opName": "pre_built",
          "js": "js_eval"
        };
        if (config.type !== void 0) {
          type = config.type;
        } else {
          for (attr in type_mapping) {
            if (!__hasProp.call(type_mapping, attr)) continue;
            typeName = type_mapping[attr];
            if (typeof config[attr] !== "undefined") {
              type = typeName;
              break;
            }
          }
        }
        return type;
      };
      if (this.config instanceof Array && this.config.length) {
        this.type = "operationQueue";
        this._evaluate = (function(_this) {
          return function(value) {
            return _this.evaluateQueue(value);
          };
        })(this);
      } else {
        if (typeof this.config === "string") {
          this.config = {
            type: "manual",
            value: this.config
          };
        }
        this.type = this.getType(this.config);
        if (!this.type || !this.operations[this.type]) {
          console.log("Unknown operation type:" + this.type, this.config);
        } else {
          this._evaluate = this.operations[this.type];
        }
      }
    }

    return Operation;

  })();
  Operation.prototype.decorate = function(value) {
    var decoratorName, defer, found, func, toReturn, toWait, _ref;
    defer = Q.defer();
    toReturn = value;
    found = false;
    toWait = null;
    _ref = Operation.prototype.decorators;
    for (decoratorName in _ref) {
      func = _ref[decoratorName];
      if (typeof this.config[decoratorName] !== "undefined") {
        (function(_this) {
          return (function(decoratorName, func) {
            if (toWait === null) {
              return toWait = Q(func.call(_this, value)).then(function(r) {
                return value = r;
              });
            } else {
              return toWait = toWait.then(function(r) {
                return Q(func.call(_this, value)).then(function(r) {
                  return value = r;
                });
              });
            }
          });
        })(this)(decoratorName, func);
        found = true;
      }
    }
    if (!found) {
      defer.resolve(toReturn);
    } else {
      toWait.then(function() {
        return defer.resolve(value);
      });
    }
    return defer.promise;
  };
  Operation.prototype.evaluateQueue = function(value) {
    var ops, result, singleConf, _i, _len, _ref;
    ops = [];
    _ref = this.config;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      singleConf = _ref[_i];
      ops.push(this.createOperation(singleConf));
    }
    result = Q(ops.shift().evaluate(value));
    ops.forEach(function(f) {
      return result = result.then(function(val) {
        return f.evaluate(val);
      });
    });
    return result;
  };
  Operation.prototype.operations = operations;
  Operation.prototype.decorators = {
    normalize_space: function(value) {
      var val, _i, _len, _results;
      if (value instanceof Array) {
        _results = [];
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          val = value[_i];
          _results.push(val = Operation.prototype.decorators.normalize_space(val));
        }
        return _results;
      } else {
        if (value === void 0 && typeof value !== 'string') {
          return value;
        } else {
          value = value.trim();
          value = value.replace(/\s|\t{2,}/g, ' ');
          return value = value.replace(/^\s*$[\n\r]{1,}/gm, "\n");
        }
      }
    },
    glue: function(value) {
      var r, val, _i, _len;
      if (value instanceof Array) {
        r = [];
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          val = value[_i];
          if (val) {
            r.push(val);
          }
        }
        return r.join(this.config.glue);
      } else {
        return value;
      }
    },
    suffix: function(value) {
      var d;
      d = Q.defer();
      if (value && typeof value === 'string') {
        this.createOperation(this.config.suffix).evaluate().then(function(res) {
          if (res) {
            return d.resolve(value + res);
          } else {
            return d.resolve(res);
          }
        });
      } else {
        d.resolve(value);
      }
      return d.promise;
    },
    preffix: function(value) {
      var d;
      d = Q.defer();
      if (value && typeof value === 'string') {
        this.createOperation(this.config.preffix).evaluate().then(function(res) {
          if (res) {
            return d.resolve(res + value);
          } else {
            return d.resolve(res);
          }
        });
      } else {
        d.resolve(value);
      }
      return d.promise;
    },
    num_in_array: function(value) {
      if (value instanceof Array) {
        return value[this.config.num_in_array];
      } else {
        return value;
      }
    },
    "default": function(value) {
      var d;
      d = Q.defer();
      if (!value) {
        this.createOperation(this.config["default"]).evaluate().then(function(res) {
          return d.resolve(res);
        });
      } else {
        d.resolve(value);
      }
      return d.promise;
    },
    debug: function(value) {
      var val;
      val = this.getField();
      val = val ? val.name : "undefined";
      console.log("DEBUG " + val + ":" + this.type, value);
      return value;
    }
  };
  return Operation;
});