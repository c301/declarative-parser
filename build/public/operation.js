var hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["operations", "q", "utils", "objectpath"], factory);
  } else {
    return root.Operation = factory(root.operations, root.Q, root.utils, {
      ObjectPath: root.ObjectPath
    });
  }
})(this, function(operations, Q, utils, objectpath) {
  var Operation, getPathFromObject, parseObjectPath, substitudeAttrAndValues;
  parseObjectPath = function(pathStr) {
    var parsedPath, toReturn;
    toReturn = {
      base: pathStr,
      path: []
    };
    parsedPath = objectpath.ObjectPath.parse(pathStr);
    toReturn.base = parsedPath[0];
    toReturn.path = parsedPath.splice(1);
    return toReturn;
  };
  getPathFromObject = function(sourceObj, path) {
    var toReturn;
    toReturn = sourceObj;
    path.forEach(function(part) {
      return toReturn = toReturn[part] ? toReturn[part] : Operation.EMPTY_VALUE;
    });
    return toReturn;
  };
  substitudeAttrAndValues = function(operation, originalStr) {
    var attr, el, fn, fname, i, j, len, len1, m, newStr, parsedPath, parser, ref, ref1, toWait;
    newStr = originalStr;
    toWait = Q(true);
    parser = operation.getParser();
    m = newStr.match(/\{:(.+?):\}/ig);
    ref = m || [];
    //get attributes
    for (i = 0, len = ref.length; i < len; i++) {
      fname = ref[i];
      el = /\{:(.+?):\}/.exec(fname)[1];
      if (parser) {
        parsedPath = parseObjectPath(el);
        attr = parser.getAttr(parsedPath.base);
        if (attr !== Operation.EMPTY_VALUE) {
          newStr = newStr.replace(fname, getPathFromObject(attr, parsedPath.path));
        }
      }
    }
    m = newStr.match(/\{:(.+?):\}/ig);
    ref1 = m || [];
    //get values
    fn = (fname) => {
      return toWait = toWait.then(() => {
        el = /\{:(.+?):\}/.exec(fname)[1];
        parsedPath = parseObjectPath(el);
        // console.log "newStr template getting field #{fname}, #{el}"
        return Q(operation.getValue(parsedPath.base)).then((val) => {
          // console.log 'got el', el, fname, val
          return newStr = newStr.replace(fname, getPathFromObject(val, parsedPath.path) || '');
        });
      });
    };
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      fname = ref1[j];
      fn(fname);
    }
    return toWait.then(function() {
      return newStr;
    });
  };
  Operation = class Operation {
    constructor(config) {
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
      //default evaluate
      this._evaluate = function(res) {
        return res || Operation.EMPTY_VALUE;
      };
      this.evaluate = function(value, cb) {
        var d, nonEmptyValue;
        d = Q.defer();
        //set callback
        cb = cb || function() {};
        if (typeof cb !== 'function') {
          cb = function() {};
        }
        if (typeof value === 'function' && arguments.length === 1) {
          cb = value;
          value = Operation.EMPTY_VALUE;
        }
        nonEmptyValue = !!value;
        if (value && value.length !== void 0 && value.length === 0) {
          nonEmptyValue = false;
        }
        if (this.config.final && nonEmptyValue) {
          cb(value);
          d.resolve(value);
        } else {
          if (!this._evaluate) {
            Operation.EMPTY_VALUE;
          } else {
            Q(this._evaluate(value)).then((result) => {
              return Q.fcall(() => {
                return this.decorate(result);
              }).then((res) => {
                cb(res);
                return d.resolve(res);
              }, (error) => {
                var val;
                val = this.getField();
                val = val ? val.name : "undefined";
                console.log(`Error during decoration ${val}: ${this.type}`, error.stack);
                cb(result);
                return d.resolve(result);
              });
            }, (error) => {
              var val;
              if (error.type = "StopParsingError") {
                return d.reject(error);
              } else {
                val = this.getField();
                val = val ? val.name : "undefined";
                console.log(`Error in ${val}: ${this.type}`, error.stack);
                cb(value);
                return d.resolve(value);
              }
            });
          }
        }
        return d.promise;
      };
      this.setParser = function(parser1) {
        this.parser = parser1;
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
      this.getValue = (valName, cb) => {
        var dep, i, len, parent, parser, value;
        if (this.getField() && this.getField().parentFields) {
          parent = this.getField().parentFields;
          for (i = 0, len = parent.length; i < len; i++) {
            dep = parent[i];
            if (dep.name === valName) {
              console.log("Warning: Cirsular dependencies while getting %s from %o", valName);
              return false;
            }
          }
        }
        parser = this.getParser();
        // console.log("get field #{valName}", parser)
        if (parser) {
          value = parser.value(valName, this, cb);
          return value;
        } else {
          return Operation.EMPTY_VALUE;
        }
      };
      this.substitudeAttrAndValues = (str) => {
        return substitudeAttrAndValues(this, str);
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
          "js": "js_eval",
          "separator": "split"
        };
        if (config && config.type !== void 0) {
          type = config.type;
        } else {
          for (attr in type_mapping) {
            if (!hasProp.call(type_mapping, attr)) continue;
            typeName = type_mapping[attr];
            if (typeof config[attr] !== "undefined") {
              type = typeName;
              break;
            }
          }
        }
        if (!type) {
          for (attr in config) {
            if (!hasProp.call(config, attr)) continue;
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
      //if undefined( operations was ommited ), return Operation.EMPTY_VALUE
      if (this.config === void 0) {
        this.config = {
          type: "manual",
          value: Operation.EMPTY_VALUE
        };
      }
      //if array of operations
      if (this.config instanceof Array && this.config.length) {
        this.type = "operationQueue";
        this._evaluate = (value) => {
          return this.evaluateQueue(value);
        };
      } else {
        //in some case return initial value
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
            console.log(`Unknown operation type ${val}:${this.type}`, this.config);
          }
        } else {
          this._evaluate = this.operations[this.type];
        }
      }
    }

  };
  //this value should be returned, on soft fail
  Operation.EMPTY_VALUE = '';
  //apply suffix, prefix, etc..
  Operation.prototype.decorate = function(value) {
    var decoratorName, defer, found, func, ref, toReturn, toWait;
    defer = Q.defer();
    toReturn = value;
    //    if !value && !@config.default && value != false
    //      defer.resolve toReturn
    //    else

    //place decorator here in right order
    found = false;
    toWait = null;
    ref = Operation.prototype.decorators;
    // set normalize_space: true by default

    // if @config && @config.type != "manual" && @config.normalize_space != false
    //   @config.normalize_space = true
    for (decoratorName in ref) {
      func = ref[decoratorName];
      if (typeof this.config[decoratorName] !== "undefined") {
        ((decoratorName, func) => {
          if (toWait === null) {
            return toWait = Q(func.call(this, value)).then(function(r) {
              //                console.log "1 #{decoratorName} return #{r} and set value to #{r}"
              return value = r;
            });
          } else {
            return toWait = toWait.then((r) => {
              return Q(func.call(this, value)).then(function(r) {
                //                  console.log "2 #{decoratorName} return #{r} and set value to #{r}"
                return value = r;
              });
            });
          }
        })(decoratorName, func);
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
    var i, len, ops, ref, result, singleConf;
    ops = [];
    ref = this.config;
    for (i = 0, len = ref.length; i < len; i++) {
      singleConf = ref[i];
      ops.push(this.createOperation(singleConf));
    }
    result = Q(ops.shift().evaluate(value));
    ops.forEach(function(f) {
      return result = result.then(function(val) {
        // console.log "op type #{f.type} prev val", val, typeof val
        return f.evaluate(val);
      });
    });
    return result;
  };
  Operation.prototype.operations = operations;
  Operation.prototype.parseObjectPath = parseObjectPath;
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
      var i, len, results, val;
      if (this.config.normalize_space) {
        if (value instanceof Array) {
          results = [];
          for (i = 0, len = value.length; i < len; i++) {
            val = value[i];
            results.push(val = Operation.prototype.decorators.normalize_space.bind(this)(val));
          }
          return results;
        } else {
          if (value === void 0 || typeof value !== 'string') {
            return value;
          } else {
            value = value.trim();
            value = value.replace(/[ \t]{2,}/g, ' ');
            value = value.replace(/^\s*$[\n\r]{1,}/gm, "\n");
            return value;
          }
        }
      } else {
        return value;
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
            newvalue = value.map((el) => {
              if (el) {
                return el + res;
              } else {
                return el;
              }
            });
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
            newvalue = value.map((el) => {
              if (el) {
                return res + el;
              } else {
                return el;
              }
            });
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
            newvalue = value.map((el) => {
              if (el) {
                return res + el;
              } else {
                return el;
              }
            });
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
    default: function(value) {
      var d;
      d = Q.defer();
      if (!value) {
        this.createOperation(this.config.default).evaluate().then(function(res) {
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
      console.log(`DEBUG ${val}:${this.type}`, value);
      return value;
    }
  };
  return Operation;
});
