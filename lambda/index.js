const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const Q = require('kew');

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
    var paths = frontsPaths.pathsList;
    var urls = formUrls(paths);
    var promises = urls.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
            return responses.map(r => r.json());
        });
    var jsonResponses = fetchResponses.then(function(responses) {
        Promise.all(responses).then(function(json){
            var objects = json.map((element,index) => {
                var item = {};
                var date = new Date();
                item["time"] = date.toString();
                item["front"] = paths[index];
                item["links"] = [];
                if(element.collections){
                    element.collections.map((collection, containerIndex) => {
                        if(collection.content){
                            collection.content.map((content, contentIndex) => {
                                //add         
                                var linkData = {
                                    link : content.id,
                                    containerIndex : containerIndex,
                                    containerName : collection.displayName,
                                    contentIndex : contentIndex
                                };
                                item["links"].push(linkData);                                                        
                            });
                        }
                    });
    
                }
                putItem(item) 
                .then(data => response(data, 200))
                .fail(err => response(err, 500));
            }); 
                       
        });
    });   
} 
