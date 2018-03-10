var indexOf = [].indexOf,
  hasProp = {}.hasOwnProperty;

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(["q", "utils"], factory);
  } else {
    return root.operations = factory(root.Q, root.utils);
  }
})(this, function(Q, utils) {
  var operations;
  operations = {};
  //config can be accessed via this.config
  operations.manual = function() {
    if (this.config && typeof this.config.value !== "undefined") {
      return this.config.value;
    } else {
      return Operation.EMPTY_VALUE;
    }
  };
  //we can pass existing value (from previos operation) as argument
  operations.regex = function(value) {
    var applyRegex, toReturn;
    applyRegex = (value) => {
      var modifier, nextRes, reg, res, toReturn;
      toReturn = Operation.EMPTY_VALUE;
      if (value) {
        modifier = "";
        if (typeof this.config.modifier !== 'undefined') {
          modifier = this.config.modifier;
        }
        reg = new RegExp(this.config.regex, modifier);
        if (indexOf.call(modifier, 'g') >= 0) {
          toReturn = [];
          while ((nextRes = reg.exec(value)) !== null) {
            if (nextRes) {
              if (this.config.full) {
                toReturn.push(nextRes);
              } else {
                toReturn.push(nextRes[1]);
              }
            }
          }
        } else {
          res = reg.exec(value);
          if (this.config.full) {
            if (res) {
              toReturn = res;
            } else {
              toReturn = Operation.EMPTY_VALUE;
            }
          } else {
            if (res) {
              toReturn = res[1];
            } else {
              toReturn = Operation.EMPTY_VALUE;
            }
          }
        }
        return toReturn;
      } else {
        return Operation.EMPTY_VALUE;
      }
    };
    if (Array.isArray(value)) {
      return toReturn = value.map(applyRegex);
    } else {
      return applyRegex(value);
    }
  };
  //we have to use this.getDoc() in order to use right document
  operations.xpath = function(value) {
    var xpath;
    xpath = this.config.xpath;
    if (xpath) {
      return this.substitudeAttrAndValues(xpath).then((xpath) => {
        var d;
        console.log('=== xpath', xpath);
        if (this.config.document_url) {
          // console.log("Xpath: document_url detected")
          d = Q.defer();
          this.createOperation(this.config.document_url).evaluate().then((result) => {
            var xhr;
            // console.log("Xpath: document_url %s", result)
            xhr = new XMLHttpRequest();
            xhr.open('GET', result, true);
            xhr.onload = (e) => {
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
          if (this.config.doc) {
            d = Q.defer();
            this.createOperation(this.config.doc).evaluate(value).then((doc) => {
              var res;
              res = utils.xpathEval(doc, xpath);
              return d.resolve(res);
            });
            return d.promise;
          } else {
            if (value instanceof HTMLDocument || value instanceof XMLDocument) {
              return utils.xpathEval(value, xpath);
            } else {
              return utils.xpathEval(this.getDoc(), xpath);
            }
          }
        }
      });
    } else {
      return Operation.EMPTY_VALUE;
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
        return res = el.getAttribute(attr || Operation.EMPTY_VALUE);
      } else {
        return res || Operation.EMPTY_VALUE;
      }
    };
    if (value) {
      res = [];
      this.createOperation(this.config.attribute).evaluate().then(function(attribute) {
        var e, el, j, len;
        try {
          if (!value[attribute] && value.length !== void 0) {
            for (j = 0, len = value.length; j < len; j++) {
              el = value[j];
              if (el) {
                res.push(getAttr(el, attribute));
              }
            }
          } else {
            res = getAttr(value, attribute);
          }
          return d.resolve(res);
        } catch (error) {
          e = error;
          console.log(e);
          return d.resolve(Operation.EMPTY_VALUE);
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
    value.forEach((el) => {
      var calculateAttr, d, finalAttrs, fn, k, v;
      d = Q.defer();
      finalAttrs = {};
      calculateAttr = [];
      fn = (k, v) => {
        var def;
        def = this.createOperation(v).evaluate(el).then((finalValue) => {
          return finalAttrs[k] = finalValue;
        });
        return calculateAttr.push(def);
      };
      for (k in attr) {
        if (!hasProp.call(attr, k)) continue;
        v = attr[k];
        fn(k, v);
      }
      Q.allSettled(calculateAttr).then(() => {
        for (k in finalAttrs) {
          if (!hasProp.call(finalAttrs, k)) continue;
          v = finalAttrs[k];
          el[k] = v;
        }
        return d.resolve();
      });
      return toWait.push(d.promise);
    });
    return Q.allSettled(toWait);
  };
  // represents "if" statements
  operations.switchOf = function(value) {
    var execPosOrNeg;
    execPosOrNeg = (res) => {
      if (!!res) {
        return this.createOperation(this.config.positive).evaluate(value);
      } else {
        return this.createOperation(this.config.negative).evaluate(value);
      }
    };
    if (this.config.value) {
      return this.createOperation(this.config.value).evaluate(value).then((res) => {
        return this.createOperation(this.config.flag).evaluate(res).then((res) => {
          //          console.log "Flag", res, @config.flag
          return execPosOrNeg(res);
        });
      });
    } else if (this.config.flag) {
      // calculating flag
      return this.createOperation(this.config.flag).evaluate(value).then((res) => {
        //        console.log "Flag", res, @config.flag
        return execPosOrNeg(res);
      });
    } else {
      // check value
      return execPosOrNeg(value);
    }
  };
  //evaluate html template
  operations.html_template = function() {
    var html;
    html = this.config.template;
    return this.substitudeAttrAndValues(html);
  };
  // operations.jsonpath = (value)->
  //   console.log("JSONPath",value, @config.jsonpath);
  //   d = Q.defer()
  //   jsonpath = @config.jsonpath
  //   toWait = []
  //   for fname in jsonpath.match( /\{:(.+?):\}/ig )
  //     do ( fname )=>
  //       el = /\{:(.+?):\}/.exec(fname)[1]
  //       def = Q( @getValue el).then (val)->
  //         console.log el, val
  //         jsonpath = jsonpath.replace fname, val || ''

  //       toWait.push def

  //   Q.allSettled toWait
  //     .then ()=>
  //       res = jsonPath.eval(value, jsonpath) console.log("JSONPath #{jsonpath} : #{res}")
  //       d.resolve res

  //   d.promise
  operations.values_to_map = function(value) {};
  //return HTMLDocument according to current context
  operations.current_document = function() {
    return this.getDoc();
  };
  //returns result of the comparison
  operations.equal = function(value) {
    var res;
    //    console.log "equal", value, @config.value, @config.is_regex
    res = Operation.EMPTY_VALUE;
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
    return Q(this.getValue(valueName)).then((value) => {
      if (typeof value === 'undefined') {
        console.log(`Warning: ${valueName} not found`);
      }
      return value;
    });
  };
  operations.concatenation = function() {
    var fn, glue, j, len, part, parts, results, toWait;
    parts = this.config.parts;
    glue = this.config.glue || "";
    results = [];
    toWait = Q(true);
    fn = (part) => {
      return toWait = toWait.then((res) => {
        return this.createOperation(part).evaluate().then(function(res) {
          return results.push(res);
        });
      });
    };
    for (j = 0, len = parts.length; j < len; j++) {
      part = parts[j];
      fn(part);
    }
    return toWait.then(() => {
      var result;
      result = results.filter(function(val) {
        if (val) {
          return val;
        }
      });
      return result = result.join(glue);
    });
  };
  operations.collection = function() {
    var d, fn, j, len, part, parts, toWait;
    parts = this.config.parts;
    toWait = [];
    d = Q.defer();
    fn = (part) => {
      return toWait.push(this.createOperation(part).evaluate().then(function(res) {
        return res;
      }));
    };
    for (j = 0, len = parts.length; j < len; j++) {
      part = parts[j];
      fn(part);
    }
    Q.allSettled(toWait).then((res) => {
      var result;
      result = res.map(function(v) {
        return v.value;
      });
      return d.resolve(result.filter(function(val) {
        if (val) {
          return val;
        }
      }));
    });
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
    var d, fn, i, j, js, len, m, promises, res;
    js = this.config.js;
    d = Q.defer();
    m = js.match(/\{:(.+?):\}/ig);
    if (m) {
      promises = [];
      fn = (i) => {
        var el, tmp, val;
        el = /\{:(.+?):\}/.exec(i)[1];
        val = Q(this.getValue(el));
        // console.log "1 js_eval getting", i, val
        tmp = val.then(function(replacer) {
          if (!replacer) {
            replacer = '';
          }
          return js = js.replace(i, replacer);
        });
        
        // console.log "js_eval", i, replacer, js
        return promises.push(tmp);
      };
      for (j = 0, len = m.length; j < len; j++) {
        i = m[j];
        fn(i);
      }
      Q.allSettled(promises).then(() => {
        var res;
        res = eval(js);
        return d.resolve(res);
      });
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
