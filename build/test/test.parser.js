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
        "site_specific_config": {
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
      return expect(res).to.have.a.deep.property("site_specific_results.olx.price", 401);
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
  it("Predefined value 2", function() {
    var config, parser;
    config = [
      {
        "name": "property_type",
        "value": "apartment"
      }, {
        "name": "building_sqft",
        "value": ""
      }, {
        "name": "furnished",
        "value": 0
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      expect(res).to.have.a.property("property_type", 'apartment');
      expect(res).to.have.a.property("building_sqft", '');
      return expect(res).to.have.a.property("furnished", 0);
    });
  });
  it("Test callback based interface", function(done) {
    var config, parser;
    config = [
      {
        "name": "price1",
        "operations": [
          {
            "type": "xpath",
            "xpath": "string(.//*[@class='{:price_name:}'])"
          }
        ]
      }, {
        "name": "price",
        "site_specific_config": {
          "olx": {
            "valName": "price1"
          }
        },
        "operations": [
          {
            "type": "manual",
            "value": "5005"
          }
        ]
      }
    ];
    parser = new Parser();
    parser.setAttr("price_name", "price");
    return parser.parse(config, function(res) {
      console.log(res);
      if (res.site_specific_results.olx.price === "$301") {
        return done();
      } else {
        return done(new Error("Wrong result"));
      }
    });
  });
  return it("Postprocessing", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type",
        "value": "apartment",
        "postprocessing": [
          {
            "regex": "(\\D)",
            "suffix": "nton"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config, function(res) {
      if (res.property_type === 'anton') {
        return done();
      } else {
        return done(new Error("Bad results"));
      }
    });
  });
});
