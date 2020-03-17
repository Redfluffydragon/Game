let youFool = document.getElementById("youFool");
let startbtn = document.getElementById("startbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
let ctx = canvas.getContext("2d");
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];

//height can't be greater than width right now (the grid gets messed up, not sure how to fix)
let gridHeight = 15;
let gridWidth = 10;
//spacing between points on the grid - in pixels?
let gridSize = 75;
//offset from left of top left point in the grid
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/4; //not sure why it's devided by 4 and not 2


startbtn.addEventListener("click", start, false);

function start(){
  ssbtnsdiv.style.display = "none";

  ctx.lineWidth = 5;
  // ctx.moveTo(points[0][0].x, points[0][0].y);
  // let i = 99;
  // console.log(i, i%(gridHeight-1))
  for (let i = 0; i < gridWidth-1; i++) {
    for (let j = 0; j < gridHeight-1; j++) {
      ctx.moveTo(points[i][j].x, points[i][j].y);
      ctx.lineTo(points[i+1][j].x, points[i+1][j].y);
      ctx.lineTo(points[i+1][j+1].x, points[i+1][j+1].y);
      ctx.lineTo(points[i][j+1].x, points[i][j+1].y);
      ctx.lineTo(points[i][j].x, points[i][j].y);
      ctx.moveTo(points[i][j].x, points[i][j].y);
    }
  }

  /* for (let i = 0; i < points.length-gridHeight-1; i++) {
    ctx.moveTo(points[i].x, points[i].y);
    // ctx.beginPath();
    if ((i-Math.abs(Math.trunc(i/(gridHeight-1))-1))%(gridHeight-1) === 0 && i !== 1) {
      ctx.moveTo(points[i].x, points[i].y);
    }
    else {
      ctx.lineTo(points[i+gridHeight].x, points[i+gridHeight].y);
      ctx.lineTo(points[i+1+gridHeight].x, points[i+1+gridHeight].y);
      ctx.lineTo(points[i+1].x, points[i+1].y);
      ctx.lineTo(points[i].x, points[i].y);
    }
    // ctx.closePath();
  } */

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
    let column = [];
    for (let j = 0; j < gridHeight; j++) {
      let y = i*gridSize+25+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      let x = j*gridSize+gridOffsetX+Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random())*8;
      column.push({
        x: x,
        y: y,
      });
    }
    points.push(column);
  }
};
randomGrid();
