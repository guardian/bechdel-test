function formUrls(paths) {
	return paths.map(x => "http://api.nextgen.guardianapps.co.uk" + x + "/lite.json");
}

var fetch = require("node-fetch");
var frontsPaths = require("./paths");
var paths = frontsPaths.pathsList;
var urls = formUrls(paths);
var i = 0;
var promises = urls.map(l => fetch(l));
var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });

var jsonResponses = fetchResponses.then(function(responses) {
    Promise.all(responses).then(function(json){
    	var pathWithLinks = {};
    	var objects = json.map((element,index) => {
    		pathWithLinks[paths[index]] = [];
    		element.collections.map((collection, containerIndex) => {
    			collection.content.map((content, contentIndex) => {
    			 	pathWithLinks[paths[index]].push({
    			 		"link" : content.id,
    			 		"containerIndex" : containerIndex,
    			 		"contentIndex" : contentIndex
    			 	});
    			});
    		});
    	}); 
    	   	
    	console.log(pathWithLinks["/uk"])	;
    });
});    
