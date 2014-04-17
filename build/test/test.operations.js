"use strict";
describe("Specific Operations", function() {
  it.skip("Wait 1 second", function() {
    var d;
    this.timeout(3000);
    d = new Operation({
      type: "wait",
      delay: "1000"
    }).evaluate();
    return d.then(function(text) {
      return expect(text).to.equal("1 seconds passed");
    });
  });
  it("Parsed val", function() {
    return new Parser().parse([
      {
        name: "price",
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='price'])"
          }
        ]
      }, {
        name: "clear_price",
        operations: [
          {
            type: "parsed_val",
            valName: "price"
          }, {
            type: "regex",
            regex: "(\\d+)"
          }
        ]
      }
    ]).then(function(res) {
      return expect(res).to.have.a.property("clear_price", "301");
    });
  });
  it("Current doc href", function() {
    var op;
    op = new Operation([
      {
        "type": "current_document"
      }, {
        "attribute": "location"
      }, {
        "attribute": "href"
      }
    ]);
    return op.evaluate().then(function(res) {
      return expect(res).to.equal(document.location.href);
    });
  });
  it("switchOf", function() {
    var op;
    op = new Operation({
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
    });
    return op.evaluate().then(function(res) {
      return expect(res).to.equal("1");
    });
  });
  it("parseJSON", function() {
    var op;
    op = new Operation([
      {
        "value": "{ \"price\": \"301\" }"
      }, {
        "type": "parseJSON"
      }
    ]);
    return op.evaluate().then(function(res) {
      return expect(res).to.have.property("price", "301");
    });
  });
  return it("split", function() {
    var op;
    op = new Operation([
      {
        "value": "value1,value2,value3"
      }, {
        "type": "split",
        "separator": ",",
        "num_in_array": 1
      }
    ]);
    return op.evaluate().then(function(res) {
      return expect(res).to.equal("value2");
    });
  });
});
