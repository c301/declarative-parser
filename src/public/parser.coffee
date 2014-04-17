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
      #value getter
      @value = ( valName, cb )->
#        @config.onGetValue( valName )
        if cb && typeof cb == 'function'
          Q( @result[ valName ] || false ).then ( val )->
            cb( val )
        else
          @result[ valName ] || false

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
        @config.beforeParse = @config.beforeParse || ()-> null
        @config.afterParse = @config.afterParse || ()-> null
        @config.beforeParseValue = @config.beforeParseValue || ()-> null
        @config.afterParseValue = @config.afterParseValue || ()-> null
        @config.onGetValue = @config.onGetValue || ()-> null

        @addOperations @config.operations || {}
        @addDecorators @config.decorators || {}

    addOperations: (operations)->
      for own name, operation of operations
        Operation.prototype.operations[ name ] = operation

    addDecorators: (decorators)->
      for own name, decorator of decorators
        Operation.prototype.decorators[ name ] = decorator




  Parser::parse = ( config, cb )->
    toWait = []
    d = Q.defer()
    #clean this.result before next parse
    @result = {}
    for value in config
      do ( value ) =>
#        console.log "Calculating #{value.name}", value
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
        d.resolve @result

    d.promise

  ###
  @value {object} value linked with operation
  @evalConfig {mixed} config for newly created operation
  ###
  Parser::createOperationForValue = ( value, evalConfig )->
    new Operation( evalConfig )
    .setField( value )
    .setParser( @ )

  Parser::resolveValue = ( value )->
    o = @createOperationForValue value, value.operations
    o.evaluate( value.value )
    .then ( res )=>
        @finalizeValue( value, res )

  Parser::handlers = {
    required: ( config, result )->
      if config.required && !result
        console.log config
        if config.prompt_text
          result = prompt config.prompt_text
        else
          result = prompt "Please set value for " + ( if config.label then config.label else config.name )
      else
        result

    site_specific_fields: ( config, result )->
      if !@result['site_specific_fields']
        @result['site_specific_fields'] = {}

      for siteName, value of config['site_specific_fields']
        if !@result['site_specific_fields'][siteName]
          @result['site_specific_fields'][siteName] = {}
        @result['site_specific_fields'][siteName][config.name] = value

      #return initial result
      result
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
            toWait = Q( func.call( @, config, result ) ).then (r)->
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



