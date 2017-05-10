function selectDistinct(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = a[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}


var urlPrefix  = 'http://internal.content.guardianapis.com/';
var urlPath = 'commentisfree/2017/mar/09/labour-sdp-play-limehouse-split';
var urlSuffix =   '?show-fields=all';
var url = urlPrefix + urlPath + urlSuffix;
fetch(url)
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        console.log(json);
        var males = [];
        var females = [];
        var regexTagRemover = /(<([^>]+)>)/ig;
        var byLine = json.response.content.fields.byline;
        var journoMetadata = window.nlp(byLine).people().data();
        var body='Content : ' + json.response.content.fields.body.replace(regexTagRemover, '');
        var peopleMetadata = window.nlp(body).people().data();
        var pronouns = window.nlp(body).people().pronoun();
        console.log(peopleMetadata);
        console.log('Written by : ' + byLine);
        console.log(journoMetadata);
        console.log(body);
        peopleMetadata.forEach(function(person){
            if(person.genderGuess === 'Male') {
                males.push(person.firstName + ' ' + person.lastName);
            }
            if(person.genderGuess === 'Female') {
                females.push(person.firstName + ' ' + person.lastName);
            }
        });
        console.log('Journo is a ' + journoMetadata.genderGuess);
        console.log("Number of females mentioned: " + selectDistinct(females).length);
        console.log("Number of males mentioned: " + selectDistinct(males).length);
        console.log(selectDistinct(females));
        console.log(selectDistinct(males));
        var heCount = (body.toLowerCase().match(/( he )|( him )|( his )|( he\'s )|( he\'d )/g) || []).length;
        var sheCount = (body.toLowerCase().match(/( she )|( her )|( hers )| ( she\'s )|( she\'d )/g) || []).length;
        console.log(heCount);
        console.log(sheCount);
        });
