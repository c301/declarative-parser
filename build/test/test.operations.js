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
      console.log(res);
      return expect(res).to.have.a.property("clear_price", "301");
    });
  });
  it("Regex", function() {
    return new Parser().parse([
      {
        name: "price",
        value: "abdADasdlfk"
      }, {
        name: "clear_price",
        operations: [
          {
            "valName": "price"
          }, {
            type: "regex",
            regex: "([A-Z]{2})",
            modifier: ""
          }
        ]
      }
    ]).then(function(res) {
      console.log(res);
      return expect(res).to.have.a.property("clear_price", "AD");
    });
  });
  it("Regex all", function() {
    return new Parser().parse([
      {
        name: "price",
        value: "3abdAD3abasdlfkab"
      }, {
        name: "clear_price",
        operations: [
          {
            "valName": "price"
          }, {
            type: "regex",
            regex: "\\d(ab)",
            modifier: "g"
          }
        ]
      }
    ]).then(function(res) {
      console.log(res);
      return expect(res.clear_price.length).to.be.equal(2);
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
  it("Attribute operation", function() {
    var op;
    op = new Operation([
      {
        "type": "current_document"
      }, {
        "attribute": {
          "value": "location"
        }
      }, {
        "attribute": "href"
      }
    ]);
    return op.evaluate().then(function(res) {
      return expect(res).to.equal(document.location.href);
    });
  });
  it("Attribute operation 2", function() {
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
  it("split", function() {
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
  return it("concatenation", function() {
    var op1;
    op1 = new Operation([
      {
        "type": "concatenation",
        "glue": ", ",
        "parts": [
          {
            "value": "val1",
            "postProcessing": {
              "type": "wait",
              "delay": "700"
            }
          }, {
            "value": "val2",
            "postProcessing": {
              "type": "wait",
              "delay": "500"
            }
          }, {
            "value": "val3",
            "postProcessing": {
              "type": "wait",
              "delay": "200"
            }
          }
        ]
      }
    ]);
    return op1.evaluate().then(function(res) {
      return expect(res).to.equal("val1, val2, val3");
    });
  });
});
