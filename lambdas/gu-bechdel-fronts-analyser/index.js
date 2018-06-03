var AWS = require('aws-sdk');
AWS.config.update({region: 'eu-west-1'});

ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});


const doc = require('dynamodb-doc');
const Q = require('kew');
const bechdelScore = require('gu-bechdel');
const fetch = require("node-fetch");

const namesJsonUrl = 'https://s3-eu-west-1.amazonaws.com/bechdel-test-names/names.json'

const capiKey = process.env.CapiKey;
const pathsString = process.env.Paths;

const pathsArray = pathsString.split(",");
var urls = formUrls(pathsArray);


function formUrls(paths) {
    return paths.map(x => "http://api.nextgen.guardianapps.co.uk" + x + "/lite.json");
}

function putItem(json) {
    const defer = Q.defer();
    const params = {
      TableName: 'bechdel-fronts',
      Item: json
    };
    ddb.putItem(
        params,
        defer.makeNodeResolver()
    );
    return defer.promise;
}

function requestFrontsFromCAPI() {
    var promises = urls.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });
    return fetchResponses;
}

function x() {
    var fetchResponses = requestFrontsFromCAPI();

    fetch(namesJsonUrl).then(function(response){
      return response.json()
    }).then(function(names){
        fetchResponses.then(function(responses) {
        Promise.all(responses).then(function(json){
            var objects = json.map((element,index) => {
                var item = [];
                var date = new Date();
                var promises = [];
                element.collections.map((collection, containerIndex) => {
                  if(collection.content){
                      collection.content.map((content, contentIndex) => {


                        promises.push(bechdelScore.getArticleScoreFromPath(content.id, names, capiKey).then(x => {
                              var breakdown = x.breakdown;
                              var score = x.score;
                              var linkData = {
                                  time: {
                                    S: date.toString()
                                  },
                                  front: {
                                    S: pathsArray[index]
                                  },
                                  link : {
                                    S: content.id
                                  },
                                  containerIndex : {
                                    N: containerIndex.toString()
                                  },
                                  containerName : {
                                    S: collection.displayName,
                                  },
                                  contentIndex : {
                                    N: contentIndex.toString()
                                  },
                                  breakdown: {
                                    S: breakdown.toString()
                                  },
                                  score: {
                                    N: score.toString()
                                  }
                              };
                              item.push(linkData);
                              return true;
                              // putItem(linkData)
                              // .then(data => {
                              //   console.log("success");
                              //   response(data, 200)
                              // })
                              // .fail(err => {
                              //   console.log(err);
                              //   response(err, 500)
                              // });
                          }));

                      });
                  }
                });
                Promise.all(promises).then(x => {
                  putItem(item[0])
                  .then(data => {
                    console.log("success");
                    response(data, 200)
                  })
                  .fail(err => {
                    console.log(err);
                    response(err, 500)
                  });
                });


            });
            });
        });
    });
}

exports.handler = function (event, context, callback) {
    x();
}
