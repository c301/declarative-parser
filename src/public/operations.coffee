( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["q", "utils"], factory
  else
    root.operations = factory root.Q, root.utils
)( @, ( Q, utils )->
  operations = {}

  #config can be accessed via this.config
  operations.manual= ()->
    if @config and @config.value then @config.value else null

  #we can pass existing value (from previos operation) as argument
  operations.regex= ( value )->
    reg = new RegExp @config.regex, "i"
    res = reg.exec( value )
    if res then res[1] else null

  #we have to use this.getDoc() in order to use right document
  operations.xpath= ()->
    if @config.xpath
      if @config.document_url
        Q.defer().promise
      else
        m = @config.xpath.match( /\{:(.+?):\}/ig )
        if m
          for fname in m
            el = /\{:(.+?):\}/.exec(fname)[1]
            @config.xpath = @config.xpath.replace fname, @getParser().getAttr( el )

        utils.xpathEval @getDoc(), @config.xpath
    else
      null

  operations.wait= ()->
    d = Q.defer()

    sec = Math.floor( @config.delay / 1000 )

    window.setTimeout( ()->
      d.resolve "#{sec} seconds passed"
    , @config.delay )

    d.promise

  operations.get_attribute = ( value )->
    getAttr = (el, attr)->
      el[attr]
    if value
      res = []
      if value.length != undefined
        for el in value
          if el then res.push getAttr(el, @config.attribute)
      else res = getAttr value, @config.attribute
      res
    else value

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
    d = Q.defer()
    html = @config.template
    toWait = []
    for fname in html.match( /\{:(.+?):\}/ig )
      do ( fname )=>
        el = /\{:(.+?):\}/.exec(fname)[1]
        def = Q( @getValue el).then (val)->
          html = html.replace fname, val || ''

        toWait.push def

    Q.allSettled toWait
    .then ()=>
        d.resolve html

    d.promise

  operations.values_to_map = (value)->





  #return HTMLDocument according to current context
  operations.current_document = ()->
    @getDoc()

  #returns result of the comparison
  operations.equal = ( value )->
#    console.log "equal", value, @config.value, @config.is_regex
    res = null
    if @config.is_regex
      res = new RegExp @config.value, "i"
      .test value
    else
      res = value == @config.value

    res

  operations.parsed_val = ()->
    Q( @getValue( @config.valName) )

  operations.concatenation = ()->
    parts = @config.parts
    glue = @config.glue || ""

    toWait = []
    result = []
    d = Q.defer()
    for part in parts
      do ( part ) =>
        toWait.push(
          @createOperation part
          .evaluate().then (res)->
            if res
              result.push res
        )
    Q.allSettled toWait
    .then ()=>
        d.resolve result.join glue

    d.promise

  operations.parseJSON = ( value )->
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


  operations
)