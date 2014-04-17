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
      var found, nsResolver, res, result, xpe;
      if (arguments.length === 1) {
        aExpr = aNode;
        aNode = document;
      }
      xpe = new XPathEvaluator();
      nsResolver = xpe.createNSResolver(aNode.ownerDocument === null ? aNode.documentElement : aNode.ownerDocument.documentElement);
      result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
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
    }
  };
});
