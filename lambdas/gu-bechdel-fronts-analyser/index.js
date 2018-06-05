const { Pool, Client } = require('pg');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const format = require('pg-format');
const bechdelScore = require('gu-bechdel');
const fetch = require("node-fetch");
const namesJsonUrl = 'https://s3-eu-west-1.amazonaws.com/bechdel-test-names/names.json'
const Q = require('kew');
const capiKey = process.env.CapiKey;//'bechdel-batch-lambda'

var nlp = require('compromise');
var regexPunctuationRemover = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;

function makeJson() {
  var json = {
    "type": "service_account",
    "project_id": "bechdel-entity-1528187465032",
    "private_key_id": "f838255a34c8097f6781eaa466938e8b4fddf8b0",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKDC4gko1A7ZtI\nNU+uOo5YOAMwmoErs0y5TooeYD59Krt7cwm98bg9gACT8Gklws30IkTDxnQIu8Kg\nD8KV1T8JTjwJMu3KpZLw5yyIlV/o898GW2rX+mrA9BH26oSTtOEEQv9p6hxwmvne\ny4bEV2M0/9QOc7oXsm+Dsgp/Ct9s32NYMCdORgtVkGSPmHil41smd89yA1jcoIhE\nfVM2rG5YPzv+HBs19ZwdxDGPCgXkmJtqLV1OF+UkrbRy6xz/j4oFeeNQvvfiw6qt\nAm+ODGfj8d2P2QkPCa//fOINs7icU2j5RrzvGNP25A6a5r/akvaXlP6iBt8onuXM\nEsKkd/nbAgMBAAECggEAC4OSdxRwo2nd0jctPfnRtfNKDqzdEG4KUx7Hq+jnT9+S\nQGm3s/oOQ1ioeOpXqDKDUvIitDKM1xja8Xq5AwdurTAUlTIwgXVsoGay/Wq7e8H/\nuhQD3tdDI5E79o86eOaqCS9sOeGlW9OyOCo4K24zcT8JP+Iotfr/mLZjG5jaBcgL\nzNnD6uCgxT0b4VaHXok0XdON50NO2Ns+mRaj2kpydiousI/VRGRfkAjzH8eZUP7p\nWxsgUfE9654H7cpV/fTgaljCzkbLV0EClAMv3Afo0THDky2E9uBDtxB7y5eof4cq\np2pHMjoC0d0LQz3kHy997CVg+bopVVqWHji36dtxOQKBgQDrovGKnlCqis9Uc2lh\nhkWa9jR/a9xEZpoXWYsu8oxkNpOcZgfnTgf9GEyNReI121FB7S4tIiO73nTlmdvX\nuMSaCKdhJuh4wC/TY9YnK1DjetGZx0Ie1HarpeYVEqp6/muMcZ9N5vUePa/Kf7XP\ncPZrNNmKg5yQO/OFeVtwydN+hQKBgQDbgiOU5cdb3abZwHX6LEwM7brOkpbNb5/f\n8wmeKlTOwhAww0aslyMUlsyCrXUYvhFrOw/GyETR6sZlg72lq+M56fXFFNda7f0I\nEctHfUuVBWQNllG2fRPh28iaqZ8Jess+5I7mukRJIC3zfvvUhNJG9lweBIZb7Db2\nZLc7be703wKBgDBP91Ahh45/6WR6SUf6nLjZ9AeQGNhZZQyWimf0yP4fBoLRlJtD\nL3YgDkoE4w2ByxZGR+pvDn6NbNBKjH2dX4npblAIBzACz4t688SSKAKMAv+RkCf8\nDdzBpfv6GMQg9/IStcPmL6mkoi9VofRHR+7RJi01MNuNvy9Fo47rgpZ1AoGAHk/Y\nTgV1BDCVi9hR8lwPnHFvrHr9rBzP/QL4vwilcW/HAJTWu5qbU4qHbzw4wVPt39rm\nENMy/bHn97i7hZc455RxRefc3Uej+2tJoPOibk+yQ1YQrpyTFEtfZkwqFAsK6gJx\n4Vaze02gStGsQOqehwIaMmL5ktQJuvipfOFvcA0CgYEA0ftgCcHX2K5MwWVQNyiD\nV3rPfKbD8nWZJbjIv5RQi/LIDI2Hmdtb86BbKyALufgeRUMOf7VA2Jm+Lrt7fNBY\nmmyCDspMWBoohKOAriXApSH9KRvWkzD1WbIzUmCTyHKUM3v4Okml9tmSjSSsO5DF\nMeN9iyA3FJzqFo6y1GfrThc=\n-----END PRIVATE KEY-----\n",
    "client_email": "starting-account-1b1tpn7622m7@bechdel-entity-1528187465032.iam.gserviceaccount.com",
    "client_id": "101356725408225943524",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-1b1tpn7622m7%40bechdel-entity-1528187465032.iam.gserviceaccount.com"
  }

  return JSON.stringify(json);
}


function getArticleComponentsBreakdown(articleComponents, names, people) {

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



          var nlpPeople = people.map(x => nlp(x.name, names).people().data()).filter(y => y.length !== 0);
          nlpPeople.forEach(function(p){
              var person = p[0];
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
  var urlSuffix =  '?api-key=' + apiKey + '&show-fields=byline,bodyText,headline';
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
  var urlSuffix =  '?api-key=' + apiKey + '&show-fields=byline,bodyText,headline';
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
    scores.maleScore = scores.totalScore > 0 ?
      getMetricScore(scores.maleJournos, scores.totalJournos, 30)
    + getMetricScore(scores.distinctMales, scores.totalMentions, 40)
    + getMetricScore(scores.malePronouns, scores.totalPronouns, 30) : 50;
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


function getPeopleInArticle(text) {
  const language = require('@google-cloud/language');
  const client = new language.LanguageServiceClient();
  const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

   return client
      .analyzeEntities({document: document})
      .then(results => {
        return results[0].entities.filter(x => x.type==='PERSON' && x.name != x.name.toLowerCase());
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
}


function getArticleScoreFromPath(path, names, apiKey) {

  return fetch(getCAPIUrlFromPath(path, apiKey)).then(function(capiResponse){
    return capiResponse.json();
  }).then(function(capiJson) {
    try {
      var components = getArticleComponentsFromCapiResponse(capiJson);
      return getPeopleInArticle(components.bodyText).then(people => {
        var breakdown = getArticleComponentsBreakdown(components, names, people);
        var score = getArticleScores(breakdown);
        var result = {"breakdown": breakdown, "score": score};
        return result;
      });
    } catch (e) {
      return {"breakdown": "error", "score":-1 }
    }
  }).catch(e => {
    console.log(e);
    return {"breakdown": "error", "score":-1 }
  }).then(function(score){
    return score;
  })
}

function formUrls(paths) {
    return paths.map(x => "http://api.nextgen.guardianapps.co.uk" + x + "/lite.json");
}

function requestFrontsFromCAPI() {
    var promises = urls.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });
    return fetchResponses;
}

function insertIntoPostgres(item){
  const defer = Q.defer();
  const pool = new Pool({
    user: 'bechdelmaster',
    host: 'bechdel-fronts.cii9twl865uw.eu-west-1.rds.amazonaws.com',
    database: 'fronts',
    password: process.env.PGPASSWORD,//'root1234';
    port: 5432,
  })
  var values = [];
  //console.log(item)
  item.map(x => values.push([uuidv1(), x.time, x.front, x.headline, x.link, x.containerIndex, x.containerName, x.contentIndex, x.maleJournalistCount, x.femaleJournalistCount, x.distinctMales, x.distinctFemales, x.malePronouns, x.femalePronouns, x.femaleScore, x.maleScore, x.totalScore, x.breakdown]));
  var queryText = format('INSERT INTO linksTwo (id, time, front, headline,link,containerIndex, containerName, contentIndex,maleJournalistCount, femaleJournalistCount, distinctMales,distinctFemales,malePronouns, femalePronouns,femaleScore, maleScore,totalScore,breakdown) VALUES %L', values);
  //console.log(queryText);
  pool.query(queryText, (err, res) => {
    console.log(err, res);
    pool.end();
  });
}

function requestFrontsFromCAPI(urls) {
    var promises = urls.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });
    return fetchResponses;
}


function x(event) {
  try{
    var dir = '/tmp';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      fs.writeFileSync("/tmp/creds.json", makeJson());
      console.log("all works")
  }catch (e){
      console.log("Cannot write file ", e);
  }

  const pathsString = event && event["paths"]
    ? event["paths"] : process.env.Paths;
  const pathsArray = pathsString.split(",");

  var urls = formUrls(pathsArray);
  var fetchResponses = requestFrontsFromCAPI(urls);

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

                      promises.push(getArticleScoreFromPath(content.id, names, capiKey).then(x => {
                            var breakdown = x.breakdown;
                            var score = x.score;
                            if(score != -1){
                              var linkData = {
                                time: date,
                                front: pathsArray[index],
                                headline: score.headline,
                                link: content.id,
                                containerIndex: containerIndex,
                                containerName: collection.displayName,
                                contentIndex: contentIndex,
                                maleJournalistCount: score.maleJournos ,
                                femaleJournalistCount: score.femaleJournos,
                                distinctMales: score.distinctMales,
                                distinctFemales: score.distinctFemales,
                                malePronouns: score.malePronouns,
                                femalePronouns: score.femalePronouns,
                                femaleScore: score.femaleScore,
                                maleScore: score.maleScore,
                                totalScore: score.totalScore,
                                breakdown: '',
                              };
                              item.push(linkData);
                            }
                            return true;
                        }));

                    });
                }
              });
              Promise.all(promises).then(x => {
                  insertIntoPostgres(item).then(x => {
                  })
              });


          });
          });
      });
  });
}

exports.handler = function (event, context, callback) {
    x(event);
}
