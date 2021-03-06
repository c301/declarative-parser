"use strict"
default_config = [
  {
    "name": "contact_telephone",
    "operations": {
      "valName": "phone"
    }
  },
  {
    "name": "contact_email",
    "operations": {
      "valName": "email"
    }
  },
  {
    "name": "heading",
    "operations": {
      "valName": "title"
    }
  },
  {
    "name": "street",
    "operations": {
      "valName": "street_address"
    }
  },
  {
    "name":"currency",
    "value":"USD"
  },
  {
    "name":"property_type",
    "value":"apartment"
  },
  {
    "name":"building_sqft",
    "value":""
  },
  {
    "name":"furnished",
    "value": 0
  },
  {
    "name":"relationship",
    "value": 0
  },
  {
    "name":"show_on_map",
    "value":"Y"
  },
  {
    "name":"receive_emails",
    "value":"N"
  },
  {
    "name":"pet_policy",
    "value":"2"
  },
  {
    "name":"bathroom_count",
    "value":"1"
  },
  {
    "name":"bedroom_count",
    "value":"1"
  },
  {
    "name":"stored_city",
    "operations":[
      {
        "final":"true",
        "storedName":"kijijiCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"craigslistCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"usedeverywhereCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"ebayclassifiedsCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"gottarentCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"viewitCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"zillowCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"freerentalsiteCity"
      },
      {
        "final":"true",
        "type":"stored",
        "name":"sortopiaCity"
      }
    ]
  },
  {
    "name":"location",
    "operations":[
      {
        "type":"parsed_val",
        "name":"address"
      }
    ]
  },
  {
    "name":"street_address",
    "operations":[
      {
        "type":"parsed_val",
        "name":"address"
      }
    ]
  },
  {
    "name":"street_number",
    "operations":[
      {
        "type":"parsed_val",
        "name":"address"
      },
      {
        "regex":"(\\d+)"
      }
    ]
  },
  {
    "name":"street_name",
    "operations":[
      {
        "type":"parsed_val",
        "name":"address"
      },
      {
        "opName":"street_regex"
      }
    ]
  },
  {
    "name":"city",
    "operations":[
      {
        "valName":"stored_city"
      },
      {
        "regex": "^(.*?),"
      }
    ]
  },
  {
    "name":"state",
    "operations":[
      {
        "valName":"stored_city"
      },
      {
        "regex": "^.*,\\s(.*),"
      }
    ]
  },
  {
    "name":"country",
    "operations":[
      {
        "valName":"stored_city"
      },
      {
        "regex": "^.*,\\s.*,\\s(.*)"
      }
    ]
  },
  {
    "name":"signature",
    "operations":[
      {
        "storedName":"listingSignature"
      }
    ]
  },
  {
    "name":"want_email",
    "operations":[
      {
        "type":"stored",
        "name":"usedeverywhereReceiveEmail",
        "postprocessing":[
          {
            "type":"switchOf",
            "flag":{
              "type":"equal",
              "value":"true"
            },
            "positive":"Y",
            "negative":"N"
          }
        ]
      }
    ]
  },
  {
    "name":"description",
    "operations":[
      {
        "type":"concatenation",
        "glue":"",
        "parts":[
          {
            "valName":"description_text"
          },
          {
            "valName":"contact",
            "preffix":"\nContact:"
          },
          {
            "valName":"phone",
            "preffix":"\nTelephone:"
          },
          {
            "valName":"available_date",
            "preffix":"\n"
          },
          {
            "valName":"signature"
          }
        ]
      }
    ]
  }
]
config = [
  {
    "name": "AAA",
    "operations": [
      {
        "type": "wait",
        "delay": "2000"
      },
      { "valName": "title_text" }
    ]
  },
  {
    "name": "random",
    "operations": { "type": "randomInt", "from": 1, "to": 99 }
  },
  {
    "name": "listing_link",
    "operations": [
      {
        "type": "current_document"
      },
      {
        "attribute": "location"
      },
      {
        "attribute": "href"
      }
    ]
  },
  {
    "name": "managed_by",
    "operations": {
      "xpath": "normalize-space(string(.//div[@id='manager-body']/div[@id='managed-by']))"
    }
  }
,
  {
    "name": "viewing_and_info",
    "operations": {
      "xpath": "normalize-space(string(.//div[@id='manager-body']/div[@id='viewings-and-info']))"
    }
  },
  {
    "name": "amenities_right_html",
    "operations": [
      {
        "xpath": ".//div[@id='amenities-holder']/div[@id='amenities-body']/ul[@class='right']/li"
      },
      {
        "attribute": "textContent",
        "glue": "</li><li>",
        "preffix": "<li>",
        "suffix": "</li>"
      }
    ]
  },
  {
    "name": "amenities_left_html",
    "operations": [
      {
        "xpath": ".//div[@id='amenities-holder']/div[@id='amenities-body']/ul[@class='left']/li"
      },
      {
        "attribute": "textContent",
        "glue": "</li><li>",
        "preffix": "<li>",
        "suffix": "</li>"
      }
    ]
  },
  {
    "name": "main_photo_url",
    "operations": [
      {
        "xpath": ".//div[@id='photo-holder']/img[@id='listing-photo']",
        "num_in_array": "0"
      },
      {
        "attribute": "src"
      }
    ]
  },
  {
    "name": "title_text",
    "operations": [
      {
        "xpath": "normalize-space(string(//*[@id='listing-wrapper']/h1))"
      }
    ]
  }
,
  {
    "name": "bedroom_count_text",
    "operations": {
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
    }
  },
  {
    "name": "title",
    "operations": [
      {
        "type": "concatenation",
        "glue": ", ",
        "parts": [
          {
            "valName": "title_text"
          },
          {
            "valName": "bedroom_count_text"
          },
          {
            "valName": "bathroom_count",
            "default": "1",
            "suffix": " bathrooms"
          }
        ]
      }
    ]
  },
  {
    "name": "price",
    "default": "402",
    "operations": [
      {
        "xpath": "string(//*[@id='vacancies-body']/div[1]/div[1])"
      },
      {
        "type": "regex",
        "regex": "\\$(\\d+\\.?\\d+)"
      }
    ]
  },
  {
    "name": "bedroom_count",
    "operations": [
      {
        "xpath": "normalize-space(string(//*[@id='vacancies-body']/div[1]/div[1]/span[1]))"
      },
      {
        "type": "switchOf",
        "flag": {
          "type": "equal",
          "is_regex": true,
          "value": "Bachelor"
        },
        "positive": "0",
        "negative": [
          {
            "xpath": "normalize-space(string(//*[@id='vacancies-body']/div[1]/div[1]/span[1]))"
          },
          {
            "type": "regex",
            "regex": "(\\d+)"
          }
        ]
      }
    ]
  },
  {
    "name": "bathroom_count",
    "operations": [
      {
        "xpath": "normalize-space(string(//*[@id='vacancies-body']/div[1]/ul/li[contains(text(),'bathroom')]))"
      },
      {
        "regex": "([\\d\\.]+)\\sbath"
      }
    ]
  },
  {
    "name": "contact",
    "operations": [
      {
        "xpath": "translate(normalize-space(string(//*[@id='managed-by'])), '', '')"
      },
      {
        "type": "regex",
        "regex": "Managed by:(.*)"
      }
    ]
  },
  {
    "name": "additional_desc",
    "operations": [
      {
        "xpath": ".//*[@class='left']/li",
      },
      {
        "attribute": "textContent",
        "glue": "|",
        "preffix": "++",
        "suffix": "++",
        "normalize_space": true
      }
    ]
  },
  {
    "name": "description_text",
    "operations": [
      {
        "xpath": "normalize-space(string(//*[@id='description-body']))"
      }
    ]
  },
  {
    "name": "description_raw",
    "operations": [
      {
        "xpath": "//*[@id='description-body']",
        "num_in_array": "0"
      },
      {
        "attribute": "innerHTML"
      }
    ]
  },
  {
    "name": "phone",
    "operations": [
      {
        "xpath": "translate( normalize-space(string(//*[@id='viewings-and-info'])),'For viewings & information please call:', '')"
      },
      {
        "type": "regex",
        "regex": "((\\(\\d{3}\\)|\\d{3}-)?\\s*\\d{3}-\\d{4}|\\d{3}\\.|-\\d{3}\\.|-\\d{4})"
      }
    ]
  },
  {
    "name": "address",
    "operations": [
      {
        "type": "concatenation",
        "glue": ", ",
        "parts": [
          { "valName": "street_address" },
          { "valName": "city" },
          { "type": "concatenation", "glue": " ", "parts": [
            { "valName": "postal_code" },
            { "valName": "state" }
          ] },
          { "valName": "country" }
        ]
      }
    ]
  },
  {
    "name": "location",
    "operations": {
      "valName": "address"
    }
  },
  {
    "name": "street_address",
    "operations": [
      {"xpath": "string(.//span[@itemprop='streetAddress'])"}
    ]
  },
  {
    "name": "city",
    "default": "Victoria",
    "operations": [
      {"xpath": "string(.//meta[@itemprop='addressLocality']/@content)"},
      {"regex": "(.+?),"}
    ]
  },
  {
    "name": "state",
    "default": "BC",
    "operations": [
      {"xpath": "string(.//meta[@itemprop='addressRegion']/@content)"}
    ]
  },
  {
    "name": "postal_code",
    "operations": [
      {"xpath": "string(.//meta[@itemprop='postalCode']/@content)"}
    ]
  },
  {
    "name": "country",
    "operations": [
      {"xpath": "string(.//meta[@itemprop='addressCountry']/@content)"}
    ]
  },
  {
    "name": "description_html",
    "operations": {
      "template": "<h3>{:title_text:}</h3> <b>Price:</b> ${:price:} <br/> <br/> {:additional_desc:} {:description_raw:} <br/> <br/> <b>Building Amenities:</b> <ul> {:amenities_left_html:} {:amenities_right_html:} </ul> <b>{:managed_by:}</b> <br/> <b>Phone: {:phone:}</b>"
    }
  },
  {
    "name": "description",
    "operations": [
      {
        "type": "concatenation",
        "glue": "",
        "parts": [
          {
            "valName": "description_text",
            "suffix": "\n\n"
          },
          {
            "preffix": "\nBuilding Manager: ",
            "valName": "contact"
          },
          {
            "preffix": "\nTelephone: ",
            "valName": "phone"
          },
          {
            "valName": "signature",
            "preffix": "\n\n\n"
          }
        ]
      }
    ]
  }
]

describe "General parsing", ()->
  htmlText = ''
  # before (done)->
  #   @timeout 30000
  #   console.log 'get remote doc'
  #   $.get "http://www.devonprop.com/victoria-rental-listings/listing/?id=1661", (res)->
  #     console.log '===============================', res
  #     htmlText = res.responseText
  #     done()

  # it "Get remote doc and parse", (done)->
  #   @timeout 5000
  #   parser = new Parser( htmlText )
  #   parser.parse( config, default_config ).then (res)->
  #     console.log res
  #     if res.title_text != "Braemore Manor - 1118 Balmoral Road"
  #       done(new Error "Wrong parsing result")
  #     else
  #       done()

  it "Pass custom operation", (done)->
    @timeout 5000
    parser = new Parser()
    parser.addOperations( {
      concatenation1: ()->
        parts = @config.parts
        glue = @config.glue || ""

        toWait = []
        result = []
        d = Q.defer()
        for part in parts
          do ( part ) =>
            toWait.push(
              @createOperation part
              .evaluate().then (res)->
                if res
                  result.push res
            )
        Q.allSettled toWait
          .then ()=>
            d.resolve result.join glue

        d.promise
    } )
    parser.parse( [{
      "name": "address",
      "operations": [
        {
          "type": "concatenation1",
          "glue": ", ",
          "parts": [
            { "value": "Moscow" },
            { "value": "Red Square" },
            { "type": "concatenation", "glue": " ", "parts": [
              { "value": "433000" },
              { "value": "JC" }
            ] }
          ]
        }
      ]
    }] ).then (res)->
      if res.address != "Moscow, Red Square, 433000 JC"
        done(new Error "Wrong parsing result")
      else
        done()


  it "Document as string", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='price'])" }
      ] }
    ]
    parser = new Parser("<div class='price'>$302</div>")
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", "$302"

  it "Parse. Value in short form. Operations was ommited", ()->
    config = [
      { name : "price", default: "" }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", Operation.EMPTY_VALUE

  it "Parse", ()->
    config = [
      { name : "price", operations: [
        { type: "xpath", xpath: "string(.//*[@class='price'])" }
      ] }
    ]
    parser = new Parser()
    parser.parse( config ).then (res)->
      expect res
      .to.have.a.property "price", "$ 301"

  it "Pass custom decorators", (done)->
    @timeout 30000
    parser = new Parser()
    parser.addDecorators( {
      num_in_array_custom: ( value )->

        if value instanceof Array
          value[@config.num_in_array_custom]
        else
          value
    } )
    parser.parse( [
      { name : "price", operations: [
        { type: "xpath", xpath: ".//*[@class='price']" },
        { attribute: "textContent", "num_in_array_custom": 0 }
      ] }
    ] ).then (res)->
      if res.price != "$ 301"
        done(new Error "Wrong parsing result")
      else
        done()

  it "Parser hooks", (done)->
    @timeout 3000
    parser = new Parser({
      parseHooks : {
        price : {
            after: (val)->
              console.log( "after hook", val )
              if val == "$ 301"
                "hello"
              else
                val
        }
      }
    })
    parser.parse( [
      { name : "price", operations: [
        { type: "xpath", xpath: ".//*[@class='price']" },
        { attribute: "textContent", "num_in_array": 0 }
      ] }
    ] ).then (res)->
      if res.price != "hello"
        done(new Error "Wrong parsing result")
      else
        done()
