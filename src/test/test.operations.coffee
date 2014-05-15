"use strict"

describe "Specific Operations", () ->
  it.skip "Wait 1 second", ()->
    @timeout 3000

    d = new Operation({ type: "wait", delay: "1000" }).evaluate()

    d.then ( text )->
      expect text
      .to.equal "1 seconds passed"

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

  it "Current doc href", ()->
    op = new Operation [
      {"type": "current_document"},
      {"attribute": "location"},
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
