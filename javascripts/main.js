var getRule = function() {
  try{
    var text = $('#parserInput').text();
    return JSON.parse(text);
  }catch(e){
    alert('Bad input');
    return false;
  }
}
var getDoc = function() {
  var text = $('#parserDoc').text().trim();
  return text;
}

var evaluate = function(e) {

  var rule = getRule();
  var html = getDoc();
  var singleOp = $('#singleOperation').checked

  if( rule ){
    var parser = new Parser(html);
    if( singleOp ){
      var op = new Operation(rule).setParser(parser);
      var d = op.evaluate();

      return d.then(function(res) {
        return $('#parserOutput').text( JSON.stringify(res, null, '    ') );
      })
      .catch(function(e) {
        console.log( e );
      });
    }else{
      parser.parse( rule ).then(function(res) {
        return $('#parserOutput').text( JSON.stringify(res, null, '    ') );
      })
      .catch(function(e) {
        console.log( e );
      });
    }
  }
  return false;
}

$('#parserEvaluate').click(evaluate);

//evaluate on init
evaluate();

