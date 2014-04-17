( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["operations", "q"], factory
  else
    root.Operation = factory root.operations, root.Q
)( @, (operations, Q)->
  class Operation
    constructor: ( @config = { type: null } )->
      @parser = null
      @field = null

      ###
      We have to use this shortcut to create new operation inside existing one, in order to save execution context
      ###
      @createOperation = ( config )->
        new Operation( config )
        .setParser( @getParser() )
        .setField( @getField() )

      #default evaluate
      @_evaluate = ( res )->
        res || null

      @evaluate = ( value, cb )->
        d = Q.defer()

        #set callback
        cb = cb || ()->
        if typeof cb != 'function'
          cb = ()->

        if @config.final && value
          cb value
          d.resolve value
        else
          if !@_evaluate then null else
            Q.fcall( ()=>
              @_evaluate value
            )
            .then(
                ( result )=>
                  Q.fcall( ()=>
                    @decorate( result )
                  ).then(
                    ( res )=>
                      cb res
                      d.resolve( res )
                  ,
                  ( error )=>
                    val = @.getField()
                    val = if val then val.name else "undefined"
                    console.log "Error during decoration #{val}: #{@.type}", error.stack
                    cb result
                    d.resolve result
                  )
              ,
              ( error )=>
                val = @.getField()
                val = if val then val.name else "undefined"
                console.log "Error in #{val}: #{@.type}", error.stack
                cb value
                d.resolve value
              )

        d.promise

      @setParser = ( @parser )-> @
      @getParser = ()-> @parser

      @setField = ( @field )-> @
      @getField = ()-> @field

      @getDoc = ()->
        parser = @getParser()
        if parser
          parser.doc
        else
          document

      @getValue = ( valName, cb )->
        parser = @getParser()
        if parser
          parser.value( valName, cb )
        else
          null


      @getType = (config)->
        type = ''
        type_mapping =
          "storedName" : "stored"
          "xpath" : "xpath"
          "regex" : "regex"
          "valName" : "parsed_val"
          "value" : "manual"
          "attribute" : "get_attribute"
          "template" : "html_template"
          "opName" : "pre_built"
          "js" : "js_eval"

        if config.type != undefined
        then type = config.type
        else for own attr, typeName of type_mapping
          if typeof config[attr] != "undefined"
            type = typeName
            break
        type

      #if array of operations
      if @config instanceof Array && @config.length
        @type = "operationQueue"
        @_evaluate = ( value )=>
          @evaluateQueue( value )
      else
        if typeof @config == "string"
        then @config =
          type: "manual"
          value: @config

        @type = @getType @config
        if !@type or !@operations[ @type ]
          console.log "Unknown operation type:#{@type}", @config
        else
          @_evaluate = @operations[ @type ]

  #apply suffix, preffix, etc..
  Operation::decorate = ( value )->
    defer = Q.defer()
    toReturn = value
    #    if !value && !@config.default && value != false
    #      defer.resolve toReturn
    #    else

    #place decorator here in right order
    found = false
    toWait = null

    for decoratorName, func of Operation::decorators
      if typeof @config[decoratorName] != "undefined"
        do (decoratorName, func)=>
          if toWait == null
            toWait = Q( func.call( @, value ) ).then (r)->
#                console.log "1 #{decoratorName} return #{r} and set value to #{r}"
              value = r
          else
            toWait = toWait.then (r)=>
              Q( func.call( @, value ) ).then (r)->
#                  console.log "2 #{decoratorName} return #{r} and set value to #{r}"
                value = r
        found = true
    if !found
      defer.resolve toReturn
    else
      toWait.then ()->
        defer.resolve value
    defer.promise

  Operation::evaluateQueue = ( value )->
    ops = []
    for singleConf in @config
      ops.push( @createOperation singleConf )

    result = Q( ops.shift().evaluate( value ) )
    ops.forEach (f)->
      result = result.then ( val )->
#        console.log "op type #{f.type} prev val", val, typeof val
        f.evaluate( val )

    result

  Operation::operations = operations
  Operation::decorators = {
    normalize_space: ( value )->
      if value instanceof Array
        for val in value
          val = Operation::decorators.normalize_space val
      else
        if value == undefined && typeof value != 'string'
          value
        else
          value = value.trim()
          value = value.replace(/\s|\t{2,}/g,' ')
          value = value.replace( /^\s*$[\n\r]{1,}/gm, "\n" );

    glue: ( value )->
      if value instanceof Array
        r = []
        for val in value
          if val
            r.push val
        r.join @config.glue
      else
        value

    suffix: ( value )->
      d = Q.defer()
      if value && typeof value == 'string'
        @createOperation( @config.suffix )
        .evaluate()
        .then ( res )->
            if res
              d.resolve( value + res )
            else
              d.resolve( res )
      else
        d.resolve( value )
      d.promise

    preffix: ( value )->
      d = Q.defer()
      if value && typeof value == 'string'
        @createOperation( @config.preffix )
        .evaluate()
        .then ( res )->
            if res
              d.resolve( res + value )
            else
              d.resolve( res )
      else
        d.resolve( value )
      d.promise

    num_in_array: ( value )->
      if value instanceof Array
        value[@config.num_in_array]
      else
        value

    default: ( value )->
      d = Q.defer()
      if !value
        @createOperation @config.default
        .evaluate()
        .then ( res )->
            d.resolve( res )
      else
        d.resolve( value )
      d.promise

    debug: ( value )->
      val = @getField()
      val = if val then val.name else "undefined"
      console.log "DEBUG #{val}:#{@type}", value
      value
  }

  Operation

)