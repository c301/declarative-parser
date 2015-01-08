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
      return expect(res).to.have.a.property("price", "$ 301");
    });
  });
  it("Share cache between parser", function() {
    var config, config1, parser;
    config = [
      {
        name: "price",
        persist: true,
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='price'])"
          }
        ]
      }
    ];
    config1 = [
      {
        name: "price",
        operations: [
          {
            type: "manual",
            value: "302"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(res) {
      var parser1;
      parser1 = new Parser();
      return parser1.parse(config1).then(function(res) {
        Parser.clearCache();
        return expect(res).to.have.a.property("price", "$ 301");
      });
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
      return expect(res).to.have.a.property("price", "$ 301");
    });
  });
  it("Default config", function() {
    var config, parser, parserConf;
    config = [
      {
        name: "price",
        operations: [
          {
            type: "xpath",
            xpath: "string(.//*[@class='priccce'])"
          }
        ]
      }
    ];
    parserConf = {
      defaultConfig: [
        {
          "name": "price",
          "value": "100"
        }
      ]
    };
    parser = new Parser(parserConf);
    return parser.parse(config).then(function(res) {
      console.log("Parser returl", res);
      return expect(res).to.have.a.property("price", "100");
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
      return expect(res).to.have.a.property("price", "$ 301");
    });
  });
  it.skip("Set additional field", function() {
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
      console.log(res);
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
      console.log("Parser return", res);
      if (res.price === "5005") {
        return done();
      } else {
        return done(new Error("Wrong result"));
      }
    });
  });
  it("Postprocessing", function(done) {
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
  return it("Debug", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_0",
        "value": "apartment"
      }, {
        "name": "property_type_1",
        "value": "apartment"
      }, {
        "name": "property_type_2",
        "value": "apartment"
      }, {
        "name": "property_type_3",
        "value": "apartment"
      }
    ];
    parser = new Parser({
      debug: true
    });
    return parser.parse(config, function(res) {
      return done();
    });
  });
});
