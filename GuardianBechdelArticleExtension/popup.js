
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.storage.sync.set({
            'gu_bechdel_test': true
        }, function() {});
    }
});

document.addEventListener('DOMContentLoaded', function(){

    var input = document.getElementById("myonoffswitch");
    chrome.storage.sync.get("gu_bechdel_test", function(data){
       if (data["gu_bechdel_test"]){
            input.checked = true;
        } else {
            input.checked = false;
        }
      });

    input.addEventListener("change", function(){
        chrome.storage.sync.set({gu_bechdel_test: input.checked});
    });
});
