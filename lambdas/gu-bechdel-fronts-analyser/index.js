const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const Q = require('kew');
const bechdelScore = require('gu-bechdel');
const namesJsonUrl = 'https://s3-eu-west-1.amazonaws.com/bechdel-test-names/names.json'

const capiKey = process.env.CapiKey;
const pathsString = process.env.Paths;

function formUrls(paths) {
    return paths.map(x => "http://api.nextgen.guardianapps.co.uk" + x + "/lite.json");
}

exports.handler = function (event, context, callback) {
    function putItem(json) {
        const defer = Q.defer();
        var date = new Date();
        const query = event.queryStringParameters;
        const params = {
          TableName: 'bechdel-fronts',
          Item: json
        };


        dynamo.putItem(
            params,
            defer.makeNodeResolver()
        );
        return defer.promise;
    }

    var fetch = require("node-fetch");
    var frontsPaths = require("./paths");
    const pathsArray = pathsString.split(",");

    var urls = formUrls(pathsArray);
    urls.forEach(x => console.log("url  = " + x));
    var promises = urls.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });

    fetch(namesJsonUrl).then(function(response){
      return response.json()
    }).then(function(names){
        fetchResponses.then(function(responses) {
        Promise.all(responses).then(function(json){
            var objects = json.map((element,index) => {
                var item = {};
                var date = new Date();
                item["time"] = date.toString();
                item["front"] = pathsArray[index];
                item["links"] = [];

                if(element.collections){
                    element.collections.map((collection, containerIndex) => {
                        if(collection.content){
                            collection.content.map((content, contentIndex) => {
                              console.log("contentID: " + content.id);
                              console.log(capiKey);
                                bechdelScore.getArticleScoreFromPath(content.id, names, capiKey).then(x => {
                                    var breakdown = x.breakdown;
                                    var score = x.score;
                                    var linkData = {
                                        link : content.id,
                                        containerIndex : containerIndex,
                                        containerName : collection.displayName,
                                        contentIndex : contentIndex,
                                        breakdown: breakdown,
                                        score: score
                                    };
                                    item["links"].push(linkData);
                                });
                            });
                        }
                    });

                }
                console.log("item: " + item["front"]);
                putItem(item)
                .then(data => response(data, 200))
                .fail(err => response(err, 500));
            });
            });
        });
    });
}
