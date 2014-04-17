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

  it "Set additional field", ()->
    config = [
      {
        "name" : "price",
        "site_specific_fields": {
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
      expect res
      .to.have.a.deep.property "site_specific_fields.olx.price", 401

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

  it "Test callback based interface", ()->
    config = [
      {
        "name" : "price",
        "site_specific_fields": {
          "olx": 401
        },
        "operations": [
          { "type": "xpath", "xpath": "string(.//*[@class='{:price_name:}'])" }
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "price_name", "price"
    parser.parse( config,  (res)->
      expect res
      .to.have.a.deep.property "site_specific_fields.olx.price", 401

      #callback in operation
      op = new Operation({type: "regex", "regex": "(\\d+)"})
      op.evaluate "Year of build 2010.", (value)->
        expect value
        .to.equal "2010"
    )



  it "onGetValue hook, access another value via this.value('<val_name>') within hook", ()->
    config = [
      {
        "name" : "price"
        "value": "40a3",
        "operations": [
          { "regex": "\\d(\\da)" }
        ]
      },
      {
        "name" : "title"
        "value": "Super title"
      }
    ]
    parser = new Parser
      onGetValue: (valName)->
        if valName == "price"
          @value title
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", '0a'