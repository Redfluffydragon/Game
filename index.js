let startbtn = document.getElementById("startbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
let afterStart = document.getElementById("afterStart");
const canvas = document.getElementById("canvas");

canvas.width = window.innerWidth;
let ctx = canvas.getContext("2d");
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];

//height can't be greater than width right now (the grid gets messed up, not sure how to fix)
let gridWidth = 19;
let gridHeight = 8;
//spacing between points on the grid - in pixels?
let gridSize = 75;
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
let gridOffsetY = 25; //offset from top of canvas
canvas.height = 2*gridOffsetY+gridSize*(gridHeight-1);


startbtn.addEventListener("click", start, false);

function start(){
  ssbtnsdiv.style.display = "none";
  afterStart.style.display = "inline";  

  ctx.lineWidth = 5;
  
  //draw all the qudrilaterals
  for (let i = 0; i < gridHeight-1; i++) {
    for (let j = 0; j < gridWidth-1; j++) {
      ctx.moveTo(points[i][j].x, points[i][j].y);
      ctx.lineTo(points[i+1][j].x, points[i+1][j].y);
      ctx.lineTo(points[i+1][j+1].x, points[i+1][j+1].y);
      ctx.lineTo(points[i][j+1].x, points[i][j+1].y);
      ctx.lineTo(points[i][j].x, points[i][j].y);
    }
  }
  ctx.stroke();
};

function randomGrid() {
  points.length = 0;
  for (let i = 0; i < gridHeight; i++) {
    let column = [];
    for (let j = 0; j < gridWidth; j++) {
      let x = j*gridSize+gridOffsetX+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      let y = i*gridSize+gridOffsetY+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      column.push({
        x: x,
        y: y,
      });
    }
    points.push(column);
  }
};
randomGrid();
