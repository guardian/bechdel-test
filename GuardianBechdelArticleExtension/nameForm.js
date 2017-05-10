$(document).on("click", ":submit", function(e) {
  var nameEntry = ($('#name').val());
  var genderEntry = ($('#gender').val());
   var storage = localStorage.getItem(nameEntry);
  if (storage === null) {
    localStorage.setItem(nameEntry, genderEntry);
  }
});