"use strict"

describe "Specific Operations", () ->
  it "Wait 1 second", ()->
    @timeout 3000

    d = new Operation({ type: "wait", delay: "1000", default: "1 seconds passed" }).evaluate()

    d.then ( text )->
      expect text
      .to.equal "1 seconds passed"

  it "Split on empty string", ()->
    new Parser().parse([
      { name : "test_split", 
      operations: [
        "",
        { type: "split", separator: "," }
      ] }
    ]).then ( res )->
      console.log res
      expect res.test_split.length
      .to.equal 1

  it "Parsed val", ()->
    new Parser().parse([
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='price'])" }
      ] },
      { name : "clear_price", operations: [
        { type: "parsed_val", valName: "price" },
        { type: "regex", regex: "(\\d+)" }
      ] }
    ]).then ( res )->
      console.log res
      expect res
      .to.have.a.property "clear_price", "301"

  it "Xpath", ()->
    config = [
      {
        name : "class_name",
        operations: [
          { type: "manual", value: "price" }
        ]
      }
      ,
      {
        "name": "xpathing",
        "operations": [
          { "type": "xpath", "xpath": "string(.//*[@class='{:class_name:}'][{:index:}])"}
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "index", 1
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "xpathing", "$ 301"

  it "Regex", ()->
    new Parser().parse([
      { name : "price", value: "abdADasdlfk" },
      { name : "clear_price", operations: [
        { "valName": "price"},
        { type: "regex", regex: "([A-Z]{2})", modifier: "" }
      ] }
    ]).then ( res )->
      console.log res
      expect res
      .to.have.a.property "clear_price", "AD"

  it "Regex all", ()->
    new Parser().parse([
      { name : "price", value: "3abdAD3abasdlfkab" },
      { name : "clear_price", operations: [
        { "valName": "price"},
        { type: "regex", regex: "\\d(ab)", modifier: "g" }
      ] }
    ]).then ( res )->
      console.log res
      expect res.clear_price.length
      .to.be.equal 2

  it "Regex on array", ()->
    new Parser().parse([
      { 
        name : "price", 
        operations: {
          type: "manual",
          value: [
            "$1234",
            "hi $31",
            null,
            "hello $me $2",
            ""
          ] 
        }
      },
      { name : "clear_price", operations: [
        { "valName": "price"},
        { type: "regex", regex: "\\$(\\d+)" }
      ] }
    ]).then ( res )->
      console.log res
      expect res.clear_price[0]
      .to.be.equal '1234'
      expect res.clear_price[1]
      .to.be.equal '31'
      expect res.clear_price[2]
      .to.be.equal Operation.EMPTY_VALUE
      expect res.clear_price[3]
      .to.be.equal '2'

  it "Current doc href", ()->
    op = new Operation [
      {"type": "current_document"},
      {"attribute": "location"},
      {"attribute": "href"}
    ]
    op.evaluate().then ( res )->
      expect res
      .to.equal document.location.href

  it "Attribute operation", ()->
    op = new Operation [
      {"type": "current_document"},
      {"attribute": {
        "value": "location"
         }
      },
      {"attribute": "href"}
    ]
    op.evaluate().then ( res )->
      expect res
      .to.equal document.location.href

  it "Attribute operation 2", ()->
    op = new Operation [
      {"type": "current_document"},
      {"attribute": "location"  },
      {"attribute": "href"}
    ]
    op.evaluate().then ( res )->
      expect res
      .to.equal document.location.href

  it "switchOf", ()->
    op = new Operation {
      "type": "switchOf",
      "value": {
        "valName": "bedroom_count"
      },
      "flag": {
        "type": "equal",
        "value": "0"
      },
      "positive": "Bachelor",
      "negative": {
        "valName": "bedroom_count",
        "default": "1",
        "suffix": "-bedrooms"
      }
    }
    op.evaluate().then ( res )->
      expect res
      .to.equal "1"

  it "parseJSON", ()->
    op = new Operation [
      {
        "value": "{ \"price\": \"301\" }"
      },
      {
        "type": "parseJSON"
      }
    ]
    op.evaluate().then ( res )->
      expect res
      .to.have.property "price", "301"

  it "split", ()->
    op = new Operation [
      {
        "value": "value1,value2,value3"
      },
      {
        "type": "split",
        "separator": ",",
        "num_in_array": 1
      }
    ]
    op.evaluate().then ( res )->
      expect res
      .to.equal "value2"

  it "concatenation", ()->
    op1 = new Operation [
      {
        "type": "concatenation",
        "glue": ", ",
        "parts": [
          {
            "value": "val1"
            "postProcessing": {
              "type": "wait",
              "delay": "700"
            }
          },
          {
            "value": "val2"
            "postProcessing": {
              "type": "wait",
              "delay": "500"
            }
          },
          {
            "value": "val3"
            "postProcessing": {
              "type": "wait",
              "delay": "200"
            }
          }
        ]
      }
    ]
    op1.evaluate().then ( res )->
      expect res
      .to.equal "val1, val2, val3"

  it "html_template", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='price'])" }
      ] }
      ,
      {
        "name": "templating",
        "operations": [
          { "type": "html_template", "template": "check index {:index:} and price {:price:}"}
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "index", "3"
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "templating", "check index 3 and price $ 301"

  it "html_template_access", ()->
    config = [
      { name : "price", operations: [
        { type: "manual", value: [
          {
            "hi": "there"
          },
          {
            "hello": {
              "there": "val1"
            }
          }
        ] }
      ] }
      ,
      {
        "name": "templating",
        "operations": [
          { "type": "html_template", 
          "template": "check index {:index:} and price {:price[0].hi:} {:price[1]['hello'].there:}{:price[2]:}{:price[1].hi:}{:price1:}"}
        ]
      }
    ]
    parser = new Parser()
    parser.setAttr "index", "3"
    parser.parse( config ).then (res)->
      console.log res.templating
      expect res
      .to.have.a.property "templating", "check index 3 and price there val1"

  it "html_template all", ()->
    config = [
      { name : "price1", "value": "1" },
      { name : "price2", "value": "2" },
      { name : "price3", "value": "3" },
      {
        "name": "templating",
        "operations": [
          { "type": "html_template", "template": "{:price1:}{:price2:}{:price3:}"}
        ]
      }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "templating", "123"
