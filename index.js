const startbtn = document.getElementById('startbtn');
const backbtn = document.getElementById('backbtn');
const ssbtnsdiv = document.getElementById('ssbtnsdiv');
const afterStart = document.getElementById('afterStart');
const canvas = document.getElementById('canvas');

const widthSlider = document.getElementById('widthSlider');
const widthNum = document.getElementById('widthNum');
let treeImgs = document.getElementsByClassName('treeimg');

let screen = 'start';

canvas.width = window.innerWidth; //set canvas to width of window
let ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];
let q = [];//array for quadrilaterals (one letter for readability, or at least that's my excuse)
const corners = ['tl', 'tr', 'br', 'bl', 'tl'];

const coordSigns = [1, 1, -1, -1, 1];
const biomeFixAlign = [0, -1, 0, 1];

//colors for each of the biomes
let biomeColors = {
  swamp: 0x151515, //this gets subtracted from the default color 
}

//image data for each of the trees
let biomeTrees = {
  swamp: {
    src: 'swampTreeSmall.png',
    height: 53,
    width: 50,
  },
  mountain: {
    src: 'pineTreeSmall.png',
    height: 63,
    width: 50,
  }
}

//changes the number of points in the grid
let gridWidth = 19;
let gridHeight = 9;
//spacing between points on the grid in pixels
let gridSize = 75;
let imgSize = gridSize/2.2; //for sizing trees correctly

let gridOffsetY = 50; //offset from top of canvas
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2; //center the grid in the window
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

function gotchem(item, defalt, type=localStorage) {
  let getem = type.getItem(item);
  if (getem !== null && JSON.parse(getem) !== undefined) { return JSON.parse(getem); }
  return defalt;
};

startbtn.addEventListener('click', start, false);
backbtn.addEventListener('click', back, false);

//resize the grid with the slider
widthSlider.addEventListener('input', () => {
  widthNum.value = widthSlider.value-1;
  gridWidth = widthSlider.value;
  gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  randomGrid();
  drawQuads();
}, false);

//move the images - done by quad number right now, so they move around
//only on mouseup because it's pretty slow
widthSlider.addEventListener('mouseup', () => {
  for (let i = 0; i < treeImgs.length; i++) {
    let re = /(?<=:)([0-9])(?=:)/g
    let quadCoords = treeImgs[i].id.match(re);
    let quadNum = quadRef([parseInt(quadCoords[0]), parseInt(quadCoords[1])]); //get quad number from last two characters if image id
    if (q[quadNum]) {
      centerImg(quadNum, treeImgs[i]);
    }
    else {
      let findImg = document.getElementById(treeImgs[i].id);
      findImg.parentNode.removeChild(findImg);
    }
  };
}, false);

/* 
window.addEventListener('resize', () => {
  gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
  canvas.width = window.innerWidth;
  drawQuads();
}, false);
 */
//hide start screen and show canvas, set starting quad
function start() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';

  if (startQuad === undefined) {
    startQuad = Math.round(Math.random()*q.length);
    quadImg(startQuad);
  }
  startbtn.textContent = 'Resume';
  //set timeout so it doesn't add a tree under where you clicked the start button - not a good solution, but it seems to work
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
};

//go back to the starting screen
function back() {
  ssbtnsdiv.style.display = '';
  afterStart.style.display = 'none';
  screen = 'start';
}

//generate a semirandom grid and sort into quadrilateral points in q array
function randomGrid() {
  //generate random points
  points = [];
  points.length = 0;
  q.length = 0;
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
      let color = parseInt(33+gVal+33, 16);
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
        biome: 'default',
        grayVal: gVal,
      })
    }
  }
};

//go through q array and draw all quads
function drawQuads() {
  //draw all the quadrilaterals
  for (let i = 0; i < q.length; i++) {
    drawQuad(i);
  }
}

randomGrid(); //generate the random point grid

//set up biomes in random order so either one can be on top
if (Math.random() < 0.5) {
  biome(4, 'swamp');
  biome(4, 'mountain');
}
else {
  biome(4, 'mountain');
  biome(4, 'swamp');
}

drawQuads(); //draw all the quads


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
    (screen === 'game' && 
    (onlyAdj === false || 
    (onlyAdj === true && 
      adjImg(clickedQuad) === true)) ||
    q[clickedQuad].img === true)) {
      drawQuads(clickedQuad);
      quadImg(clickedQuad);
  }
}

//draw one quad
function drawQuad(i, color=q[i].color) {
  if (q[i].biome === 'swamp') {
    color = '#' + (color - biomeColors[q[i].biome]).toString(16);
  }
  else if (q[i].biome === 'mountain') {
    color = '#' + q[i].grayVal + q[i].grayVal + q[i].grayVal;
  }
  else {
    color = '#' + color.toString(16);
  }
  q[i].newColor = color;

  ctx.fillStyle = color;
  ctx.lineWidth = 0.3;

  ctx.beginPath();
  ctx.moveTo(q[i].tl.x, q[i].tl.y);
  ctx.lineTo(q[i].tr.x, q[i].tr.y);
  ctx.lineTo(q[i].br.x, q[i].br.y);
  ctx.lineTo(q[i].bl.x, q[i].bl.y);
  ctx.lineTo(q[i].tl.x, q[i].tl.y);
  ctx.fill();
  ctx.stroke();
}

// center an image in a quad
function centerImg(quad, img) {
  let centerCoords = findCenter(quad);
  img.width = imgSize;
  img.style.left = centerCoords[0] + canvas.offsetLeft - imgSize/2 + boxMuller()*5 + 'px';
  img.style.top = centerCoords[1] + canvas.offsetTop - ((imgHeight/50)*imgSize)/2 + boxMuller()*4 + 'px';
}

// toggle image on a quad
function quadImg(quad, image='default') {
  let coords = quadRef(quad);
  if (q[quad].img == false) {
    let img = document.createElement('IMG');
    if (image === 'default') {
      if (q[quad].biome === 'default') {
        img.src = 'tearTreeSmall.png';
        imgHeight = 94;
        /* if (Math.random() < 0.4) {
          img.src = 'deadTreeSmall.png';
          imgHeight = 72;
        }
        else {
          img.src = 'tearTreeSmall.png';
          imgHeight = 94;
        } */
      }
      else {
        img.src = biomeTrees[q[quad].biome].src;
        imgHeight = biomeTrees[q[quad].biome].height;
      }
    }
    else {
      img.src = image;
    }
    img.classList.add('treeimg');
    img.id = `img:${coords[0]}::${coords[1]}:`; //give each one a unique id for removal

    centerImg(quad, img);
    afterStart.appendChild(img);
    q[quad].img = true;
  }
  else if (q[quad].img === true) {
    let findImg = document.getElementById(`img:${coords[0]}::${coords[1]}:`);
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
      (q[checkQuad + (gridWidth-1)] !== undefined && q[checkQuad + gridWidth-1].img ===  true) || 
      (q[checkQuad - (gridWidth-1)] !== undefined && q[checkQuad - (gridWidth-1)].img ===  true)) {
    return true;
  }
  return false;
}

//switches between coordinates and numbers for quads
function quadRef(quad) {
  //if input a number
  if (quad[1] === undefined) {
    return [quad%(gridWidth-1), Math.trunc(quad/(gridWidth-1))];
  }
  //if input quad coordinates
  else {
    return quad[0]+quad[1]*(gridWidth-1);
  }
}

//generate a biome
function biome(size, type='default') {
  size --; //correct for the center one already being counted
  let center = Math.round(Math.random()*q.length);
  let centerCoords = quadRef(center);
  q[center].biome = type;
  //add some sort of randomness?

  //array of coordinates for biome
  let biome = [];
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size-i; j++) {
        let tempQuad = quadRef([centerCoords[0]+((size-i)-j)*coordSigns[k]+biomeFixAlign[k], centerCoords[1]+j*coordSigns[k+1]+biomeFixAlign[k]]);
        if (q[tempQuad] !== undefined) {
          biome.push(tempQuad);
          q[tempQuad].biome = type;
          // drawQuad(tempQuad, 'black');
        }
      }
    }
  }
}