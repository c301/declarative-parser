"use strict"

describe "Operations testing", ()->
  describe "Check attributes of the operations", ()->
    it "post_processing", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "post_processing": {
        "type": "regex",
        "regex": "(\\d+)"
      } } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "301"
    it "suffix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "suffix": " Price" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "$301 Price"

    it "prefix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "prefix": "Price: " } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price: $301"

    it "preFFix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "preffix": "Price: " } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price: $301"

    it "suffix on Array", ()->
      op = new Operation( { "type": "manual", "value": [ "one", "two", "three" ], "suffix": "Price: " } )
      d = op.evaluate()
      d.then ( res )->
        expect res[0]
        .to.equal "onePrice: "

    it "prefix on Array", ()->
      op = new Operation( { "type": "manual", "value": [ "one", "two", "three" ], "prefix": "Price: " } )
      d = op.evaluate()
      d.then ( res )->
        expect res[1]
        .to.equal "Price: two"

    it "prefix and suffix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "prefix": "Price: ", "suffix": ".00" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price: $301.00"

    it "default", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='pric'])", "prefix": "Price: ", "default": "301" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "301"

    it "final", ()->
      op = new Operation( [
        { "type": "xpath", "xpath": "string(.//*[@class='price'])", "prefix": "Price: " },
        { "type": "manual", "value": "Price", "final" : true }
        { "type": "manual", "value": "Price 301" }
      ] )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price 301"

  describe "Basic", ()->
    it "Pass only string", ()->
      op = new Operation("manual value")
      op.evaluate().then (value)->
        expect value
        .to.equal "manual value"

    it "Pass only bool(true)", ()->
      op = new Operation(true)
      op.evaluate().then (value)->
        expect value
        .to.equal true

    it "Pass only bool(false)", ()->
      op = new Operation(false)
      op.evaluate().then (value)->
        expect value
        .to.equal false

    it "Testing manual operation", ()->
      op = new Operation({ type: "manual", value: "manual value" })
      op.evaluate().then (value)->
        expect value
        .to.equal "manual value"

    it "Testing manual operation with bool(false)", ()->
      op = new Operation({ type: "manual", default: "def_value", value: false })
      op.evaluate().then (value)->
        expect value
        .to.equal "def_value"

    it "Testing manual operation with bool(true)", ()->
      op = new Operation({ type: "manual", default: "def_value", value: true })
      op.evaluate().then (value)->
        expect value
        .to.equal true

    it "Should be operation of type xpath", ()->
      op = new Operation({ type: "xpath" })
      expect op.type
      .to.equal "xpath"

    it "Evaluate regex on existing value", ()->
      op = new Operation({type: "regex", "regex": "(\\d+)"})
      op.evaluate "Year of build 2010."
      .then (value)->
          expect value
          .to.equal "2010"

    it "Should return promise", ()->
      op = new Operation({ type: "xpath", document_url: "http://google.com" })
      expect op.evaluate()
      .to.have.property 'promiseDispatch'
      
    it "Pass empty object", ()->
      op = new Operation({})
      op.evaluate().then (value)->
        expect value
        .to.be.null


  describe "Operations Queue", ()->
    it "Multi operations", ()->
      @timeout 4000
      ops = [
        { "type": "xpath" },
        { "type": "wait", "delay": "500" },
        { "type": "manual", "value": "42" },
        { "type": "xpath", "xpath": "string(.//*[@class='price'])" }
      ]
      multi = new Operation ops
      multi.evaluate().then ( result )->
        expect result
        .to.equal "$301"
