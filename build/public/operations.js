var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["q", "utils"], factory);
  } else {
    return root.operations = factory(root.Q, root.utils);
  }
})(this, function(Q, utils) {
  var operations;
  operations = {};
  operations.manual = function() {
    if (this.config && typeof this.config.value !== "undefined") {
      return this.config.value;
    } else {
      return null;
    }
  };
  operations.regex = function(value) {
    var applyRegex, result, toReturn;
    result = null;
    applyRegex = (function(_this) {
      return function(value) {
        var modifier, nextRes, reg, res, toReturn;
        toReturn = null;
        if (value) {
          modifier = "";
          if (typeof _this.config.modifier !== 'undefined') {
            modifier = _this.config.modifier;
          }
          reg = new RegExp(_this.config.regex, modifier);
          if (__indexOf.call(modifier, 'g') >= 0) {
            toReturn = [];
            while ((nextRes = reg.exec(value)) !== null) {
              if (nextRes) {
                if (_this.config.full) {
                  toReturn.push(nextRes);
                } else {
                  toReturn.push(nextRes[1]);
                }
              }
            }
          } else {
            res = reg.exec(value);
            if (_this.config.full) {
              if (res) {
                toReturn = res;
              } else {
                toReturn = null;
              }
            } else {
              if (res) {
                toReturn = res[1];
              } else {
                toReturn = null;
              }
            }
          }
          return toReturn;
        } else {
          return null;
        }
      };
    })(this);
    if (Array.isArray(value)) {
      return toReturn = value.map(applyRegex);
    } else {
      return applyRegex(value);
    }
  };
  operations.xpath = function(value) {
    var xpath;
    xpath = this.config.xpath;
    if (xpath) {
      return this.substitudeAttrAndValues(xpath).then((function(_this) {
        return function(xpath) {
          var d;
          if (_this.config.document_url) {
            d = Q.defer();
            _this.createOperation(_this.config.document_url).evaluate().then(function(result) {
              var xhr;
              xhr = new XMLHttpRequest();
              xhr.open('GET', result, true);
              xhr.onload = function(e) {
                var doc, parser, txt, xpathResult;
                if (xhr.status === 200) {
                  txt = xhr.responseText;
                  parser = new DOMParser();
                  doc = parser.parseFromString(txt, "text/html");
                  return xpathResult = utils.xpathEval(doc, xpath);
                } else {
                  return d.resolve(new Error());
                }
              };
              xhr.ontimeout = function(e) {
                return d.resolve(new Error());
              };
              xhr.onerror = function(e) {
                return d.resolve(new Error());
              };
              return xhr.send();
            });
            return d.promise;
          } else {
            if (_this.config.doc) {
              d = Q.defer();
              _this.createOperation(_this.config.doc).evaluate(value).then(function(doc) {
                var res;
                res = utils.xpathEval(doc, xpath);
                return d.resolve(res);
              });
              return d.promise;
            } else {
              if (value instanceof HTMLDocument || value instanceof XMLDocument) {
                return utils.xpathEval(value, xpath);
              } else {
                return utils.xpathEval(_this.getDoc(), xpath);
              }
            }
          }
        };
      })(this));
    } else {
      return null;
    }
  };
  operations.wait = function(value) {
    var d;
    d = Q.defer();
    window.setTimeout(function() {
      return d.resolve(value);
    }, this.config.delay);
    return d.promise;
  };
  operations.get_attribute = function(value) {
    var d, getAttr, res;
    d = Q.defer();
    getAttr = function(el, attr) {
      var res;
      res = el[attr];
      if (!res && (el instanceof HTMLElement || el.getAttribute)) {
        return res = el.getAttribute(attr || null);
      } else {
        return res || null;
      }
    };
    if (value) {
      res = [];
      this.createOperation(this.config.attribute).evaluate().then(function(attribute) {
        var e, el, _i, _len;
        try {
          if (!value[attribute] && value.length !== void 0) {
            for (_i = 0, _len = value.length; _i < _len; _i++) {
              el = value[_i];
              if (el) {
                res.push(getAttr(el, attribute));
              }
            }
          } else {
            res = getAttr(value, attribute);
          }
          return d.resolve(res);
        } catch (_error) {
          e = _error;
          console.log(e);
          return d.resolve(null);
        }
      });
    } else {
      d.resolve(value);
    }
    return d.promise;
  };
  operations.set_attribute = function(value) {
    var attr, toWait;
    attr = this.config.attribute;
    if (!(value instanceof Array)) {
      value = [value];
    }
    toWait = [];
    value.forEach((function(_this) {
      return function(el) {
        var calculateAttr, d, finalAttrs, k, v, _fn;
        d = Q.defer();
        finalAttrs = {};
        calculateAttr = [];
        _fn = function(k, v) {
          var def;
          def = _this.createOperation(v).evaluate(el).then(function(finalValue) {
            return finalAttrs[k] = finalValue;
          });
          return calculateAttr.push(def);
        };
        for (k in attr) {
          if (!__hasProp.call(attr, k)) continue;
          v = attr[k];
          _fn(k, v);
        }
        Q.allSettled(calculateAttr).then(function() {
          for (k in finalAttrs) {
            if (!__hasProp.call(finalAttrs, k)) continue;
            v = finalAttrs[k];
            el[k] = v;
          }
          return d.resolve();
        });
        return toWait.push(d.promise);
      };
    })(this));
    return Q.allSettled(toWait);
  };
  operations.switchOf = function(value) {
    var execPosOrNeg;
    execPosOrNeg = (function(_this) {
      return function(res) {
        if (!!res) {
          return _this.createOperation(_this.config.positive).evaluate(value);
        } else {
          return _this.createOperation(_this.config.negative).evaluate(value);
        }
      };
    })(this);
    if (this.config.value) {
      return this.createOperation(this.config.value).evaluate(value).then((function(_this) {
        return function(res) {
          return _this.createOperation(_this.config.flag).evaluate(res).then(function(res) {
            return execPosOrNeg(res);
          });
        };
      })(this));
    } else if (this.config.flag) {
      return this.createOperation(this.config.flag).evaluate(value).then((function(_this) {
        return function(res) {
          return execPosOrNeg(res);
        };
      })(this));
    } else {
      return execPosOrNeg(value);
    }
  };
  operations.html_template = function() {
    var html;
    html = this.config.template;
    return this.substitudeAttrAndValues(html);
  };
  operations.values_to_map = function(value) {};
  operations.current_document = function() {
    return this.getDoc();
  };
  operations.equal = function(value) {
    var res;
    res = null;
    if (this.config.is_regex) {
      res = new RegExp(this.config.value, "i").test(value);
    } else {
      res = value === this.config.value;
    }
    return res;
  };
  operations.parsed_val = function() {
    var valueName;
    valueName = this.config.valName || this.config.name;
    return Q(this.getValue(valueName)).then((function(_this) {
      return function(value) {
        if (typeof value === 'undefined') {
          console.log("Warning: " + valueName + " not found");
        }
        return value;
      };
    })(this));
  };
  operations.concatenation = function() {
    var d, glue, part, parts, toWait, _fn, _i, _len;
    parts = this.config.parts;
    glue = this.config.glue || "";
    toWait = [];
    d = Q.defer();
    _fn = (function(_this) {
      return function(part) {
        return toWait.push(_this.createOperation(part).evaluate().then(function(res) {
          return res;
        }));
      };
    })(this);
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      part = parts[_i];
      _fn(part);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function(res) {
        var result;
        result = res.map(function(v) {
          return v.value;
        });
        result = result.filter(function(val) {
          if (val) {
            return val;
          }
        });
        result = result.join(glue);
        return d.resolve(result);
      };
    })(this));
    return d.promise;
  };
  operations.collection = function() {
    var d, part, parts, toWait, _fn, _i, _len;
    parts = this.config.parts;
    toWait = [];
    d = Q.defer();
    _fn = (function(_this) {
      return function(part) {
        return toWait.push(_this.createOperation(part).evaluate().then(function(res) {
          return res;
        }));
      };
    })(this);
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      part = parts[_i];
      _fn(part);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function(res) {
        var result;
        result = res.map(function(v) {
          return v.value;
        });
        return d.resolve(result.filter(function(val) {
          if (val) {
            return val;
          }
        }));
      };
    })(this));
    return d.promise;
  };
  operations.parseJSON = function(value) {
    var res;
    res = {};
    return res = JSON.parse(value);
  };
  operations.parse_json = function(value) {
    var res;
    res = {};
    return res = JSON.parse(value);
  };
  operations.split = function(value) {
    if (this.config.separator) {
      return value.split(this.config.separator);
    } else {
      return value;
    }
  };
  operations.randomInt = function() {
    var from, getRandomInt, to;
    getRandomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    from = this.config.from || 0;
    to = this.config.to || 100;
    return getRandomInt(from, to);
  };
  operations.badOperation = function() {
    return wrongVar;
  };
  operations.js_eval = function() {
    var d, i, js, m, promises, res, _fn, _i, _len;
    js = this.config.js;
    d = Q.defer();
    m = js.match(/\{:(.+?):\}/ig);
    if (m) {
      promises = [];
      _fn = (function(_this) {
        return function(i) {
          var el, tmp, val;
          el = /\{:(.+?):\}/.exec(i)[1];
          val = Q(_this.getValue(el));
          tmp = val.then(function(replacer) {
            if (!replacer) {
              replacer = '';
            }
            return js = js.replace(i, replacer);
          });
          return promises.push(tmp);
        };
      })(this);
      for (_i = 0, _len = m.length; _i < _len; _i++) {
        i = m[_i];
        _fn(i);
      }
      Q.allSettled(promises).then((function(_this) {
        return function() {
          var res;
          res = eval(js);
          return d.resolve(res);
        };
      })(this));
    } else {
      res = eval(js);
      d.resolve(res);
    }
    return d.promise;
  };
  operations.remove_element = function(value) {
    if (!(value instanceof Array)) {
      value = [value];
    }
    return value.forEach(function(el) {
      if (el && (el instanceof HTMLElement)) {
        return el.parentNode.removeChild(el);
      }
    });
  };
  return operations;
});
