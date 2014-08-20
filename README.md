Should be mentioned later:
preBuildResults
defaultConfig
defaultvalue
addFieldDecorator


Parser Initialization
=====================
Common workflow
```
new Parser().parse( config, function( result ){
    console.log( result )
} )
```
Pass custom document object
```
new Parser( HTMLDoc ).parse( config,  function( result ){
    console.log( result )
} )
```
Pass html string
```
new Parser( '<div class="item">21</div>' ).parse( config, function( result ){
    console.log( result )
} )
```
Pass config
```
var parserConfig = {
    document: document,

    //hooks. All hooks should return something to rewrite default behavior
    beforeParse: function( parseConfig ){  },
    afterParse: function( parseResult ){  },
    beforeParseValue: function( valueConfig ){  },
    afterParseValue: function( valueConfig, result ){  },
    onGetValue: function( valueName ){  },

    operations: {},
    decorators: {}
}
new Parser( parserConfig ).parse( config ).then( function( result ){
    console.log( result )
} )
```
Parser Config
=============





Manual of the syndication config
================================
Syndication config is Array of Objects. Each object represents config for specific syndication site.


Optional attributes
-------------------
+ "init_operations" - queue of the operations that should be executed right after syndication button was appended
+ "parsing_config" - array of objects. Each object represents syndication field
+ "file_config" - syndication field thats represent rules to parse urls of photos
+ "button_config" - wrapper css ( div )
+ "button_inner_config"- button css
+ "button_options_config" - options icon container css
+ "button_text" - text on button. Default 'Syndicate with Rooof'
+ "button_options_text" - text next to options icon
+ "button_theme" - change button theme for layout/style ( currently supported only 'rooof' and 'common' )
+ "button_placement" - 'prepend' or 'append'(default)
+ "use_watermark" - use wmark or not
+ "watermark_opacity" - wmark opacity
+ "watermark_position" - wmark position
+ "watermark_brand" - what wmark should we use
+ "disabling_condition" - if operations under this attribute returns true, button will be placed on page, but disabled:
```
    //disabling confition for rule with name 'rooof'
    "disabling_condition": {
        "type":"switchOf",
        "flag":[
            {
                "xpath": "string((.//*[@class='list-row'])[{:index:}]/@data-syndication-data)",
                "postProcessing": { "type": "parseJSON" }
            },
            { "attribute": "listings", "num_in_array": 0 }
        ],
        "positive": { "type": "manual", "value": 0 },
        "negative": { "type": "manual", "value": 1 }
    }
```
+ "include" deprecated ( only for crossrider )
+ "integration_condition" deprecated ( only for crossrider )
+ "syndicate_to" example from `postit-common`:
```
"syndicate_to": [
    {   "name": "craigslist",
        "operations": [{ "xpath": ".//*[@id='craigslist']" },{ "attribute": "checked", "num_in_array": 0 }]
    },
    {   "name": "kijiji",
        "operations": [{ "xpath": ".//*[@id='kijiji']" },{ "attribute": "checked", "num_in_array": 0 }]
    },
    {   "name": "usedeverywhere",
        "operations": [{ "xpath": ".//*[@id='usedeverywhere']" },{ "attribute": "checked", "num_in_array": 0 }]
    }
]
```
+ "values_to_map" - array of values, that should be mapped into result, For example we parse JSON object from page, and we want to map each property into resulting object, so we can do following:
```
...
"values_to_map": ["syndication_content"],
    "parsing_config": [
        {   "name": "syndication_content",
            "persist": true,
            "operations": [
                {   "xpath": ".//syndicationElement",
                    "num_in_array": 0
                },
                {   "attribute": "data-syndication" },
                { "type": "parseJSON" }
            ]
        }
    ]
...
```

Attributes of Value
-------------------
+ "name" - name of the value
+ "tmp" - indicates that value is temporary ( maybe used only for calculation another values ). Temporary values will not includes in result. Useful when temporary value contains huge pack of data.

Queue of the operations
-----------------------
Array of operations( or only one operation ). Queue executes operations according to order in array. Each operation will get as argument result of previos operation, except {"final" : true}, in that case operation will not execute and previos result will return.
We can throw BreakCalculationException('message') inside any of operations to break execution totally.

Example
-------
#### Queue with couple operations
```
[
    {   "name": "furnished", "value": "1" },
    {   "name": "cat_policy", "value": "N" }
]
```
Workflow
---------
- test location with integration_pattern
- add button to container, according to button_container + executes button_config( CSS styles for button wrapper ) and button_inner_config ( CSS styles for button tag )
- executes operations from init_operations
- executes parsing_config
- executes file_config

General attributes of the operations:
-------------------------------------
- "final" - defines whether or not the operation. If previos result not empty, operation do not executes
- "glue" - to make result.join( glue ) if result is array. Ignored if result is string
- "preffix" - add preffix string to result, only if typeof result is string
- "suffix" - add suffix string to result, only if typeof result is string
- "num_in_array" - index in array that should return( if exist ). "glue" has more priority than "num_in_array"
- "debug" - print result in console if debug is on
- "normalize_space" - normalize space
- "persist" - use cache or not ( "persist" : true )
- "required" - if not defined user have to manually set value for this
- "label" - label for value ( using in prompt for 'required' )
- "prompt_text" - text for prompt ( using in prompt for 'required' )
- "site_specific_config" - operations for specifis site `{"craigslist": [{ "type": "manual",  "value": "Y" }],"kijiji": [{ "type": "manual",  "value": "1" }]}`

Example
-------
+ operation with few general attributes. 
 + First operation: try to find array of elements with xpath, then join it with glue. Add suffix and preffix.
 + Second operation in queue will not executes if first operation was successed ( "final" : true ).
 
```
{   "name" : "phone",
    "operations" : [
        { 
            "xpath" : ".//div[@class='content']/div[@id='contact_info']/p",
            "prefix" : "Contact phone ",
            "suffix" : " please call on monday."
            "glue" : "-",
        },
        { 
            "xpath" : ".//div[@class='content']/div[@id='contact']/div",
            "num_in_array" : 2,
            "final" : true
        }
    ]
}
```

Types of the operations
=======================

+ "manual" - manual set value of field. Short form: `{ "name": "building_sqft", "value" : "" }` or inside queue `{  "type": "manual",  "value": "1"    }` or short form inside queue `["Y"]` ( just string )
+ "regex" - return 1st, not 0, element of the matches, so regex should contains "()". Normal form: `{ "type": "regex", "regex": "^(\d{3})" }` or short form `{ "regex": "\d(.+?)\d" }`, "pipe" - return source string instead of empty string if regex is failed, "full": return full array of RegExp.exec() results, we can use `num_in_array` to get specific result: `{ "regex": "\\d(.+?)(\\d+)", "num_in_array": 2 }`, "match": use `string.match(regexp)` instead of `regexp.exec(string)`. By default used 'i' modifier (case insensitive), to change this, we can use `"modifier": "" ` option
+ "parsed_val" - use another value as result. Normal form: `{ "type": "parsed_val",  "name": "address" }` or short form `{ "valName": "address" }`. All `\` should be escaped.
+ "xpath" - make a xpath search. Normal form: `{ "type": "xpath",  "xpath": ".//div[1]" }` or short form `{ "xpath": ".//div[1]" }`. Statement `{:index:}` will be replaced by corresponding index of syndication button. Exapmple: user press button#2 ( with index 2 ), `xpath: ".//div[{:index:}]/span"` will become `".//div[2]/span"`. "document_url" - sets contentDocument from remote url. "doc" - set contentDocument for xpath
+ "current_document" - return current contentDocument. Normal form: `{ "type": "current_document" }`
+ "get_attribute" - get attribute of value. Normal form: `{ "type": "get_attribute",  "attribute": "href" }` or short form `{ "attribute": "location" }`
+ "html_template" - prepare html template. Normal form: `{ "type": "html_template",  "teplate": "<div>{:price:}</div>" }` or short form `{ "template": "<div>{:price:}</div>" }`
+ "replace" - `{ "type": "replace", "suffix": "\n\u200C\n", "is_regex" : true, "arg1": "\\s.?-\\s?", "arg2": "\n"}`, if `is_regex`: use regex with 'global' modificator
+ "equal" - return bool result `{"type": "equal", "value": "0", "is_regex" : true}`
+ "switchOf" - "value" - value that will be used in "flag"; "flag" - OperarionsQueue its result will interpreted as bool; "positive"/"negative" - OperarionsQueue that should be executed according to "flag" result. `{"type": "switchOf", "value": {"valName": "bedeoom_count"}, "flag": {"type": "equal", "value": "true"}, "positive": "Y", "negative": "N"}` 
+ "wait" - wait a delay `{ "type": "wait", "delay": 1000, "postProcessing": [{"xpath": ".//div[@id='results']//div[contains(@class,'grid_2 omega end')]"} ] }`
+ "js_eval" - execute js code`{ "type": "js_eval", "js": "(function(){ return "{:bedroom_count:} bedrooms" })()" }`
+ "html_to_text" - stripe html string to get good formatter text string
+ "html_decode" - decode html entities
+ "utf_encode" - encode utf entities like: `&#x2730;` into symbols, ie `✰` in given text

