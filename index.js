let youFool = document.getElementById("youFool");
let startbtn = document.getElementById("startbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];

let gridWidth = 8;
let gridHeight = 8;
//spacing between points on the grid - in pixels?
let gridSize = 75;


startbtn.addEventListener("click", start, false);

function start(){
  // document.body.style.background = "#ff00c8";
  // youFool.style.display = "block";
  ssbtnsdiv.style.display = "none";

  ctx.lineWidth = 5;
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < (gridWidth-1)*(gridHeight-1)+1; i++) {
    ctx.moveTo(points[i].x, points[i].y);
    // ctx.beginPath();
    if (i%(gridHeight-1) !== 0 || i === 0) {
      ctx.lineTo(points[i+gridHeight].x, points[i+gridHeight].y);
      ctx.lineTo(points[i+1+gridHeight].x, points[i+1+gridHeight].y);
      ctx.lineTo(points[i+1].x, points[i+1].y);
      ctx.lineTo(points[i].x, points[i].y)
    }
    else {
      ctx.moveTo(points[i].x, points[i].y);
    }
    console.log(i);
    // ctx.closePath();
  }

  /* //Lines down the grid
  for (let j = 0; j < gridWidth; j++) {
    for (let i = 0; i < gridHeight; i++) {
      if(i !== gridHeight-1){
        ctx.lineTo(points[i+1+j*gridHeight].x, points[i+1+j*gridHeight].y);
      }
      else {
        if (j < gridWidth-1) ctx.moveTo(points[i+1+j*gridHeight].x, points[i+1+j*gridHeight].y);
      }
    }
  }

  //Lines across the grid
  for (let j = 0; j < gridWidth-1; j++) {
    ctx.moveTo(points[j*gridHeight].x, points[j*gridHeight].y);
    for(let i = 0; i < gridHeight; i++) {
      ctx.moveTo(points[i+j*gridHeight].x, points[i+j*gridHeight].y)
      ctx.lineTo(points[i+gridHeight+j*gridHeight].x, points[i+gridHeight+j*gridHeight].y);
    }
  } */
  ctx.stroke();
};

function randomGrid() {
  points.length = 0;
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      var x = i*gridSize+25+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      var y = j*gridSize+25+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      points.push({
        x: x,
        y: y,
      });
    }
  }
}
randomGrid();