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
      },
      {
        "name": "building_sqft",
        "value": ""
      },
      {
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
      },
      {
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
  it("Debug", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_0",
        "value": "apartment"
      },
      {
        "name": "property_type_1",
        "value": "apartment"
      },
      {
        "name": "property_type_2",
        "value": "apartment"
      },
      {
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
  it("Break parsing (callback)", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_0",
        "required": true,
        "value": ""
      }
    ];
    parser = new Parser({
      //use custom prompt
      prompt: function() {
        return null;
      }
    });
    return parser.parse(config, function(res) {
      console.log(res);
      return done();
    });
  });
  it("Break parsing (promise)", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_0",
        "required": true,
        "value": ""
      }
    ];
    parser = new Parser({
      //use custom prompt
      prompt: function() {
        return null;
      }
    });
    return parser.parse(config).then(null, function(error) {
      console.log(error.message);
      return done();
    });
  });
  it("Break parsing on implicit parsing (promise)", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_1",
        "operations": [
          {
            "valName": "property_type_0"
          }
        ]
      },
      {
        "name": "property_type_0",
        "required": true,
        "value": ""
      }
    ];
    parser = new Parser({
      //use custom prompt
      prompt: function() {
        console.log('prompt');
        return null;
      }
    });
    return parser.parse(config).then(null, function(error) {
      console.log(error.message);
      return done();
    });
  });
  it("Break parsing on implicit parsing (htmp_template)", function(done) {
    var config, parser;
    config = [
      {
        "name": "property_type_1",
        "operations": [
          {
            "template": "{:property_type_0:}{:property_type_0:}"
          }
        ]
      },
      {
        "name": "property_type_0",
        "required": true,
        "value": ""
      }
    ];
    parser = new Parser({
      //use custom prompt
      prompt: function() {
        console.log('prompt');
        return null;
      }
    });
    return parser.parse(config).then(null, function(error) {
      console.log(error.message);
      return done();
    });
  });
  it("Break parsing on implicit parsing (default parsing config)", function(done) {
    var config, defaultConfig, parser;
    config = [
      {
        "name": "property_type_1",
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      },
      {
        "name": "property_type_0",
        "required": true,
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      }
    ];
    defaultConfig = [
      {
        "name": "property_type_1",
        "operations": [
          {
            "template": "{:property_type_0:}"
          }
        ]
      },
      {
        "name": "property_type_2",
        "value": "hi2"
      }
    ];
    parser = new Parser({
      defaultConfig: defaultConfig,
      //use custom prompt
      prompt: function() {
        console.log('prompt');
        return null;
      }
    });
    return parser.parse(config, defaultConfig).then(function(val) {
      return console.log("done", val);
    }, function(error) {
      console.log(error.message);
      return done();
    });
  });
  it("Unexisting parsed value", function(done) {
    var config, parser;
    config = [
      {
        "name": "price",
        "operations": [
          {
            "valName": "email"
          }
        ]
      }
    ];
    parser = new Parser();
    return parser.parse(config).then(function(val) {
      if (val.price === Operation.EMPTY_VALUE) {
        return done();
      } else {
        return done('Should be equal to Operation.EMPTY_VALUE: ' + Operation.EMPTY_VALUE);
      }
    });
  });
  return it("Break parsing on implicit parsing (default parsing config and template)", function(done) {
    var config, defaultConfig, parser;
    config = [
      {
        "name": "address",
        "required": true,
        "operations": [
          {
            "template": "hello {:location:}"
          }
        ]
      },
      {
        "name": "addr_string",
        "operations": [
          {
            "type": "concatenation",
            "glue": ", ",
            "parts": [
              {
                "valName": "postal_code"
              }
            ]
          }
        ]
      },
      {
        "name": "postal_code",
        "required": true,
        "operations": [
          {
            "type": "manual",
            "value": false
          }
        ]
      }
    ];
    defaultConfig = [
      {
        "name": "location",
        "operations": [
          {
            "template": "{:addr_string:}"
          }
        ]
      }
    ];
    parser = new Parser({
      debug: false,
      defaultConfig: defaultConfig,
      //use custom prompt
      prompt: function() {
        console.log('prompt', arguments);
        return null;
      }
    });
    return parser.parse(config, defaultConfig).then(function(val) {
      return console.log("done", val);
    }, function(error) {
      console.log(error.message);
      return done();
    });
  });
});
