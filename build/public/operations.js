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
    if (this.config && this.config.value) {
      return this.config.value;
    } else {
      return null;
    }
  };
  operations.regex = function(value) {
    var reg, res;
    reg = new RegExp(this.config.regex, "i");
    res = reg.exec(value);
    if (res) {
      return res[1];
    } else {
      return null;
    }
  };
  operations.xpath = function() {
    var el, fname, m, _i, _len;
    if (this.config.xpath) {
      if (this.config.document_url) {
        return Q.defer().promise;
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
  operations.wait = function() {
    var d, sec;
    d = Q.defer();
    sec = Math.floor(this.config.delay / 1000);
    window.setTimeout(function() {
      return d.resolve("" + sec + " seconds passed");
    }, this.config.delay);
    return d.promise;
  };
  operations.get_attribute = function(value) {
    var el, getAttr, res, _i, _len;
    getAttr = function(el, attr) {
      return el[attr];
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
    return Q(this.getValue(this.config.valName));
  };
  operations.concatenation = function() {
    var d, glue, part, parts, result, toWait, _fn, _i, _len;
    parts = this.config.parts;
    glue = this.config.glue || "";
    toWait = [];
    result = [];
    d = Q.defer();
    _fn = (function(_this) {
      return function(part) {
        return toWait.push(_this.createOperation(part).evaluate().then(function(res) {
          if (res) {
            return result.push(res);
          }
        }));
      };
    })(this);
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      part = parts[_i];
      _fn(part);
    }
    Q.allSettled(toWait).then((function(_this) {
      return function() {
        return d.resolve(result.join(glue));
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
