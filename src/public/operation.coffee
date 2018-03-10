( ( root, factory )->
  if typeof define == "function" && define.amd
    define ["operations", "q", "utils", "objectpath"], factory
  else
    root.Operation = factory root.operations, root.Q, root.utils, { ObjectPath: root.ObjectPath }
)( @, (operations, Q, utils, objectpath)->

  parseObjectPath = ( pathStr )->
    toReturn = {
      base: pathStr,
      path: []
    }

    parsedPath = objectpath.ObjectPath.parse( pathStr )

    toReturn.base = parsedPath[0]
    toReturn.path = parsedPath.splice(1)

    toReturn

  getPathFromObject = ( sourceObj, path )->
    toReturn = sourceObj
    path.forEach (part)->
      toReturn = if toReturn[part] then toReturn[part] else Operation.EMPTY_VALUE

    toReturn


  substitudeAttrAndValues = (operation, originalStr)->
    newStr = originalStr
    toWait = Q(true)
    parser = operation.getParser()
    m = newStr.match( /\{:(.+?):\}/ig )



    #get attributes
    for fname in m || []
      el = /\{:(.+?):\}/.exec(fname)[1]
      if parser
        parsedPath = parseObjectPath el
        attr = parser.getAttr parsedPath.base
        if attr != Operation.EMPTY_VALUE
          newStr = newStr.replace fname, getPathFromObject( attr, parsedPath.path )

    m = newStr.match( /\{:(.+?):\}/ig )
    #get values
    for fname in m || []
      do ( fname )=>
        toWait = toWait.then ()=>
          el = /\{:(.+?):\}/.exec(fname)[1]
          parsedPath = parseObjectPath el

          # console.log "newStr template getting field #{fname}, #{el}"
          Q( operation.getValue parsedPath.base ).then (val)=>
            # console.log 'got el', el, fname, val
            newStr = newStr.replace fname, getPathFromObject( val, parsedPath.path ) || ''

    toWait.then ()-> newStr

  class Operation
    constructor: ( config )->
      @parser = null
      @field = null
      @config = config

      ###
      We have to use this shortcut to create new operation inside existing one, in order to save execution context
      ###
      @createOperation = ( config )->
        new Operation( config )
        .setParser( @getParser() )
        .setField( @getField() )

      #default evaluate
      @_evaluate = ( res )->
        res || Operation.EMPTY_VALUE

      @evaluate = ( value, cb )->
        d = Q.defer()

        #set callback
        cb = cb || ()->
        if typeof cb != 'function'
          cb = ()->

        if typeof value == 'function' && arguments.length == 1
          cb = value
          value = Operation.EMPTY_VALUE

        nonEmptyValue = !!value

        if value && value.length != undefined && value.length == 0
          nonEmptyValue = false

        if @config.final && nonEmptyValue
          cb value
          d.resolve value
        else
          if !@_evaluate then Operation.EMPTY_VALUE else
            Q(@_evaluate value)
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
                if error.type = "StopParsingError"
                  d.reject error
                else
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

      @getValue = ( valName, cb )=>
        if @getField() && @getField().parentFields
          parent = @.getField().parentFields
          for dep in parent
            if dep.name == valName
              console.log "Warning: Cirsular dependencies while getting %s from %o", valName
              return false
        parser = @getParser()
        # console.log("get field #{valName}", parser)
        if parser
          value = parser.value( valName, @, cb )
          value
        else
          Operation.EMPTY_VALUE

      @substitudeAttrAndValues = (str)=>
        substitudeAttrAndValues @, str



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
          "separator" : "split"

        if config && config.type != undefined
        then type = config.type
        else for own attr, typeName of type_mapping
          if typeof config[attr] != "undefined"
            type = typeName
            break
        if !type
          for own attr, typeName of config
            if typeof @operations[attr] != "undefined"
              type = attr
              break

        config.type = type
        type

      #if undefined( operations was ommited ), return Operation.EMPTY_VALUE
      if @config == undefined
        @config =
          type: "manual"
          value: Operation.EMPTY_VALUE
      #if array of operations
      if @config instanceof Array && @config.length
        @type = "operationQueue"
        @_evaluate = ( value )=>
          @evaluateQueue( value )
      else
        #in some case return initial value
        if typeof @config == "string" || typeof @config == "number" || @config == true || @config == false
        then @config =
          type: "manual"
          value: @config

        @type = @getType @config
        if !@type or !@operations[ @type ]
          val = @getField()
          val = if val then val.name else "undefined"
          if @type and !@operations[ @type ]
            console.log "Unknown operation type #{val}:#{@type}", @config
        else
          @_evaluate = @operations[ @type ]

  #this value should be returned, on soft fail
  Operation.EMPTY_VALUE = ''

  #apply suffix, prefix, etc..
  Operation::decorate = ( value )->
    defer = Q.defer()
    toReturn = value
    #    if !value && !@config.default && value != false
    #      defer.resolve toReturn
    #    else

    #place decorator here in right order
    found = false
    toWait = null

    # set normalize_space: true by default
   
    # if @config && @config.type != "manual" && @config.normalize_space != false
    #   @config.normalize_space = true

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
        # console.log "op type #{f.type} prev val", val, typeof val
        f.evaluate( val )

    result

  Operation::operations = operations

  Operation::parseObjectPath = parseObjectPath

  Operation::decorators = {
    post_processing: (value)->
      @decorators.postProcessing.bind(this)(value)

    postProcessing: ( value )->
      operationConfig = @config.postProcessing || @config.post_processing || @config.postprocessing
      if operationConfig
        @createOperation operationConfig
        .evaluate value

    postprocessing: ( value )->
      @decorators.postProcessing.bind(this)(value)

    normalize_space: ( value )->
      if @config.normalize_space
        if value instanceof Array
          for val in value
            val = Operation::decorators.normalize_space.bind(this)(val)
        else
          if value == undefined || typeof value != 'string'
            value
          else
            value = value.trim()
            value = value.replace /[ \t]{2,}/g, ' '
            value = value.replace /^\s*$[\n\r]{1,}/gm, "\n"
            value
      else
        value

    glue: ( value )->
      if value instanceof Array
        value.filter (val)->
          if val
            val
        .join @config.glue
      else
        value

    suffix: ( value )->
      d = Q.defer()
      if value
        @createOperation( @config.suffix )
        .evaluate()
        .then ( res )->
          if typeof value == 'string'
              d.resolve( value + res )
          if value instanceof Array
            newvalue = value.map (el)=>
              if el
                el + res
              else
                el
            d.resolve( newvalue )
      else
        d.resolve( value )
      d.promise

    preffix: ( value )->
      d = Q.defer()
      if value
        @createOperation( @config.preffix )
        .evaluate()
        .then ( res )->
          if typeof value == 'string'
              d.resolve( res + value )
          if value instanceof Array
            newvalue = value.map (el)=>
              if el
                res + el
              else
                el
            d.resolve( newvalue )
      else
        d.resolve( value )
      d.promise
      
    prefix: ( value )->
      d = Q.defer()
      if value
        @createOperation( @config.prefix )
        .evaluate()
        .then ( res )->
          if typeof value == 'string'
              d.resolve( res + value )
          if value instanceof Array
            newvalue = value.map (el)=>
              if el
                res + el
              else
                el
            d.resolve( newvalue )
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
