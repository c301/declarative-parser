"use strict";
describe("Parser", function() {
  it("Parse", function() {
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
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("price", "$301");
    });
  });
  it("Set and Read attribute", function() {
    var config, parser;
    config = [
      {
        name: "price",
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='{:price_name:}'])"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("price_name", "price");
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("price", "$301");
    });
  });
  it("Handlers", function() {
    var config, parser;
    config = [
      {
        "name": "price",
        "required": false,
        "prompt_text": "Please set PRICE",
        "operations": [
          {
            "type": "xpath",
            "xpath": "string(.//*[@class='{:price_name:}'])"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("price_name", "price");
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("price", "$301");
    });
  });
  it("Set additional field", function() {
    var config, parser;
    config = [
      {
        "name": "price",
        "site_specific_fields": {
          "olx": 401
        },
        "operations": [
          {
            "type": "xpath",
            "xpath": "string(.//*[@class='{:price_name:}'])"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("price_name", "price");
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.deep.property("site_specific_fields.olx.price", 401);
    });
  });
  it("Predefined value", function() {
    var config, parser;
    config = [
      {
        "name": "price",
        "value": "40a3",
        "operations": [
          {
            "regex": "\\d(\\da)"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("price", '0a');
    });
  });
  return it("Predefined value", function() {
    var config, parser;
    config = [
      {
        "name": "price",
        "value": "40a3",
        "operations": [
          {
            "regex": "\\d(\\da)"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      return expect(res).to.have.a.property("price", '0a');
    });
  });
});
