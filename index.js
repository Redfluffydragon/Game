let startbtn = document.getElementById('startbtn');
let backbtn = document.getElementById('backbtn');
let ssbtnsdiv = document.getElementById('ssbtnsdiv');
let afterStart = document.getElementById('afterStart');
const canvas = document.getElementById('canvas');

let screen = 'start';

canvas.width = window.innerWidth; //set canvas to width of window
let ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];
let q = [];//array for quadrilaterals (one letter for readability)
const corners = ['tl', 'tr', 'br', 'bl', 'tl'];

//changes the number of points in the grid
let gridWidth = 19;
let gridHeight = 9;
//spacing between points on the grid in pixels
let gridSize = 75;
let imgSize = gridSize/2.2; //for sizing trees correctly
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;//center the grid in the window
let gridOffsetY = 50; //offset from top of canvas
canvas.height = 2*gridOffsetY+gridSize*(gridHeight-1)+5; //set canvas height to a minimum given the grid height

//Box-Muller transform (turns a uniform distribution into a standard one)
const boxMuller = () => Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random());

let clickedQuad;
//bool for only adjacent quads or not
let onlyAdj = true;
//the quad you start in
let startQuad = undefined;
//the height of the image (for centering purposes)
let imgHeight;

startbtn.addEventListener('click', beginGame, false);
backbtn.addEventListener('click', back, false);

function beginGame() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';
  start();
  //set timeout so it doesn't add a tree under where you clicked the start button - not a good solution, but it seems to work
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
};

function back() {
  ssbtnsdiv.style.display = '';
  afterStart.style.display = 'none';
  screen = 'start';
}

function randomGrid() {
  //generate random points
  points.length = 0;
  for (let i = 0; i < gridHeight; i++) {
    let column = [];
    for (let j = 0; j < gridWidth; j++) {
      //Use a Box-Muller transform to get a standard distribution for the random offset around each grid point (not sure why it can't just be random)
      let x = Math.round(j*gridSize+gridOffsetX+boxMuller()*8);
      let y = Math.round(i*gridSize+gridOffsetY+boxMuller()*8);
      column.push({
        x: x,
        y: y,
      });
    }
    points.push(column);
  }
  //sort and push into quadrilaterals array
  for (let i = 0; i < gridHeight-1; i++) {
    for (let j = 0; j < gridWidth-1; j++) {

      let gVal = Math.min(((((i+1)*(j+1))/2+20)*4), 255).toString(16); //limit color value to 255 (otherwise it won't go back to that color, but it will go there in the first place for some reason)
      let color = '#'+33+gVal+33;
      //add each to quadrilaterals array
      q.push({
        tl: {
          x: points[i][j].x, 
          y: points[i][j].y
        },
        bl: {
          x: points[i+1][j].x, 
          y: points[i+1][j].y
        },
        br: {
          x: points[i+1][j+1].x, 
          y: points[i+1][j+1].y
        },
        tr: {
          x: points[i][j+1].x, 
          y: points[i][j+1].y
        },
        color: color,
        img: false,
      })
    }
  }
};

function drawQuads() {
  //draw all the quadrilaterals
  for (let i = 0; i < q.length; i++) {
    drawQuad(i);
  }
}

randomGrid();
drawQuads();

//cross products for each side going in a circle - cross point vectors for both points that define each side
//needs to be in a 3d coordinate system, with z being the same for all vectors
//if the cross products are taken going clockwise, in a right-hand coordinate system, if the dot product of a given point vector with each of the line vectors for each of the sides is negative, that point is inside the polygon
//the sign of the dot product is flipped if going counterclockwise or using a left-hand coordinate system

document.addEventListener('click', canvasClick, false);

//handle clicks on the canvas
function canvasClick(e) {
  clickedQuad = checkInside(e);
  //have to do !== false because the first quad is 0
  if (clickedQuad !== false && 
    screen === 'game' && 
    (onlyAdj === false || (onlyAdj === true && adjImg(clickedQuad) === true)) ||
    q[clickedQuad].img === true) {
    drawQuads(clickedQuad);
    quadImg(clickedQuad);
  }
}

function start() {
  if (startQuad === undefined) {
    startQuad = Math.round(Math.random()*q.length);
    quadImg(startQuad);
  }
  startbtn.textContent = 'Resume';
}

//draw one quad
function drawQuad(i, color=q[i].color) {
  q[i].newColor = color;

  ctx.lineWidth = 0.3;
  // ctx.strokeStyle = '#222222'
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(q[i].tl.x, q[i].tl.y);
  ctx.lineTo(q[i].tr.x, q[i].tr.y);
  ctx.lineTo(q[i].br.x, q[i].br.y);
  ctx.lineTo(q[i].bl.x, q[i].bl.y);
  ctx.lineTo(q[i].tl.x, q[i].tl.y);
  ctx.fill();
  ctx.stroke();
}

// toggle image on a quad
function quadImg(quad) {
  if (q[quad].img == false) {
    let img = document.createElement('IMG');
    img.src = 'swampTreeSmall.png';
    imgHeight = 53;
    /* if (Math.random() < 0.4) {
      img.src = 'deadTreeSmall.png';
      imgHeight = 72;
    }
    else {
      img.src = 'tearTreeSmall.png';
      imgHeight = 94;
    } */

    img.classList.add('treeimg');
    img.id = 'img'+quad; //give each one a unique id for removal

    let centerCoords = findCenter(quad);
    img.width = imgSize;
    img.style.left = centerCoords[0] + canvas.offsetLeft - imgSize/2 + boxMuller()*5 + 'px';
    img.style.top = centerCoords[1] + canvas.offsetTop - ((imgHeight/50)*imgSize)/2 + boxMuller()*4 + 'px';
    afterStart.appendChild(img);
    q[quad].img = true;
  }
  else if (q[quad].img === true) {
    let findImg = document.getElementById('img'+quad);
    findImg.parentNode.removeChild(findImg);
    q[quad].img = false;
  }
}

//returns v1 cross v2
function crossProd(v1, v2) {
  //use 1 for the z term in all vectors - needed to make this work, not sure how it works
  return[v1[1] - v2[1], v2[0] - v1[0], v1[0]*v2[1] - v1[1]*v2[0]];
}

//returns v1 dot v2
function dotProd(v1, v2) {
  return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

//check if a click on the canvas is inside a quadrilateral, and if so, which one
function checkInside(e) {
  let tempSideVector;

  for (let j = 0; j < q.length; j++) {
    let dotChecks = [];
    for (let i = 0; i < 4; i++) {
      tempSideVector = crossProd([q[j][corners[i]].x, q[j][corners[i]].y], [q[j][corners[i+1]].x, q[j][corners[i+1]].y]);
      dotChecks.push(dotProd(tempSideVector, [e.clientX, e.clientY - canvas.offsetTop + window.pageYOffset, 1]));
    }
    if (dotChecks[0] > 0 && dotChecks[1] > 0 && dotChecks[2] > 0 && dotChecks[3] > 0) {
      //return number of the quadrilateral clicked on
      return j;
      //return quad-based coordinates of quad clicked on
      // return [j%(gridWidth-1), Math.trunc(j/(gridWidth-1))];
    }
  }
  return false;
}

//return canvas coordinates of the center of a quad
function findCenter(quad) {
  let avgY = (q[quad].tl.y + q[quad].tr.y + q[quad].br.y + q[quad].bl.y)/4;
  let avgX = (q[quad].tl.x + q[quad].tr.x + q[quad].br.x + q[quad].bl.x)/4;
  return [avgX, avgY];
}

//check if the checkQuad is adjacent to the centerQuad - currently not used
function checkAdj(centerQuad, checkQuad) {
  if (checkQuad === centerQuad + 1 || 
    checkQuad === centerQuad - 1 || 
    checkQuad === centerQuad + gridWidth-1 || 
    checkQuad === centerQuad - (gridWidth-1)) {
    return true;
  }
  return false;
}
 
//check if there's an image in an adjacent quad
//wraps around side edges - not intended

function adjImg (checkQuad) {
  if ((q[checkQuad+1] !== undefined && q[checkQuad+1].img ===  true) || 
      (q[checkQuad-1] !== undefined && q[checkQuad-1].img ===  true) || 
    (q[checkQuad + gridWidth-1] !== undefined && q[checkQuad + gridWidth-1].img ===  true) || 
    q[checkQuad - (gridWidth-1)].img ===  true) {
    return true;
  }
  return false;
}