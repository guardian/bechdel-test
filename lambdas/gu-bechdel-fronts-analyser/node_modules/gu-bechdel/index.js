var nlp = require('compromise');
var fetch = require('node-fetch');

var regexPunctuationRemover = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
var namesJsonUrl = 'https://s3-eu-west-1.amazonaws.com/bechdel-test-names/names.json'

function getArticleComponentsBreakdown(articleComponents, names) {

    var totals = {
      headline:'',
      maleJournos: [],
      femaleJournos: [],
      distinctMales: [],
      distinctFemales: [],
      malePronouns: [],
      femalePronouns: []
    }
    try{
          totals.headline = articleComponents.headline;
          var bylines = articleComponents.bylines;
          for(var i = 0; i < bylines.length; i++){
            var journoMetadata = nlp(bylines[i], names).people().data();
            journoMetadata.forEach(function(person){
                if(person.firstName != person.lastName) {
                var name = (person.firstName + ' ' + person.lastName).replace(regexPunctuationRemover, '');
                if(person.genderGuess === 'Male') {
                    totals.maleJournos.push(name);
                }
                if(person.genderGuess === 'Female') {
                    totals.femaleJournos.push(name);
                }
              }
            });
        }

          var body = articleComponents.bodyText;
          var peopleMetadata = nlp(body, names).people().data();
          peopleMetadata.forEach(function(person){
              var nameTexts = person.text.replace(regexPunctuationRemover, '').split(' ');
              var isName = true;
              for(var i = 0; i < nameTexts.length; i++) {
                 if(nameTexts && nameTexts[i][0] && nameTexts[i][0].toUpperCase() !== nameTexts[i][0]) {
                    isName = false;
                 }
              }
              var firstName = person.firstName.replace('\'s', '').replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
              var lastName = person.lastName.replace('\'s', '').replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
              if(firstName != lastName && isName ) {
              var name = (firstName + ' ' + lastName);
              if(person.genderGuess === 'Male') {
                  totals.distinctMales.push(name);
              }
              if(person.genderGuess === 'Female') {
                  totals.distinctFemales.push(name);
              }
            }
          });
          totals.distinctMales = selectDistinct(totals.distinctMales);
          totals.distinctFemales = selectDistinct(totals.distinctFemales);
          totals.malePronouns = (body.toLowerCase().match(/( he )|( him )|( his )|( he\'s )|( he\'d )/g) || []);
          totals.femalePronouns = (body.toLowerCase().match(/( she )|( her )|( hers )| ( she\'s )|( she\'d )/g) || []);
          return totals;
          } catch (e) {
            console.log("error: " + e);
            return null;
          }

  }

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

function getCAPIUrlFromUrl(url, apiKey) {
  var urlPrefix  = 'https://content.guardianapis.com';
  var urlSuffix =  '?api-key=' + apiKey + 'show-fields=byline,bodyText,headline';
  if(url.includes('theguardian.')){
    var matches = url.match(/:\/\/(?:www\.)?(.[^/]+)(.*)/);
    if(matches[2]){
        var urlPath = matches[2].split('?')[0];
        if(urlPath.charAt(0) == '/') {
          return urlPrefix + urlPath + urlSuffix;
        }
    }
    return urlPrefix;
  }
  return urlPrefix;
}

function getCAPIUrlFromPath(path, apiKey) {
  var urlPrefix  = 'https://content.guardianapis.com/';
  var urlSuffix =  '?api-key=' + apiKey + 'show-fields=byline,bodyText,headline';
  return urlPrefix + path + urlSuffix;
}

function getLength(value) {
  if(value){
    return value.length ? value.length : 0;
  } else return 0;
}

function getTotalScores (totals) {
  return {
    headline: totals.headline ? totals.headline : '',
    maleJournos: getLength(totals.maleJournos),
    femaleJournos: getLength(totals.femaleJournos),
    totalJournos: getLength(totals.maleJournos) + getLength(totals.femaleJournos),
    distinctMales: getLength(totals.distinctMales),
    distinctFemales: getLength(totals.distinctFemales),
    totalMentions: getLength(totals.distinctMales) + getLength(totals.distinctFemales),
    malePronouns: getLength(totals.malePronouns),
    femalePronouns: getLength(totals.femalePronouns),
    totalPronouns: getLength(totals.malePronouns) + getLength(totals.femalePronouns),
    femaleScore: 0,
    maleScore: 0,
    totalScore: 0
  }
}


function getMetricScore(femaleCount, totalCount, pointsShare) {
  if(totalCount == 0){
    return Math.round(pointsShare/2);
  }
  return Math.round((femaleCount/totalCount)*pointsShare);
}


function getArticleScores(articleBreakdown) {
    var scores = getTotalScores(articleBreakdown);
    scores.totalScore = 100;
    scores.femaleScore = scores.totalScore > 0 ?
      getMetricScore(scores.femaleJournos, scores.totalJournos, 30)
    + getMetricScore(scores.distinctFemales, scores.totalMentions, 40)
    + getMetricScore(scores.femalePronouns, scores.totalPronouns, 30) : 50;
    return scores;
}


function getArticleComponentsFromCapiResponse(json) {
  var bylines = json.response.content.fields.byline ? json.response.content.fields.byline.replace(' and ', ',').split(',') : '';
  return {
    headline: json.response.content.fields.headline ,
    bylines: bylines,
    bodyText: json.response.content.fields.bodyText
  }
}


function getArticleScoreFromPath(path, names, apiKey) {
  return fetch(getCAPIUrlFromPath(path, apiKey)).then(function(capiResponse){
    return capiResponse.json();
  }).then(function(capiJson){
    var components = getArticleComponentsFromCapiResponse(capiJson);
    var breakdown = getArticleComponentsBreakdown(components, names);
    var score = getArticleScores(breakdown);
    var result = {"breakdown": breakdown, "score": score};        
    return result;
  });
}


module.exports = {getArticleScoreFromPath}



