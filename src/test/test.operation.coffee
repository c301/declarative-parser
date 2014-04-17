"use strict"

describe "Operations testing", ()->
  describe "Check attributes of the operations", ()->
    it "suffix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "suffix": " Price" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "$301 Price"

    it "preffix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "preffix": "Price: " } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price: $301"

    it "preffix and suffix", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='price'])", "preffix": "Price: ", "suffix": ".00" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "Price: $301.00"

    it "default", ()->
      op = new Operation( { "type": "xpath", "xpath": "string(.//*[@class='pric'])", "preffix": "Price: ", "default": "301" } )
      d = op.evaluate()
      d.then ( res )->
        expect res
        .to.equal "301"

    it "final", ()->
      op = new Operation( [
        { "type": "xpath", "xpath": "string(.//*[@class='price'])", "preffix": "Price: " },
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

    it "Should be operation of type xpath", ()->
      op = new Operation({ type: "xpath" })
      expect op.type
      .to.equal "xpath"

    it "Testing manual operation", ()->
      op = new Operation({ type: "manual", value: "manual value" })
      op.evaluate().then (value)->
        expect value
        .to.equal "manual value"

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