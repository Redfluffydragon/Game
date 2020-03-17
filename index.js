let startbtn = document.getElementById("startbtn");
let backbtn = document.getElementById("backbtn");
let ssbtnsdiv = document.getElementById("ssbtnsdiv");
let afterStart = document.getElementById("afterStart");
const canvas = document.getElementById("canvas");

canvas.width = window.innerWidth; //set canvas to width of window
let ctx = canvas.getContext("2d");
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];
let quadrilaterals = [];

//changes the number of points in the grid
let gridWidth = 19;
let gridHeight = 8;
//spacing between points on the grid in pixels
let gridSize = 75;
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;//center the grid in the window
let gridOffsetY = 25; //offset from top of canvas
canvas.height = 2*gridOffsetY+gridSize*(gridHeight-1)+5; //set canvas height to a minimum given the grid height

startbtn.addEventListener("click", start, false);
backbtn.addEventListener("click", back, false);

function start() {
  ssbtnsdiv.style.display = "none";
  afterStart.style.display = "inline"; 
};

function back() {
  ssbtnsdiv.style.display = "";
  afterStart.style.display = "none";  
}

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

function drawQuads() {
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = '#222222'

  //draw all the quadrilaterals
  for (let i = 0; i < gridHeight-1; i++) {
    for (let j = 0; j < gridWidth-1; j++) {
      let color = (((i*j)+20)*4).toString(16);
      // let color = (Math.trunc(Math.random()*180+75).toString(16));

      ctx.fillStyle = '#'+33+color+33;
      ctx.beginPath();
      ctx.moveTo(points[i][j].x, points[i][j].y);
      ctx.lineTo(points[i+1][j].x, points[i+1][j].y);
      ctx.lineTo(points[i+1][j+1].x, points[i+1][j+1].y);
      ctx.lineTo(points[i][j+1].x, points[i][j+1].y);
      ctx.lineTo(points[i][j].x, points[i][j].y);
      ctx.fill();
      ctx.stroke();
      
      //add each to quadrilaterals array
      quadrilaterals.push({
        tl: {
          x: points[i][j].x, 
          y: points[i][j].y
        },
        tr: {
          x: points[i+1][j].x, 
          y: points[i+1][j].y
        },
        br: {
          x: points[i+1][j+1].x, 
          y: points[i+1][j+1].y
        },
        bl: {
          x: points[i][j+1].x, 
          y: points[i][j+1].y
        }
      })
    }
  }
}

randomGrid();
drawQuads();

canvas.addEventListener("click", e => {
  console.log(e.clientX, e.clientY-canvas.offsetTop); //should give mouse position relative to top left corner of canvas
  
}, false);