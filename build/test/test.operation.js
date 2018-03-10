"use strict";
describe("Operations testing", function() {
  describe("Check attributes of the operations", function() {
    it("default normalize_space", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])"
      });
      d = op.evaluate();
      return d.then(function(res) {
        console.log(res);
        return expect(res).to.equal("$ 301");
      });
    });
    it("post_processing", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "post_processing": {
          "type": "regex",
          "regex": "(\\d+)"
        }
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("301");
      });
    });
    it("suffix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "suffix": " Price"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("$ 301 Price");
      });
    });
    it("prefix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "prefix": "Price: "
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price: $ 301");
      });
    });
    it("preFFix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "preffix": "Price: "
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price: $ 301");
      });
    });
    it("suffix on Array", function() {
      var d, op;
      op = new Operation({
        "type": "manual",
        "value": ["one", "two", "three"],
        "suffix": "Price: "
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res[0]).to.equal("onePrice: ");
      });
    });
    it("prefix on Array", function() {
      var d, op;
      op = new Operation({
        "type": "manual",
        "value": ["one", "two", "three"],
        "prefix": "Price: "
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res[1]).to.equal("Price: two");
      });
    });
    it("prefix and suffix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "prefix": "Price: ",
        "suffix": ".00"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price: $ 301.00");
      });
    });
    it("default", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='pric'])",
        "prefix": "Price: ",
        "default": "301"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("301");
      });
    });
    it("final", function() {
      var d, op;
      op = new Operation([
        {
          "type": "xpath",
          "xpath": "string(.//*[@class='price'])",
          "prefix": "Price: "
        },
        {
          "type": "manual",
          "value": "Price",
          "final": true
        },
        {
          "type": "manual",
          "value": "Price 301"
        }
      ]);
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price 301");
      });
    });
    return it("final empty array", function() {
      var d, op;
      op = new Operation([
        {
          "type": "manual",
          "value": []
        },
        {
          "type": "manual",
          "value": "Price",
          "final": true
        },
        {
          "type": "manual",
          "value": "301"
        }
      ]);
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("301");
      });
    });
  });
  describe("Basic", function() {
    it("Pass only string", function() {
      var op;
      op = new Operation("manual value");
      return op.evaluate().then(function(value) {
        return expect(value).to.equal("manual value");
      });
    });
    it("Pass only bool(true)", function() {
      var op;
      op = new Operation(true);
      return op.evaluate().then(function(value) {
        return expect(value).to.equal(true);
      });
    });
    it("Pass only bool(false)", function() {
      var op;
      op = new Operation(false);
      return op.evaluate().then(function(value) {
        return expect(value).to.equal(false);
      });
    });
    it("Testing manual operation", function() {
      var op;
      op = new Operation({
        type: "manual",
        value: "manual value"
      });
      return op.evaluate().then(function(value) {
        return expect(value).to.equal("manual value");
      });
    });
    it("Testing manual operation with bool(false)", function() {
      var op;
      op = new Operation({
        type: "manual",
        default: "def_value",
        value: false
      });
      return op.evaluate().then(function(value) {
        return expect(value).to.equal("def_value");
      });
    });
    it("Testing manual operation with bool(true)", function() {
      var op;
      op = new Operation({
        type: "manual",
        default: "def_value",
        value: true
      });
      return op.evaluate().then(function(value) {
        return expect(value).to.equal(true);
      });
    });
    it("Should be operation of type xpath", function() {
      var op;
      op = new Operation({
        type: "xpath"
      });
      return expect(op.type).to.equal("xpath");
    });
    it("Evaluate regex on existing value", function() {
      var op;
      op = new Operation({
        type: "regex",
        "regex": "(\\d+)"
      });
      return op.evaluate("Year of build 2010.").then(function(value) {
        return expect(value).to.equal("2010");
      });
    });
    it("Should return promise", function() {
      var op;
      op = new Operation({
        type: "xpath",
        document_url: "http://google.com"
      });
      return expect(op.evaluate()).to.have.property('promiseDispatch');
    });
    return it("Pass empty object", function() {
      var op;
      op = new Operation({});
      return op.evaluate().then(function(value) {
        return expect(value).to.be.equal(Operation.EMPTY_VALUE);
      });
    });
  });
  return describe("Operations Queue", function() {
    return it("Multi operations", function() {
      var multi, ops;
      this.timeout(4000);
      ops = [
        {
          "type": "xpath"
        },
        {
          "type": "wait",
          "delay": "500"
        },
        {
          "type": "manual",
          "value": "42"
        },
        {
          "type": "xpath",
          "xpath": "string(.//*[@class='price'])"
        }
      ];
      multi = new Operation(ops);
      return multi.evaluate().then(function(result) {
        return expect(result).to.equal("$ 301");
      });
    });
  });
});
