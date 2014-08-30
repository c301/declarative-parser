var __hasProp = {}.hasOwnProperty;

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
    var modifier, reg, res;
    if (value) {
      modifier = "";
      if (typeof this.config.modifier !== 'undefined') {
        modifier = this.config.modifier;
      }
      reg = new RegExp(this.config.regex, modifier);
      res = reg.exec(value);
      if (res) {
        return res[1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  operations.xpath = function(value) {
    var d, el, fname, m, parser, xpath, _i, _len;
    xpath = this.config.xpath;
    if (xpath) {
      if (this.config.document_url) {
        d = Q.defer();
        this.createOperation(this.config.document_url).evaluate().then((function(_this) {
          return function(result) {
            var xhr;
            xhr = new XMLHttpRequest();
            xhr.open('GET', result, true);
            xhr.onload = function(e) {
              var doc, el, fname, m, parser, txt, xpathResult, _i, _len;
              if (xhr.status === 200) {
                txt = xhr.responseText;
                parser = new DOMParser();
                doc = parser.parseFromString(txt, "text/html");
                m = xpath.match(/\{:(.+?):\}/ig);
                if (m) {
                  parser = _this.getParser();
                  for (_i = 0, _len = m.length; _i < _len; _i++) {
                    fname = m[_i];
                    el = /\{:(.+?):\}/.exec(fname)[1];
                    if (parser) {
                      xpath = xpath.replace(fname, parser.getAttr(el));
                    }
                  }
                }
                xpathResult = utils.xpathEval(doc, xpath);
                return d.resolve(xpathResult);
              }
            };
            xhr.ontimeout = function(e) {
              return d.resolve(new Error());
            };
            xhr.onerror = function(e) {
              return d.resolve(new Error());
            };
            return xhr.send();
          };
        })(this));
        return d.promise;
      } else {
        m = xpath.match(/\{:(.+?):\}/ig);
        if (m) {
          parser = this.getParser();
          for (_i = 0, _len = m.length; _i < _len; _i++) {
            fname = m[_i];
            el = /\{:(.+?):\}/.exec(fname)[1];
            if (parser) {
              xpath = xpath.replace(fname, parser.getAttr(el));
            }
          }
        }
        if (this.config.doc) {
          d = Q.defer();
          this.createOperation(this.config.doc).evaluate(value).then((function(_this) {
            return function(doc) {
              var res;
              res = utils.xpathEval(doc, xpath);
              return d.resolve(res);
            };
          })(this));
          return d.promise;
        } else {
          if (value instanceof HTMLDocument || value instanceof XMLDocument) {
            return utils.xpathEval(value, xpath);
          } else {
            return utils.xpathEval(this.getDoc(), xpath);
          }
        }
      }
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
      if (!res && el instanceof HTMLElement) {
        return res = el.getAttribute(attr);
      } else {
        return res;
      }
    };
    if (value) {
      res = [];
      this.createOperation(this.config.attribute).evaluate().then(function(attribute) {
        var el, _i, _len;
        if (value.length !== void 0) {
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
      });
    } else {
      d.resolve(value);
    }
    return d.promise;
  };
  operations.set_attribute = function(value) {
    var attr, k, v;
    console.log("WARNING set_attribute not tested yet");
    attr = this.config.attribute;
    if (!(value instanceof Array)) {
      value = [value];
    }
    for (k in attr) {
      if (!__hasProp.call(attr, k)) continue;
      v = attr[k];
      value.forEach(function(el) {
        return el[k] = v;
      });
    }
    return value;
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
    var d, fname, html, toWait, _fn, _i, _len, _ref;
    d = Q.defer();
    html = this.config.template;
    toWait = [];
    _ref = html.match(/\{:(.+?):\}/ig);
    _fn = (function(_this) {
      return function(fname) {
        var def, el;
        el = /\{:(.+?):\}/.exec(fname)[1];
        def = Q(_this.getValue(el)).then(function(val) {
          return html = html.replace(fname, val || '');
        });
        return toWait.push(def);
      };
    })(this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fname = _ref[_i];
      _fn(fname);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function() {
        return d.resolve(html);
      };
    })(this));
    return d.promise;
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
    var d, valueName;
    d = Q.defer();
    valueName = this.config.valName || this.config.name;
    Q(this.getValue(valueName)).then((function(_this) {
      return function(value) {
        if (typeof value === 'undefined') {
          console.log("Warning: " + valueName + " not found");
        }
        return d.resolve(value);
      };
    })(this));
    return d.promise;
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
