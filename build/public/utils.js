(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    return define(factory);
  } else {
    return root.utils = factory();
  }
})(this, function() {
  return {

    /*
    Evaluate xpath string
    @param aNode context node
    @param aExpr Xpath expression
     */
    xpathEval: function(aNode, aExpr) {
      var e, found, nsResolver, res, result, xpe;
      if (arguments.length === 1) {
        aExpr = aNode;
        aNode = document;
      }
      xpe = new XPathEvaluator();
      nsResolver = xpe.createNSResolver(aNode.ownerDocument === null ? aNode.documentElement : aNode.ownerDocument.documentElement);
      try {
        result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
      } catch (_error) {
        e = _error;
        console.log(e);
        return false;
      }
      found = [];
      if (result.resultType === 4) {
        while (res = result.iterateNext()) {
          found.push(res);
        }
        if (found.length) {
          return found;
        } else {
          return null;
        }
      } else {
        if (result.resultType === 2) {
          return result.stringValue;
        }
      }
    },
    isEmpty: function(obj) {
      var hasOwnProperty, key;
      hasOwnProperty = Object.prototype.hasOwnProperty;
      if (obj === null) {
        return true;
      }
      if (obj.length && obj.length > 0) {
        return false;
      }
      if (obj.length === 0) {
        return true;
      }
      for (key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          return false;
        }
      }
      return true;
    }
  };
});
