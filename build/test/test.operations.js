"use strict";
describe("Specific Operations", function() {
  it("Wait 1 second", function() {
    var d;
    this.timeout(3000);
    d = new Operation({
      type: "wait",
      delay: "1000",
      "default": "1 seconds passed"
    }).evaluate();
    return d.then(function(text) {
      return expect(text).to.equal("1 seconds passed");
    });
  });
  it("Split on empty string", function() {
    return new Parser().parse([
      {
        name: "test_split",
        operations: [
          "", {
            type: "split",
            separator: ","
          }
        ]
      }
    ]).then(function(res) {
      console.log(res);
      return expect(res.test_split.length).to.equal(1);
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
  it("Xpath", function() {
    var config, parser;
    config = [
      {
        name: "class_name",
        operations: [
          {
            type: "manual",
            value: "price"
          }
        ]
      }, {
        "name": "xpathing",
        "operations": [
          {
            "type": "xpath",
            "xpath": "string(.//*[@class='{:class_name:}'][{:index:}])"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("index", 1);
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("xpathing", "$ 301");
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
  it("Regex on array", function() {
    return new Parser().parse([
      {
        name: "price",
        operations: {
          type: "manual",
          value: ["$1234", "hi $31", null, "hello $me $2", ""]
        }
      }, {
        name: "clear_price",
        operations: [
          {
            "valName": "price"
          }, {
            type: "regex",
            regex: "\\$(\\d+)"
          }
        ]
      }
    ]).then(function(res) {
      console.log(res);
      expect(res.clear_price[0]).to.be.equal('1234');
      expect(res.clear_price[1]).to.be.equal('31');
      expect(res.clear_price[2]).to.be.equal(Operation.EMPTY_VALUE);
      return expect(res.clear_price[3]).to.be.equal('2');
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
  it("concatenation", function() {
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
  it("html_template", function() {
    var config, parser;
    config = [
      {
        name: "price",
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='price'])"
          }
        ]
      }, {
        "name": "templating",
        "operations": [
          {
            "type": "html_template",
            "template": "check index {:index:} and price {:price:}"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("index", "3");
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("templating", "check index 3 and price $ 301");
    });
  });
  return it("html_template all", function() {
    var config, parser;
    config = [
      {
        name: "price1",
        "value": "1"
      }, {
        name: "price2",
        "value": "2"
      }, {
        name: "price3",
        "value": "3"
      }, {
        "name": "templating",
        "operations": [
          {
            "type": "html_template",
            "template": "{:price1:}{:price2:}{:price3:}"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("templating", "123");
    });
  });
});
