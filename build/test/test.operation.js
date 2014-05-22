"use strict";
describe("Operations testing", function() {
  describe("Check attributes of the operations", function() {
    it("suffix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "suffix": " Price"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("$301 Price");
      });
    });
    it("preffix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "preffix": "Price: "
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price: $301");
      });
    });
    it("preffix and suffix", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='price'])",
        "preffix": "Price: ",
        "suffix": ".00"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price: $301.00");
      });
    });
    it("default", function() {
      var d, op;
      op = new Operation({
        "type": "xpath",
        "xpath": "string(.//*[@class='pric'])",
        "preffix": "Price: ",
        "default": "301"
      });
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("301");
      });
    });
    return it("final", function() {
      var d, op;
      op = new Operation([
        {
          "type": "xpath",
          "xpath": "string(.//*[@class='price'])",
          "preffix": "Price: "
        }, {
          "type": "manual",
          "value": "Price",
          "final": true
        }, {
          "type": "manual",
          "value": "Price 301"
        }
      ]);
      d = op.evaluate();
      return d.then(function(res) {
        return expect(res).to.equal("Price 301");
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
    it("Should be operation of type xpath", function() {
      var op;
      op = new Operation({
        type: "xpath"
      });
      return expect(op.type).to.equal("xpath");
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
        return expect(value).to.be["null"];
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
        }, {
          "type": "wait",
          "delay": "500"
        }, {
          "type": "manual",
          "value": "42"
        }, {
          "type": "xpath",
          "xpath": "string(.//*[@class='price'])"
        }
      ];
      multi = new Operation(ops);
      return multi.evaluate().then(function(result) {
        return expect(result).to.equal("$301");
      });
    });
  });
});
