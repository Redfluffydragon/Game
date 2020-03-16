let youFool = document.getElementById("youFool");
let startbtn = document.getElementById("startbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];


startbtn.addEventListener("click", start, false);

function start(){
  document.body.style.background = "#ff00c8";
  youFool.style.display = "block";
  ssbtnsdiv.style.display = "none";

  ctx.lineWidth = 5;
  ctx.moveTo(points[0].x, points[0].y);
  for (var j = 0; j < 8; j++) {
    for (var i = 0; i < 8; i++) {
      if(i !== 7){
        ctx.lineTo(points[i+1+j*8].x, points[i+1+j*8].y);
      }
      else {
        if (j < 7) ctx.moveTo(points[i+1+j*8].x, points[i+1+j*8].y);
      }
    }
  }

  for (let j = 0; j < 7; j++) {
    ctx.moveTo(points[j*8].x, points[j*8].y);
    for(let i = 0; i < 8; i++) {
      ctx.moveTo(points[i+j*8].x, points[i+j*8].y)
      ctx.lineTo(points[i+8+j*8].x, points[i+8+j*8].y);
    }
  }
  ctx.stroke();
};

function randomGrid() {
  points.length = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      var x = i*50+25+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      var y = j*50+25+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      points.push({
        x: x,
        y: y,
      });
    }
  }
}
randomGrid();

/* ctx.moveTo(points[0].x, points[0].y);

for (var j = 0; j < 8; j++) {
  for (var i = 1; i < 9; i++) {
      if(i%8 !== 0){
          ctx.lineTo(points[i-1+j*8+1].x, points[i-1+j*8+1].y);
      }
      else {
        ctx.moveTo(points[i-1+j*8].x, points[i-1+j*8].y);
      }
  }
} */
