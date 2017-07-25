var namesJsonUrl = 'https://s3-eu-west-1.amazonaws.com/bechdel-test-names/names.json'
var regexPunctuationRemover = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
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

function getUrl(url) { 
  var urlPrefix  = 'https://content.guardianapis.com';
  var urlSuffix =   '?api-key=cbd423b9-1684-4d52-a9a1-33ea9fecf1bf&show-fields=all';
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

function getColourClass(score) {
  var colorClass = 'w3-green';
    if(score < 33) {
      colorClass = 'w3-red';
    } else if (score < 50) {
      colorClass = 'w3-amber'
    }
    return colorClass;
}


function getMetricScore(femaleCount, totalCount, pointsShare) {
  if(totalCount == 0){
    return Math.round(pointsShare/2);
  }
  return Math.round((femaleCount/totalCount)*pointsShare);
}



function displayResultsOnTopOfArticleElementOnFront (element, scores) {
  var bylineText = scores.totalJournos > 0 ?'<a style="font-size: 12px">Female Journalists: '+ scores.femaleJournos + '/' + scores.totalJournos + '</a><br>' : '<a style="font-size: 12px">Gender of journalist(s) unknown </a><br>';
  var nameText =  '<a style="font-size: 12px">Women mentioned: '+ scores.distinctFemales + '/' + scores.totalMentions + '</a><br>';
  var pronounText =  '<a style="font-size: 12px">Female pronouns: '+ scores.femalePronouns + '/' + scores.totalPronouns + '</a><br>';
  var toolTipText = bylineText + nameText + pronounText;                   
  var bars = '<div class=\"w3-grey\"><div class=\" bechdel-color-bar ' + getColourClass(scores.femaleScore) + '\" style=\"width:' + scores.femaleScore + '%\">' + scores.femaleScore + '%' +
  '</div>';
  var tooltip = '<div class=\"bechdelTooltip\">' + bars + '<span class=\"bechdelTooltiptext\">'+ toolTipText + '</span></div>';
  if(element){
    org_html = element.innerHTML;
    new_html = "<div'>" + org_html + "</div>" + tooltip;
    element.innerHTML = new_html;
  }
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
  return {
    headline: json.response.content.fields.headline ,
    bylines: json.response.content.fields.byline,
    bodyText: json.response.content.fields.bodyText
  }
}

function getArticleComponentsBreakdown(articleComponents ,names) {

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
          var bylines = articleComponents.bylines.replace(' and ', ',').split(',');
          var headLine = articleComponents.headline;
          totals.headline = headLine;
          for(var i = 0; i < bylines.length; i++){
            var journoMetadata = window.nlp(bylines[i], names).people().data();
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
          var peopleMetadata = window.nlp(body, names).people().data();
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

function showScoresArticle() {
 
        var urlPath = getUrlPath(tab.url);
        fetch(urlPath).then(function(reponse) {
          return response.json;
        }).then(function(json){
          articleTest(null,response);    
        });

}

function displayResults() {
function writeResultsToResultsBox(aggregateScores, aggregateBreakdowns) {
function showScoresArticle() {
 
        var urlPath = getUrlPath(tab.url);
        fetch(urlPath).then(function(reponse) {
          return response.json;
        }).then(function(json){
          articleTest(null,response);    
        });

}

function displayError() {
  document.getElementById("overlay").style.display = "none";
 document.getElementById('results').innerHTML = "There was an error. It may be that this article is not available on our public Content API due to sensistive content."

}

function displayResults() {
  document.getElementById("overlay").style.display = "none";
  var femaleMentions = aggregateScores.map(x => x.distinctFemales).reduce((acc, val) => acc + val, 0);
  var totalMentions = aggregateScores.map(x => x.totalMentions).reduce((acc, val) => acc + val, 0);
  var mentionsScore = getMetricScore(femaleMentions,totalMentions,40);
  var femaleJournos = aggregateScores.map(x => x.femaleJournos).reduce((acc, val) => acc + val, 0);
  var totalJournos = aggregateScores.map(x => x.totalJournos).reduce((acc, val) => acc + val, 0);
  var journoScore = getMetricScore(femaleJournos,totalJournos,30);
  var femalePronouns = aggregateScores.map(x => x.femalePronouns).reduce((acc, val) => acc + val, 0);
  var totalPronouns = aggregateScores.map(x => x.totalPronouns).reduce((acc, val) => acc + val, 0);
  var pronounsScore = getMetricScore(femalePronouns, totalPronouns, 30);
  var femalePointsScore = mentionsScore + journoScore + pronounsScore;
  var femaleScore = femaleMentions + femalePronouns + femaleJournos;
  ///var totalScore = totalMentions + totalPronouns + totalJournos;
  var totalScore = 100;

  var journosText = "<strong>Female Journalists:</strong> " + femaleJournos + "/" + totalJournos + ' <p>(' + Math.round(journoScore) + '/30 points)</p>';
  var mentionsText = "<strong>Named women: </strong>" + femaleMentions + "/" + totalMentions + ' <p>(' + Math.round(mentionsScore) + '/40 points)</p>';
  var pronounsText = "<strong>Female pronouns: </strong>" + femalePronouns + "/" + totalPronouns + '<p>(' + Math.round(pronounsScore) + '/30 points)</p>';
  var resultText = "<strong>Overall Bechdel Score: </strong>";
  var scrollMessage = '<i>Scroll down for more details</i>';
  var bars = '<div class=\"w3-grey\"><div class=\" bechdel-color-bar ' + getColourClass(femalePointsScore) + '\" style=\"width:' + femalePointsScore + '%\">' + femalePointsScore + '%</div></div><br>'+scrollMessage +'<br>'; 
  var femaleJournosText = '<br><h2>Female journalists:</h2>';
  var maleJournosText = '<br><h2>Male journalists:</h2>';

  var femaleMentionsText = '<br><h2>Named women:</h2>';
  var maleMentionsText = '<br><h2>Named men:</h2> ';
  aggregateBreakdowns.map(x => x.distinctFemales).filter(z => z != '').map(y => femaleMentionsText += y + ' , ');
  aggregateBreakdowns.map(x => x.distinctMales).filter(z => z != '').map(y => maleMentionsText += y + ' , ');
  aggregateBreakdowns.map(x => x.femaleJournos).filter(z => z != '').map(y => femaleJournosText += y + ' , ');
  aggregateBreakdowns.map(x => x.maleJournos).filter(z => z != '').map(y => maleJournosText += y + ' , ');
  
  var addNameButton = '<br><button style="margin-top:10px;" id="goToNamePage"><i>Name missing/wrong?</i></button>';
  var namesHtml = '<input id="bechdel-name" type="name" value="" placeholder="Enter name" class="name-entry-form" />' +
    '<select id="bechdel-gender" type="gender">' +
    '<option disabled selected value> -- select an option -- </option>' +
    '<option value="MaleName">male</option>'+
    '<option value="FemaleName">female</option>'+
    '<option value="NoName">shouldn\'t be a name</option>'+
    '</select> '+
    '<input type="submit" value="Submit" id="new-name-entry-form" id="fast"/>';


  document.getElementById('results').innerHTML = journosText + mentionsText + pronounsText + resultText + bars + '<br><br>' + femaleMentionsText.substring(0, femaleMentionsText.length - 2) + '<br><br>'+ maleMentionsText.substring(0, maleMentionsText.length - 2) + ' ' + femaleJournosText  + maleJournosText + addNameButton;
  aggregateBreakdowns = [];
  aggregateScores = [];
  var addNameButton = document.getElementById('goToNamePage');
  addNameButton.addEventListener('click', function() {
      document.getElementById('results').innerHTML = namesHtml;
      var submitButton = document.getElementById('new-name-entry-form');
        submitButton.addEventListener('click', function(e) {
          var newName = document.getElementById('bechdel-name').value;
          var newGender = document.getElementById('bechdel-gender').value;
          var regexLettersSpaces =  new RegExp(/^[a-zA-Z\s]*$/);
          if(regexLettersSpaces.test(newName) && newName != '' && newGender != ''){
            fetch(namesJsonUrl).then(function(responses){
                return responses.json();
             }).then(function(json){
                  var payload = json;
                  payload[newName.toLowerCase()] = newGender == 'NoName' ? 'Place' : newGender;
                  var headers = new Headers();
                  headers.append('Content-Type', 'application/json');
                  headers.append('Accept', 'application/json');
                  headers.append('Transfer-Encoding', 'chunked');
                  var request  = new Request(namesJsonUrl, { method: 'PUT',
                   headers: headers,
                   body:JSON.stringify( payload )
                 });
                 fetch(request).then(function(responses){
                  var currentPageUrl = window.location.href;
                    document.getElementById('results').innerHTML = '<a href="'+currentPageUrl+'"> Reload Page </a>';
                })
             })
            

          } else {
            alert("invalid input");
          }
        });
  }); 
}

function runForFront(names) {
  try{
    var elements = document.getElementsByClassName('fc-item__container');
    var elementsArray = Array.prototype.slice.call(elements);
    var links = elementsArray.map(e => getUrl(e.querySelectorAll('a')[0].href));
    var promises = links.map(l => fetch(l));
    var fetchResponses = Promise.all(promises).then(function(responses) {
        return responses.map(r => r.json());
    });
    var jsonResponses = fetchResponses.then(function(responses) {
        Promise.all(responses).then(function(json){
            var aggregateScores = [];
            var aggregateBreakdowns = [];
            for(var i = 0; i < elements.length; i++){ 
              console.log("about to process " + i);
              if(json[i].response.content){
                var articleComponents = getArticleComponentsFromCapiResponse(json[i]);
                var articleBreakdown = getArticleComponentsBreakdown(articleComponents, names);
                var articleScores = getArticleScores(articleBreakdown);
                aggregateBreakdowns.push(articleBreakdown);
                aggregateScores.push(articleScores);
                displayResultsOnTopOfArticleElementOnFront(elements[i], articleScores);
              }
            }
            writeResultsToResultsBox(aggregateScores, aggregateBreakdowns);
        })
    });
  } catch (e) {
    console.log("Error: " + e);
  }
}

function runForArticlePage(names, json) {
    var articleComponents = getArticleComponentsFromCapiResponse(json);
    var articleBreakdown = getArticleComponentsBreakdown(articleComponents, names);
    var articleScore = getArticleScores(articleBreakdown);    
    writeResultsToResultsBox([articleScore], [articleBreakdown]);
}



function run(names) {
  document.body.insertAdjacentHTML('beforeend','<div id="overlay"><div id="loader"></div></div>');
    var urlPath = getUrl(window.location.href);
    fetch(urlPath).then(function(response) {
      console.log(response);
        return response.json();
      }).then(function(json){
      }).then(function(json){
          //This means that it is an article page
      }).then(function(json) {
        if(json.response.status === 'error'){
            displayError();
        } else {
          if(json.response.content){
            runForArticlePage(names, json);
          } 
          //this means it is a front
          else {
            runForFront(names);
          }
        }
        });
}



function addLogoListener(logoButton, infoBox) {
   logoButton.addEventListener('click', function() {
      logoButton.style.display = 'none';
      infoBox.style.display = 'flex';
  });
}

function addCloseListener(closeButton, logoButton, infoBox) {
   closeButton.addEventListener('click', function() {
      logoButton.style.display = 'block';
      infoBox.style.display = 'none';
  });
}

function addCheckButtonListener(checkPageButton){
   checkPageButton.addEventListener('click', function() {
      fetch(namesJsonUrl).then(function(response){
        return response.json();
      }).then(function(names){
        run(names);
      });
    });
}

chrome.storage.sync.get("gu_bechdel_test", function(data){
    var url = window.location.toString();
     
    if(url.includes("guardian")){
      if (data["gu_bechdel_test"]){
          var imagescr = chrome.runtime.getURL("images/icon.png");
          var header = '<br><h2> Article Bechdel Test </h2>';
          var logo = '<div class="bechdel-bar"><span class="bechdel-bar__logo"><img src = "' + imagescr + '""></span></div>';
          var message = '<i> Working for articles, fronts, contributor pages and tag pages</i>';
          var warning = '<br> <br> <p>Note: Some articles with sensitive content do not work currently, as the server does not allow the application to pull the article from our Content API. This may take a little while, especially on fronts. If the loader is stuck, try turning off your ad blocker and reloading the page</p></i>'
          var info = '<div class="info-box"><div class="info-container"><div class = "bechdel-back"><a>Close</a></div></div><div id="results">' +  header + message +  '<button id="checkPage"><i>Analyse page</i></button>'
          + warning + '</div></div>';
          document.body.insertAdjacentHTML('beforeend', logo + info);

          var infoBox = document.getElementsByClassName('info-box')[0];
          var logoButton = document.getElementsByClassName('bechdel-bar')[0];
          var closeButton = document.getElementsByClassName('bechdel-back')[0];
          var checkPageButton = document.getElementById('checkPage');

          addLogoListener(logoButton, infoBox);
          addCloseListener(closeButton, logoButton, infoBox);
          addCheckButtonListener(checkPageButton);
           
      }
    }
});


    






