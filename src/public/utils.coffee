( ( root, factory )->
  if typeof define == "function" && define.amd
    define factory
  else
    root.utils = factory()
)( @, ()->
  {
    ###
    Evaluate xpath string
    @param aNode context node
    @param aExpr Xpath expression
    ###
    xpathEval: (aNode, aExpr)->
      #passed only expresion
      if arguments.length == 1
        aExpr = aNode
        aNode = document
      xpe = new XPathEvaluator()
      nsResolver = xpe.createNSResolver( if aNode.ownerDocument == null then aNode.documentElement else aNode.ownerDocument.documentElement )

      result = xpe.evaluate aExpr, aNode, nsResolver, 0, null
      found = []
      if result.resultType == 4
        while res = result.iterateNext()
          found.push(res);
        if found.length
          found
        else
          null
      else
        if result.resultType == 2
          result.stringValue

    isEmpty: (obj)->
      hasOwnProperty = Object.prototype.hasOwnProperty

      if obj == null 
        return true
      if obj.length && obj.length > 0
        return false
      if obj.length == 0
        return true

      for key of obj
        if hasOwnProperty.call(obj, key) 
          return false

      return true

  }
)
