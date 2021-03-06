( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["q", "utils"], factory
  else
    root.operations = factory root.Q, root.utils
)( @, ( Q, utils )->
  operations = {}

  #config can be accessed via this.config
  operations.manual= ()->
    if @config and typeof @config.value != "undefined" then @config.value else Operation.EMPTY_VALUE

  #we can pass existing value (from previos operation) as argument
  operations.regex= ( value )->
    applyRegex = ( value )=>
      toReturn = Operation.EMPTY_VALUE
      if value
          modifier = ""
          if typeof @config.modifier != 'undefined'
              modifier = @config.modifier
          reg = new RegExp @config.regex, modifier
          if 'g' in modifier
              toReturn = []
              while ( nextRes = reg.exec( value ) ) != null
                  if nextRes 
                      if @config.full 
                          toReturn.push nextRes
                      else
                          toReturn.push nextRes[1]
          else
              res = reg.exec( value )
              if @config.full 
                  if res then toReturn = res else toReturn = Operation.EMPTY_VALUE
              else
                  if res then toReturn = res[1] else toReturn = Operation.EMPTY_VALUE
          toReturn
      else
        Operation.EMPTY_VALUE
    if Array.isArray value 
      toReturn = value.map applyRegex
    else
      applyRegex value


  #we have to use this.getDoc() in order to use right document
  operations.xpath= ( value )->
    xpath = @config.xpath
    if xpath
      @substitudeAttrAndValues xpath
        .then (xpath)=>
          console.log '=== xpath', xpath
          if @config.document_url
            # console.log("Xpath: document_url detected")
            d = Q.defer()
            @createOperation @config.document_url
              .evaluate()
              .then ( result )=>
                # console.log("Xpath: document_url %s", result)
                xhr = new XMLHttpRequest()
                xhr.open('GET', result, true)
                xhr.onload = (e)=>
                  if xhr.status == 200
                    txt = xhr.responseText
                    parser = new DOMParser()
                    doc = parser.parseFromString( txt, "text/html" )
                    xpathResult = utils.xpathEval doc, xpath
                  else
                    d.resolve new Error()
                
                xhr.ontimeout = (e)->
                  d.resolve new Error()
                
                xhr.onerror = (e)->
                  d.resolve new Error()
                
                xhr.send()

            d.promise
          else
            if @config.doc
              d = Q.defer()
              @createOperation @config.doc
                .evaluate( value )
                .then ( doc )=>
                  res = utils.xpathEval doc, xpath
                  d.resolve res
              d.promise
            else
              if value instanceof HTMLDocument or value instanceof XMLDocument
                utils.xpathEval value, xpath
              else
                utils.xpathEval @getDoc(), xpath
    else
      Operation.EMPTY_VALUE

  operations.wait= ( value )->
    d = Q.defer()

    window.setTimeout( ()->
      d.resolve value
    , @config.delay )

    d.promise

  operations.get_attribute = ( value )->
    d = Q.defer()

    getAttr = (el, attr)->
      res = el[attr]
      if !res && (el instanceof HTMLElement || el.getAttribute)
        res = el.getAttribute attr || Operation.EMPTY_VALUE
      else
        res || Operation.EMPTY_VALUE

    if value
      res = []
      @createOperation( @config.attribute )
        .evaluate()
        .then (attribute)->
            try
                if !value[attribute] && value.length != undefined
                    for el in value
                        if el then res.push getAttr(el, attribute)
                else res = getAttr value, attribute

                d.resolve res
            catch e
                console.log e
                d.resolve Operation.EMPTY_VALUE
    else d.resolve value

    d.promise

  operations.set_attribute = ( value )->
    attr = @config.attribute
    if !(value instanceof Array)
      value = [value]

    toWait = []

    value.forEach (el)=>
      d = Q.defer()

      finalAttrs = {}
      calculateAttr = []

      for own k, v of attr
        do ( k, v )=>
          def = @createOperation v
          .evaluate(el).then (finalValue)=>
            finalAttrs[k] = finalValue

          calculateAttr.push def

      Q.allSettled calculateAttr
      .then ()=>
        for own k, v of finalAttrs
          el[k] = v
        d.resolve()

      toWait.push d.promise

    Q.allSettled toWait




  # represents "if" statements
  operations.switchOf = ( value )->
    execPosOrNeg = ( res )=>
      if !!res
        @createOperation @config.positive
        .evaluate( value )
      else
        @createOperation @config.negative
        .evaluate( value )

    if @config.value
      @createOperation @config.value
      .evaluate( value )
      .then ( res )=>
          @createOperation @config.flag
          .evaluate( res )
          .then ( res )=>
#          console.log "Flag", res, @config.flag
              execPosOrNeg res
    else if @config.flag
      # calculating flag
      @createOperation @config.flag
      .evaluate( value )
      .then ( res )=>
#        console.log "Flag", res, @config.flag
          execPosOrNeg res
    else
      # check value
      execPosOrNeg value

  #evaluate html template
  operations.html_template = ()->
    html = @config.template
    @substitudeAttrAndValues html

  # operations.jsonpath = (value)->
  #   console.log("JSONPath",value, @config.jsonpath);
  #   d = Q.defer()
  #   jsonpath = @config.jsonpath
  #   toWait = []
  #   for fname in jsonpath.match( /\{:(.+?):\}/ig )
  #     do ( fname )=>
  #       el = /\{:(.+?):\}/.exec(fname)[1]
  #       def = Q( @getValue el).then (val)->
  #         console.log el, val
  #         jsonpath = jsonpath.replace fname, val || ''
  #
  #       toWait.push def
  #
  #   Q.allSettled toWait
  #     .then ()=>
  #       res = jsonPath.eval(value, jsonpath) console.log("JSONPath #{jsonpath} : #{res}")
  #       d.resolve res
  #
  #   d.promise
    
    
  operations.values_to_map = (value)->





  #return HTMLDocument according to current context
  operations.current_document = ()->
    @getDoc()

  #returns result of the comparison
  operations.equal = ( value )->
#    console.log "equal", value, @config.value, @config.is_regex
    res = Operation.EMPTY_VALUE
    if @config.is_regex
      res = new RegExp @config.value, "i"
      .test value
    else
      res = value == @config.value

    res

  operations.parsed_val = ()->
    valueName = @config.valName || @config.name
    Q( @getValue( valueName ) ).then (value)=>
      if typeof value == 'undefined'
        console.log("Warning: #{valueName} not found")
      value
      

  operations.concatenation = ()->
    parts = @config.parts
    glue = @config.glue || ""
    results = []

    toWait = Q(true)
    for part in parts
      do ( part ) =>
        toWait = toWait.then (res)=>
          @createOperation part
          .evaluate().then (res)->
            results.push res


    toWait.then ()=>
      result = results.filter (val)->
        if val
          val

      result = result.join glue

  operations.collection = ()->
    parts = @config.parts

    toWait = []

    d = Q.defer()
    for part in parts
      do ( part ) =>
        toWait.push(
          @createOperation part
          .evaluate().then (res)->
            res
        )
    Q.allSettled toWait
    .then ( res )=>
      result = res.map (v)->
        v.value

      d.resolve result.filter (val) ->
        if val
          val

    d.promise

  operations.parseJSON = ( value )->
    res = {}
    res = JSON.parse value

  operations.parse_json = ( value )->
    res = {}
    res = JSON.parse value

  operations.split = (value)->
    if @config.separator
      value.split @config.separator
    else
      value

  operations.randomInt = ()->
    getRandomInt = (min, max)->
      Math.floor( Math.random() * (max - min + 1) ) + min

    from = @config.from || 0
    to = @config.to || 100

    getRandomInt from, to

  operations.badOperation= ()->
    wrongVar

  operations.js_eval = ()->
    js = @config.js
    d = Q.defer()
    m = js.match /\{:(.+?):\}/ig

    if m
      promises = []
      for i in m
        do (i)=>
          el = /\{:(.+?):\}/.exec( i )[1]
          val = Q( @getValue el )
          # console.log "1 js_eval getting", i, val

          tmp = val.then ( replacer )->
            if !replacer
              replacer = ''
            js = js.replace i, replacer 
            # console.log "js_eval", i, replacer, js


          promises.push tmp

      Q.allSettled promises
        .then ()=>
          res = eval js
          d.resolve res
    else
      res = eval js
      d.resolve res

    d.promise
    
  operations.remove_element = (value)->
    if !(value instanceof Array)
      value = [value]
    value.forEach (el)->
      if el and ( el instanceof HTMLElement )
        el.parentNode.removeChild el

  operations
)
