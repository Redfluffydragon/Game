let youFool = document.getElementById("youFool");
let startbtn = document.getElementById("startbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
startbtn.addEventListener("click", start, false);
function start(){
  document.body.style.background = "#ff00c8";
  youFool.style.display = "block";
  ssbtnsdiv.style.display = "none";
};