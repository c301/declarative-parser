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
      .to.have.a.property "price", "$301"

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
      .to.have.a.property "price", "$301"

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
      .to.have.a.property "price", "$301"

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
