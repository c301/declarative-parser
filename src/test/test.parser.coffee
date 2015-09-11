"use strict"

describe "Parser", ()->
  it "Parse", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='price'])" }
      ] }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", "$ 301"

  it "Share cache between parser", ()->
    config = [
      {
        name : "price",
        persist: true,
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='price'])"
          }
        ]
      }
    ]
    config1 = [
      { name : "price", operations: [
          { 
            type: "manual", 
            value: "302" 
          }
        ] 
      }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      parser1 = new Parser()
      parser1.parse( config1 ).then (res)->
        Parser.clearCache()
        expect res
        .to.have.a.property "price", "$ 301"

  it "Set and Read attribute", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='{:price_name:}'])" }
      ] }
    ]
    parser = new Parser()
    parser.setAttr "price_name", "price"
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", "$ 301"

  it "Default config", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='priccce'])" }
      ] }
    ]
    parserConf = {
      defaultConfig: [
        { "name": "price", "value": "100" }
      ] 
    }
    parser = new Parser( parserConf )
    parser.parse( config ).then (res)->
      console.log "Parser returl", res
      expect res
      .to.have.a.property "price", "100"

  it "Handlers", ()->
    config = [
      {
        "name" : "price",
        "required": false,
        "prompt_text": "Please set PRICE",
        "operations": [
          { "type": "xpath", "xpath": "string(.//*[@class='{:price_name:}'])" }
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "price_name", "price"
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", "$ 301"

  it.skip "Set additional field", ()->
    config = [
      {
        "name" : "price",
        "site_specific_config": {
            "olx": 401
        },
        "operations": [
          { "type": "xpath", "xpath": "string(.//*[@class='{:price_name:}'])" }
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "price_name", "price"
    parser.parse( config ).then (res)->
      console.log res
      expect res
      .to.have.a.deep.property "site_specific_results.olx.price", 401

  it "Predefined value", ()->
    config = [
      {
        "name" : "price"
        "value": "40a3",
        "operations": [
          { "regex": "\\d(\\da)" }
        ]
      }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", '0a'

  it "Predefined value 2", ()->
    config = [
      {
        "name":"property_type",
        "value":"apartment"
      },
      {
        "name":"building_sqft",
        "value":""
      },
      {
        "name":"furnished",
        "value": 0
      }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "property_type", 'apartment'
      expect res
      .to.have.a.property "building_sqft", ''
      expect res
      .to.have.a.property "furnished", 0


  it "Test callback based interface", (done)->
    config = [
      {
        "name" : "price1",
        "operations": [
          { "type": "xpath", "xpath": "string(.//*[@class='{:price_name:}'])" }
        ]
      },
      {
        "name" : "price",
        "operations": [
          { "type": "manual", "value": "5005" }
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "price_name", "price"
    parser.parse( config,  (res)->
      console.log "Parser return", res
      if res.price == "5005"
        done()
      else
        done( new Error "Wrong result" )
    )

  it "Postprocessing", ( done )->
    config = [
      {
        "name":"property_type",
        "value":"apartment",
        "postprocessing": [{
          "regex": "(\\D)", "suffix": "nton"
        }]
      }
    ]

    parser = new Parser()
    parser.parse config, (res)->
      if res.property_type == 'anton'
        done()
      else
        done new Error "Bad results"

  it "Debug", ( done )->
    config = [
      {
        "name":"property_type_0",
        "value":"apartment"      
      },
      {
        "name":"property_type_1",
        "value":"apartment"      
      },
      {
        "name":"property_type_2",
        "value":"apartment"      
      },
      {
        "name":"property_type_3",
        "value":"apartment"      
      }
    ]

    parser = new Parser({
        debug: true
    })
    parser.parse config, (res)->
        done()

  it "Break parsing (callback)", ( done )->
    config = [
      {
        "name":"property_type_0",
        "required": true,
        "value":""
      }
    ]

    parser = new Parser({
      #use custom prompt
      prompt: ()->
        null
      
    })
    parser.parse config, (res)->
      console.log res
      done()

  it "Break parsing (promise)", ( done )->
    config = [
      {
        "name":"property_type_0",
        "required": true,
        "value":""
      }
    ]

    parser = new Parser({
      #use custom prompt
      prompt: ()->
        null
      
    })
    parser.parse config
      .then(
        null
        ,
        (error)->
          console.log error.message
          done()
      )

  it "Break parsing on implicit parsing (promise)", ( done )->
    config = [
      {
        "name":"property_type_1",
        "operations": [
          {
            "valName": "property_type_0"
          }
        ]
      },
      {
        "name":"property_type_0",
        "required": true,
        "value":""
      }
    ]

    parser = new Parser({
      #use custom prompt
      prompt: ()->
        console.log 'prompt'
        null
    })
    parser.parse config
      .then(
        null
        ,
        (error)->
          console.log error.message
          done()
      )

  it "Break parsing on implicit parsing (htmp_template)", ( done )->
    config = [
      {
        "name":"property_type_1",
        "operations": [
          {
            "template": "{:property_type_0:}{:property_type_0:}"
          }
        ]
      },
      {
        "name":"property_type_0",
        "required": true,
        "value":""
      }
    ]

    parser = new Parser({
      #use custom prompt
      prompt: ()->
        console.log 'prompt'
        null
    })
    parser.parse config
      .then(
        null
        ,
        (error)->
          console.log error.message
          done()
      )

  it "Break parsing on implicit parsing (default parsing config)", ( done )->
    config = [
      {
        "name":"property_type_1",
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      },
      {
        "name":"property_type_0",
        "required": true,
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      }
    ]
    defaultConfig = [
      {
        "name":"property_type_1",
        "operations": [
          {
            "template": "{:property_type_0:}"
          }
        ]
      },
      {
        "name":"property_type_2",
        "value":"hi2"
      }
    ]
    parser = new Parser({
      defaultConfig: defaultConfig
      #use custom prompt
      prompt: ()->
        console.log 'prompt'
        null
    })
    parser.parse config, defaultConfig
      .then(
        (val)->
          console.log "done", val
        ,
        (error)->
          console.log error.message
          done()
      )

  it "Unexisting parsed value", ( done )->
    config = [{
      "name":"price",
      "operations": [
        {
          "valName": "email"
        }
      ]
    }]
    parser = new Parser()
    parser.parse config
      .then (val)->
        if val.price == Operation.EMPTY_VALUE
          done()
        else 
          done 'Should be equal to Operation.EMPTY_VALUE: ' + Operation.EMPTY_VALUE
      

  it "Break parsing on implicit parsing (default parsing config and template)", ( done )->
    config = [
      {
        "name":"address",
        "required": true,
        "operations": [
          {
            "template": "hello {:location:}"
          }
        ]
      },
      {
          "name": "addr_string",
          "operations": [
              {
                  "type": "concatenation",
                  "glue": ", ",
                  "parts": [
                      { "valName": "postal_code" }
                  ]
              }
          ]
      },
      {
        "name":"postal_code",
        "required": true,
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      }
    ]
    defaultConfig = [
      {
        "name":"location",
        "operations": [
          {
            "template": "{:addr_string:}"
          }
        ]
      }
    ]
    parser = new Parser({
      debug: false,
      defaultConfig: defaultConfig
      #use custom prompt
      prompt: ()->
        console.log 'prompt', arguments
        null
    })
    parser.parse config, defaultConfig
      .then(
        (val)->
          console.log "done", val
        ,
        (error)->
          console.log error.message
          done()
      )
