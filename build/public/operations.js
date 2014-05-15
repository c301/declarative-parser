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
    var reg, res;
    if (value) {
      reg = new RegExp(this.config.regex, "i");
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
  operations.xpath = function() {
    var d, el, fname, m, _i, _len;
    if (this.config.xpath) {
      if (this.config.document_url) {
        console.log("Xpath: document_url detected");
        d = Q.defer();
        this.createOperation(this.config.document_url).evaluate().then((function(_this) {
          return function(result) {
            var xhr;
            console.log("Xpath: document_url %s", result);
            xhr = new XMLHttpRequest();
            xhr.open('GET', result, true);
            xhr.onload = function(e) {
              var doc, el, fname, m, parser, txt, xpathResult, _i, _len;
              if (xhr.status === 200) {
                txt = xhr.responseText;
                parser = new DOMParser();
                doc = parser.parseFromString(txt, "text/html");
                m = _this.config.xpath.match(/\{:(.+?):\}/ig);
                if (m) {
                  for (_i = 0, _len = m.length; _i < _len; _i++) {
                    fname = m[_i];
                    el = /\{:(.+?):\}/.exec(fname)[1];
                    _this.config.xpath = _this.config.xpath.replace(fname, _this.getParser().getAttr(el));
                  }
                }
                xpathResult = utils.xpathEval(doc, _this.config.xpath);
                console.log('Xpath on remote doc return', xpathResult);
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
        m = this.config.xpath.match(/\{:(.+?):\}/ig);
        if (m) {
          for (_i = 0, _len = m.length; _i < _len; _i++) {
            fname = m[_i];
            el = /\{:(.+?):\}/.exec(fname)[1];
            this.config.xpath = this.config.xpath.replace(fname, this.getParser().getAttr(el));
          }
        }
        return utils.xpathEval(this.getDoc(), this.config.xpath);
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
    var el, getAttr, res, _i, _len;
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
      if (value.length !== void 0) {
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          el = value[_i];
          if (el) {
            res.push(getAttr(el, this.config.attribute));
          }
        }
      } else {
        res = getAttr(value, this.config.attribute);
      }
      return res;
    } else {
      return value;
    }
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
    return Q(this.getValue(this.config.valName || this.config.name));
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
        return d.resolve(result.filter(function(val) {
          if (val) {
            return val;
          }
        })).join(glue);
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
  return operations;
});
