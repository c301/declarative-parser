( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["operation", "q"], factory
  else
    root.Parser = factory root.operation, root.Q
)( this, (operation, Q )->
  class Parser
    constructor: (config)->
      @handleConfig config
      @parsingConfig = {}
      @afterParseRule = if config then config.afterParse else false 
      #reset result
      @result = {}
      #value getter
      @value = ( valName, op, cb )->
        valResult = @result[ valName ]
        # console.log 'valResult for ', valName, valResult
        if valResult != undefined
          # value already parsed
          # console.log "parser.value return", valResult
          if cb && typeof cb == 'function'
              cb( valResult )
          else
            valResult
        else if @preBuildResults[valName] or @preBuildResults[valName] == false
          # return value from pre built results, eg results of prev parsing
          # console.log "parser.value return prebuilresult", @preBuildResults[valName]
          if cb && typeof cb == 'function'
            Q( @preBuildResults[valName] || Operation.EMPTY_VALUE ).then ( val )->
              cb( val )
          else
            @preBuildResults[valName] || Operation.EMPTY_VALUE
        else if @parsingConfig[valName]
          # calculate value with config
          # console.log "Parser.value found", @parsingConfig[valName]
          field = @parsingConfig[valName]
          toResolve = field
          res = Q.fcall ()=>
            @resolveValue toResolve, op
          
          res.then(
            (val)=>
              # if( toResolve.persist )
              @result[valName] = val
              if cb && typeof cb == 'function'
                cb val
            ,
            (error)=>
              if error.type = "StopParsingError"
                @stopParsing()
              else
                if cb && typeof cb == 'function'
                  cb false
          )
          res
        else
          if cb && typeof cb == 'function'
            cb Operation.EMPTY_VALUE
          else
            Operation.EMPTY_VALUE

#        val = Operation.EMPTY_VALUE
#        if !@result[ valName ]
#          search()
#        else
#          val = @result[ valName ]
#


      @setAttr = (attrName, value)->
        @[attrName] = value

      @getAttr = (attrName)->
        if @[attrName] == undefined || @[attrName] == null || @[attrName] == false
          Operation.EMPTY_VALUE
        else
          @[attrName]

    #set configuration and default values
    handleConfig: (config)->
      #nothing passed
      config = config || document

      @config = config
      @config.prompt = @config.prompt || prompt.bind window
      @defaultParsingConfig = false
      @defaultValues = config.defaultValues || {} 
      @preBuildResults = config.preBuildResults || {} 
      @debug = config.debug || false 

      #passed html doc
      if config instanceof HTMLDocument
        @doc = config
      #html string passed
      else if typeof config == "string"
        parser = new DOMParser()
        @doc = parser.parseFromString( config, "application/xml" )
      #config is object with settings
      else if typeof config == "object"
        @doc = config.document || document

        @addOperations @config.operations || {}
        @addDecorators @config.decorators || {}

    addOperations: (operations)->
      for own name, operation of operations
        Operation.prototype.operations[ name ] = operation

    addDecorators: (decorators)->
      for own name, decorator of decorators
        Operation.prototype.decorators[ name ] = decorator

    addFieldDecorators: (handlers)->
      for own name, handler of handlers
        Parser.prototype.handlers[ name ] = handler

  Parser::log = ()->
    if @debug
      console.log.apply(console, arguments)
    

  ###
  @param {array} config
  @param {array} config
  ...
  @param {function} cb callback
  ###
  Parser::parse = ()->
    if @config.onParsingStart
      @config.onParsingStart()
    # console.log "Parser.parse"
    toWait = []
    d = Q.defer()
    #clean this.result before next parse
    @result = {}
    @parsingConfig = {}
    @configs = []

    if arguments.length > 1
      if typeof arguments[ arguments.length - 1 ] == 'function'
        cb = arguments[ arguments.length - 1 ]
        @configs = Array.prototype.slice.call( arguments, 0, arguments.length - 1 )
      else
        @configs =  Array.prototype.slice.call( arguments, 0, arguments.length )

      config = Parser::mergeConfigs @configs

    else if !arguments.length
      d.resolve new Error "Wrong arguments"
    else
      config = arguments[0]
      @configs = [config]

    for value in config
      @parsingConfig[ value.name ] = value

    if @config.defaultConfig
      @defaultParsingConfig = {}
      for value in @config.defaultConfig
        @defaultParsingConfig[ value.name ] = value




    _parse = ( config )=>
      _parseDeferred = Q.defer()

      handleValue = ( value )=>
        if @debug
          value.debug = @debug

        handleDeferred = Q.defer()

        @log "= Parser: calculating #{value.name}. Config:", value
        Q.fcall( ()=>
          @resolveValue value
        ).then(
            ( res )=>
              if !res and @defaultParsingConfig[ value.name ]
                # console.log "Calculating in def config #{value.name}", @defaultParsingConfig[ value.name ]
                Q.fcall( ()=>
                  @resolveValue @defaultParsingConfig[ value.name ]
                ).then(
                  (res)=>
                    if !res and @defaultValues[ value.name ]
                      @result[ value.name ] = @defaultValues[ value.name ]
                    else
                      @result[ value.name ] = res
                    handleDeferred.resolve()
                  ,
                  (error)=>
                    # console.log "Error resolveValue in default config", error.stack
                    if error instanceof StopParsingError
                      console.log error.message
                      handleDeferred.reject(error)
                    else
                      console.log "Error resolveValue", error.stack
                      handleDeferred.resolve()
                )
              else
                @log "= Parser: calculated #{value.name}. Result:", res
                @result[ value.name ] = res
                handleDeferred.resolve()
            ,
            ( error )=>
              if error instanceof StopParsingError
                console.log error.message
                handleDeferred.reject(error)
              else
                console.log "Error resolveValue", error.stack
                handleDeferred.resolve()
        )

        handleDeferred.promise

      # console.log config
      queue = Q( true )
      queue.then ()=>
        config.forEach ( value )=>
          queue = queue.then ()=> handleValue(value)
          queue = queue.then ()=>
            if @config.parseHooks && @config.parseHooks[value.name] && @config.parseHooks[value.name].after
              Q( @config.parseHooks[value.name].after( @result[ value.name ] ) ).then (res)=>
                @result[ value.name ] = res

              

        queue.then(
          ()->
            _parseDeferred.resolve()
          ,
          (error)->
            _parseDeferred.reject(error)
        ) 

      _parseDeferred.promise

    _parse(config).then(
      ()=>
        @afterParse( @result ).then ()=>
          if @config.onParsingEnd
            @config.onParsingEnd()
          if cb && typeof cb == 'function'
            cb @result
          else
            d.resolve @result
      ,
      (error)=>
        if cb && typeof cb == 'function'
          cb error
        else
          d.reject error
    )

    d.promise

  #set initial empty cache
  Parser.cache = {}
  #set empty cache
  Parser.clearCache = ()=>
    Parser.cache={}

  ###
  @param {object|array} configs
  @returns {object}
  ###
  Parser::mergeConfigs = ( configs )->
    res = {}
    for config in configs
      for field in config
        if typeof res[ field.name ] == "undefined"
          res[ field.name ] = field

    Object.keys res
    .map (key)->
      res[key]

  ###
  @value {object} value linked with operation
  @evalConfig {mixed} config for newly created operation
  ###
  Parser::createOperationForValue = ( value, evalConfig )->
    new Operation( evalConfig )
    .setField( value )
    .setParser( @ )

  Parser::resolveValue = ( value, operation )->
    # console.log "====  prebuildresult exist for #{value.name}",  @preBuildResults[value.name]

    if @config.onFieldParsing
      @config.onFieldParsing value.name, value
    if Parser.cache[value.name]
      Parser.cache[value.name]
    else if @result[value.name]
      @result[ value.name ]

    else if @preBuildResults[value.name] or @preBuildResults[value.name] == false
      @preBuildResults[value.name]
    else 
      if operation
        # console.log "Set parent field for #{value.name}", operation.getField().name
        if value.parentFields 
          value.parentFields.push operation.getField()
        else
          value.parentFields = [operation.getField()]
      ops = value.operations
      if @afterParseRule and @afterParseRule[value.name] and ops
        ops = ops.concat @afterParseRule[value.name] or []

      o = @createOperationForValue value, ops || value.value
      o.evaluate( value.value )
      .then ( res )=>
          if(value.persist)
            Parser.cache[value.name] = res

          @finalizeValue( o.getField(), res )

  Parser::afterParse = ()->
    d = Q.defer()
    for fieldName, field of @parsingConfig
      # console.log("checking #{field.name}", field)
      if !@result[field.name] and field.required
        if @defaultValues[field.name]
          @result[field.name] = @defaultValues[field.name]

    d.resolve()
    d.promise


  Parser::handlers = {
    postprocessing: ( config, result )->
      if config.postprocessing
        new Operation config.postprocessing
        .evaluate result

    required: ( config, result )->
      if @defaultValues[config.name] and !result
        @defaultValues[config.name]
      else if config.required && !result
        promptText = config.prompt_text || "Please provide a " + ( if config.label then config.label else config.name )

        result = @config.prompt promptText, config

        Q.when result
        .then ( userInput )=>
          if userInput == null
            @stopParsing()
          else
            userInput
      else
        result

    default: ( config, result )->
      if !result
        if config.default
          result = config.default
        else
          result
      else
        result

    # site_specific_config: ( config, result )->
    #   d = Q.defer()
    #   if !@result['site_specific_results']
    #     @result['site_specific_results'] = {}
    #
    #   for siteName, value of config['site_specific_config']
    #     if !@result['site_specific_results'][siteName]
    #       @result['site_specific_results'][siteName] = {}
    #     op = @createOperationForValue( config, value )
    #     op.evaluate (val)=>
    #       @result['site_specific_results'][siteName][config.name] = val
    #       d.resolve result
    #
    #     #return initial result
    #   d.promise
  }

  Parser::finalizeValue = ( config, result )->
    toReturn = result

    #place decorator here in right order
    found = false
    toWait = null

    for handlerName, func of Parser::handlers
      if typeof config[handlerName] != "undefined"
        do (handlerName, func)=>
          if toWait == null
            toWait = Q( func.call( @, config, result ) ).then (r)=>
#                console.log "1 #{decoratorName} return #{r} and set value to #{r}"
              result = r
          else
            toWait = toWait.then (r)=>
              Q( func.call( @, config, result ) ).then (r)->
#                  console.log "2 #{decoratorName} return #{r} and set value to #{r}"
                result = r
        found = true
    if !found
      toReturn
    else
      toWait.then ()-> result

  Parser::stopParsing = ()->
    error = new StopParsingError "User canceled parsing"
    error.type = "StopParsingError"
    throw error

  class StopParsingError extends Error
    constructor: ( @message ) -> super @message

  Parser
)


#define ["operation", "q"], ( Operation, Q )->



