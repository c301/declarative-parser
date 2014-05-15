( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["operation", "q"], factory
  else
    root.Parser = factory root.operation, root.Q
)( this, (operation, Q )->
  class Parser
    constructor: (config)->
      @handleConfig config
      #reset result
      @result = {}
      #reset result
      @preBuildResults = {}
      #value getter
      @value = ( valName, op, cb )->
        # valResult = @result[ valName ]
        # if typeof valResult != 'undefined' && !valResult.inspect
        #   console.log "parser.value return", valResult
        #   if cb && typeof cb == 'function'
        #     Q( @result[ valName ] || null ).then ( val )->
        #       cb( val )
        #   else
        #     @result[ valName ] || null
        # else 
        # console.log "parser.value", valName
        if @preBuildResults[valName]
          # console.log "parser.value return prebuilresult", @preBuildResults[valName]
          if cb && typeof cb == 'function'
            Q( @preBuildResults[valName] || null ).then ( val )->
              cb( val )
          else
            @preBuildResults[valName] || null
        else if @parsingConfig[valName]
          # console.log "Parser.value found", @parsingConfig[valName]
          field = @parsingConfig[valName]
          toResolve = {
            name: field.name,
            operations: field.operations || field.value
          }
          res = @resolveValue toResolve, op
          if cb && typeof cb == 'function'
            res.then (val)->
              cb val
          res
        else
          if cb && typeof cb == 'function'
            cb null

#        val = null
#        if !@result[ valName ]
#          search()
#        else
#          val = @result[ valName ]
#


      @setAttr = (attrName, value)->
        @[attrName] = value

      @getAttr = (attrName)->
        @[attrName] || null

    #set configuration and default values
    handleConfig: (config)->
      #nothing passed
      config = config || document
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
        @config = config

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



  ###
  @param {array} config
  @param {array} config
  ...
  @param {function} cb callback
  ###
  Parser::parse = ()->
    # console.log "Parser.parse"
    toWait = []
    d = Q.defer()
    #clean this.result before next parse
    @result = {}
    @parsingConfig = {}

    if arguments.length > 1
      if typeof arguments[ arguments.length - 1 ] == 'function'
        cb = arguments[ arguments.length - 1 ]
        config = Parser::mergeConfigs( Array.prototype.slice.call( arguments, 0, arguments.length - 1 ) )
      else
        config = Parser::mergeConfigs( Array.prototype.slice.call( arguments, 0, arguments.length ) )

    else if !arguments.length
      d.resolve new Error "Wrong arguments"
    else
      config = arguments[0]

    for value in config
      @parsingConfig[ value.name ] = value

    for value in config
      do ( value ) =>
        # console.log "Calculating #{value.name}", value
        @result[ value.name ] = Q.fcall( ()=>
          @resolveValue value
        )
          .then(
            ( res )=>
              @result[ value.name ] = res
            ,
          ( error )=>
            console.log "Error resolveValue", error.stack
          )

        toWait.push @result[ value.name ]


    Q.allSettled toWait
    .then ()=>
        if cb && typeof cb == 'function'
          cb @result
        else
          d.resolve @result


    d.promise

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
    if operation
      # console.log "Set parent field for #{value.name}", operation.getField().name
      if value.parentFields 
        value.parentFields.push operation.getField()
      else
        value.parentFields = [operation.getField()]
    o = @createOperationForValue value, value.operations || value.value
    o.evaluate( value.value )
    .then ( res )=>
        @finalizeValue( o.getField(), res )

  Parser::handlers = {
    postprocessing: ( config, result )->
      if config.postprocessing
        new Operation config.postprocessing
        .evaluate result

    required: ( config, result )->
      if config.required && !result
        if config.prompt_text
          result = prompt config.prompt_text
        else
          result = prompt "Please set value for " + ( if config.label then config.label else config.name )
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
    defer = Q.defer()
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
      defer.resolve toReturn
    else
      toWait.then ()->
        defer.resolve result
    defer.promise




  Parser
)


#define ["operation", "q"], ( Operation, Q )->



