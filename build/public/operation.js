var __hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operations", "q", "utils"], factory);
  } else {
    return root.Operation = factory(root.operations, root.Q, root.utils);
  }
})(this, function(operations, Q, utils) {
  var Operation;
  Operation = (function() {
    function Operation(config) {
      var val;
      this.parser = null;
      this.field = null;
      this.config = config;

      /*
      We have to use this shortcut to create new operation inside existing one, in order to save execution context
       */
      this.createOperation = function(config) {
        return new Operation(config).setParser(this.getParser()).setField(this.getField());
      };
      this._evaluate = function(res) {
        return res || null;
      };
      this.evaluate = function(value, cb) {
        var d;
        d = Q.defer();
        cb = cb || function() {};
        if (typeof cb !== 'function') {
          cb = function() {};
        }
        if (typeof value === 'function' && arguments.length === 1) {
          cb = value;
          value = null;
        }
        if (this.config.final && value) {
          cb(value);
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
                  cb(res);
                  return d.resolve(res);
                }, function(error) {
                  var val;
                  val = _this.getField();
                  val = val ? val.name : "undefined";
                  console.log("Error during decoration " + val + ": " + _this.type, error.stack);
                  cb(result);
                  return d.resolve(result);
                });
              };
            })(this), (function(_this) {
              return function(error) {
                var val;
                val = _this.getField();
                val = val ? val.name : "undefined";
                console.log("Error in " + val + ": " + _this.type, error.stack);
                cb(value);
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
      this.getValue = (function(_this) {
        return function(valName, cb) {
          var dep, parent, parser, value, _i, _len;
          if (_this.getField() && _this.getField().parentFields) {
            parent = _this.getField().parentFields;
            for (_i = 0, _len = parent.length; _i < _len; _i++) {
              dep = parent[_i];
              if (dep.name === valName) {
                console.log("Warning: Cirsular dependencies while getting %s from %o", valName);
                return false;
              }
            }
          }
          parser = _this.getParser();
          if (parser) {
            value = parser.value(valName, _this, cb);
            return value;
          } else {
            return null;
          }
        };
      })(this);
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
          "js": "js_eval",
          "separator": "split"
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
        if (!type) {
          for (attr in config) {
            if (!__hasProp.call(config, attr)) continue;
            typeName = config[attr];
            if (typeof this.operations[attr] !== "undefined") {
              type = attr;
              break;
            }
          }
        }
        config.type = type;
        return type;
      };
      if (this.config === void 0) {
        this.config = {
          type: "manual",
          value: null
        };
      }
      if (this.config instanceof Array && this.config.length) {
        this.type = "operationQueue";
        this._evaluate = (function(_this) {
          return function(value) {
            return _this.evaluateQueue(value);
          };
        })(this);
      } else {
        if (typeof this.config === "string" || typeof this.config === "number" || this.config === true || this.config === false) {
          this.config = {
            type: "manual",
            value: this.config
          };
        }
        this.type = this.getType(this.config);
        if (!this.type || !this.operations[this.type]) {
          val = this.getField();
          val = val ? val.name : "undefined";
          if (this.type && !this.operations[this.type]) {
            console.log("Unknown operation type " + val + ":" + this.type, this.config);
          }
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
    post_processing: function(value) {
      return this.decorators.postProcessing.bind(this)(value);
    },
    postProcessing: function(value) {
      var operationConfig;
      operationConfig = this.config.postProcessing || this.config.post_processing || this.config.postprocessing;
      if (operationConfig) {
        return this.createOperation(operationConfig).evaluate(value);
      }
    },
    postprocessing: function(value) {
      return this.decorators.postProcessing.bind(this)(value);
    },
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
          value = value.replace(/^\s*$[\n\r]{1,}/gm, "\n");
          return value;
        }
      }
    },
    glue: function(value) {
      if (value instanceof Array) {
        return value.filter(function(val) {
          if (val) {
            return val;
          }
        }).join(this.config.glue);
      } else {
        return value;
      }
    },
    suffix: function(value) {
      var d;
      d = Q.defer();
      if (value) {
        this.createOperation(this.config.suffix).evaluate().then(function(res) {
          var newvalue;
          if (typeof value === 'string') {
            d.resolve(value + res);
          }
          if (value instanceof Array) {
            newvalue = value.map((function(_this) {
              return function(el) {
                if (el) {
                  return el + res;
                } else {
                  return el;
                }
              };
            })(this));
            return d.resolve(newvalue);
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
      if (value) {
        this.createOperation(this.config.preffix).evaluate().then(function(res) {
          var newvalue;
          if (typeof value === 'string') {
            d.resolve(res + value);
          }
          if (value instanceof Array) {
            newvalue = value.map((function(_this) {
              return function(el) {
                if (el) {
                  return res + el;
                } else {
                  return el;
                }
              };
            })(this));
            return d.resolve(newvalue);
          }
        });
      } else {
        d.resolve(value);
      }
      return d.promise;
    },
    prefix: function(value) {
      var d;
      d = Q.defer();
      if (value) {
        this.createOperation(this.config.prefix).evaluate().then(function(res) {
          var newvalue;
          if (typeof value === 'string') {
            d.resolve(res + value);
          }
          if (value instanceof Array) {
            newvalue = value.map((function(_this) {
              return function(el) {
                if (el) {
                  return res + el;
                } else {
                  return el;
                }
              };
            })(this));
            return d.resolve(newvalue);
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
