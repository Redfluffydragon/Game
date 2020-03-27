/**
 To do:
 * Add saplings - setTimeout for them growing up? (how performant is that, and how much does it matter?)
   * can't plant more trees next to a sapling, only full grown trees
 * Add seeds that you aquire somehow, that you can't plant trees of different types without the right seeds
 *   - store?
 */

const startbtn = document.getElementById('startbtn');
const howtobtn = document.getElementById('howtobtn');
const backbtn = document.getElementById('backbtn');
const resumebtn = document.getElementById('resumebtn');
const ssbtnsdiv = document.getElementById('ssbtnsdiv');
const howtodiv = document.getElementById('howtodiv');
const afterStart = document.getElementById('afterStart');
const canvas = document.getElementById('canvas');

const widthSlider = document.getElementById('widthSlider');
const widthNum = document.getElementById('widthNum');
const widthInput = document.getElementById('widthInput');
const widthWarning = document.getElementById('widthWarning');
let treeImgs = document.getElementsByClassName('treeimg');

function gotchem(item, defalt, type=localStorage) {
  let getem = type.getItem(item);
  let parsem = JSON.parse(getem);
  if (getem !== null && parsem !== undefined) return parsem;
  return defalt;
};

//returns v1 cross v2 for 3D vectors
//use 1 for the z term in all vectors - needed to make this work, not sure how it works
const crossProd = (v1, v2) => [v1[1] - v2[1], v2[0] - v1[0], v1[0]*v2[1] - v1[1]*v2[0]];

//returns v1 dot v2
const dotProd = (v1, v2) => v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];

//maps a value from one range to another (taken from arduino map function)
const mapVal = (val, fromLow, fromHigh, toLow, toHigh) => (val - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;

//Box-Muller transform (turns a uniform distribution into a standard one)
const boxMuller = () => Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random());

//for the canvasclick function so it doesn't do anything while not on the game screen
let screen = 'start';

canvas.width = window.innerWidth; //set canvas to width of window
let ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
let points = [];
let quads = []; //array for quadrilaterals (one letter for readability, or at least that's my excuse)
const corners = ['tl', 'tr', 'br', 'bl', 'tl'];

//for generating biomes
const coordSigns = [1, 1, -1, -1, 1];
const biomeFixAlign = [0, -1, 0, 1];

//data for each of the biomes (image, color & seed t/f)
let biomes = {
  default: {
    src: 'tearTreeSmall.png',
    height: 94,
    width: 50,
    seed: true,
  },
  jungle: {
    src: 'jungleTreeSmall.png',
    height: 53,
    width: 50,
    color: 0x1b1b1b, //this gets subtracted from the default color
    seed: false,
  },
  mountain: {
    src: 'pineTreeSmall.png',
    height: 63,
    width: 50,
    seed: false,
  },
  swamp: {
    src: 'mangroveTreeSmall.png',
    height: 54,
    width: 50,
    seed: false,
  },
}
let biomeKeys = Object.keys(biomes).slice(1); //remove the default biome so it doesn't generate a biome that's just the default

//variable for blind counting of trees
let treeNum = 0;

//changes the number of points in the grid
let gridWidth = gotchem('gridWidth', 19);
let maxGridWidth = 21;
let gridHeight = 9;
//spacing between points on the grid in pixels
let gridSize = 75;
let imgSize = gridSize/2.2; //for sizing trees correctly

let gridOffsetY = 50; //offset from top of canvas
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2; //center the grid in the window
let newOffsetX = 0;
canvas.height = 2*gridOffsetY+gridSize*(gridHeight-1)+5; //set canvas height to a minimum given the grid height

window.addEventListener('load', () => {
  widthNum.value = gridWidth-1;
  widthSlider.value = gridWidth;
}, false);

startbtn.addEventListener('click', start, false);
howtobtn.addEventListener('click', howto, false);
backbtn.addEventListener('click', back, false);
resumebtn.addEventListener('click', resume, false);

//change grid size and offsets with the slider
widthSlider.addEventListener('input', () => {
  widthNum.value = widthSlider.value-1; 
  gridWidth = parseInt(widthSlider.value);
  localStorage.setItem('gridWidth', JSON.stringify(gridWidth));
  gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
}, false);

//same with text input
widthNum.addEventListener('input', () => {
  if (parseInt(widthNum.value)+1 > maxGridWidth) {
    widthNum.value = maxGridWidth-1;
  }
  widthSlider.value = parseInt(widthNum.value)+1; 
  gridWidth = parseInt(widthNum.value)+1;
  localStorage.setItem('gridWidth', JSON.stringify(gridWidth));
  gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
}, false);

//resize the canvas width and move the grid side to side with window resizes
window.addEventListener('resize', () => {
  newOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2-gridOffsetX;
  canvas.width = window.innerWidth;
  drawQuads();
  for (let i = 0; i < treeImgs.length; i++) {
    let re = /(?<=:)([0-9]+)(?=:)/g
    let quadCoords = treeImgs[i].id.match(re);
    let quadNum = quadRef([parseInt(quadCoords[0]), parseInt(quadCoords[1])]); //get quad number from last two characters if image id
    centerImg(quadNum, treeImgs[i]);
  }
}, false);

document.addEventListener('click', canvasClick, false);

//hide start screen and show canvas, set starting quad, and replace start button with resume button
function start() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';
  resumebtn.style.display = 'block';
  startbtn.style.display = "none";
  randomGrid(); //generate the random point grid

  //set up biomes in random order so either one can be on top
  for (let i = biomeKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [biomeKeys[i], biomeKeys[j]] = [biomeKeys[j], biomeKeys[i]];
  }
  for (let i = 0; i < biomeKeys.length; i++) {
    biome(4, biomeKeys[i]);
  }

  drawQuads(); //draw all the quads

  //Put a tree on a random quad so you can put trees in
  let startQuad;
  do {
    startQuad = Math.round(Math.random()*quads.length);
  }
  while (quads[startQuad].biome !== 'default');
  quadImg(startQuad);
  //set time out so it doesn't add a tree under where you clicked the start button - not a good solution, but it seems to work
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
};

function howto() {
  ssbtnsdiv.style.display = 'none';
  howtodiv.style.display = 'inline';
}

//go back to the starting screen
function back() {
  ssbtnsdiv.style.display = '';
  afterStart.style.display = 'none';
  widthInput.style.display = 'none';
  widthWarning.style.display = 'none';
  screen = 'start';
}

//resume the already started game
function resume() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
}

//generate a semirandom grid and sort into quadrilateral points in quads array
function randomGrid() {
  //generate random points
  points = [];
  points.length = 0;
  quads = [];
  quads.length = 0;
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
      let maxGVal = ((((gridHeight-1)*(gridWidth-1))/2+20)*4);
      let gVal = Math.trunc(mapVal(((((i+1)*(j+1))/2+20)*4), 82, maxGVal, 75, 255)).toString(16); //map so it doesn't max out near the bottom right of the grid
      let color = parseInt(33+gVal+33, 16);

      //add each to quadrilaterals array
      quads.push({
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
        shade: gVal,
      })
    }
  }
};

//go through quads array and draw all quads
function drawQuads() {
  //draw all the quadrilaterals
  for (let i = 0; i < quads.length; i++) {
    drawQuad(i);
  }
}

//handle clicks on the canvas
function canvasClick(e) {
  let clickedQuad;
  clickedQuad = checkInside(e);
  //have to do !== false because the first quad is 0
  if (clickedQuad !== false && 
    screen === 'game' && 
    biomes[quads[clickedQuad].biome].seed === true &&
    (adjQuad(clickedQuad, 'img', true) === true || quads[clickedQuad].img === true)) {
      quadImg(clickedQuad);
  }
}

//draw one quad
function drawQuad(i, color=quads[i].color) {
  if (quads[i].biome === 'jungle') {
    color = '#' + (color - biomes[quads[i].biome].color).toString(16);
  }
  else if (quads[i].biome === 'mountain') {
    color = '#' + quads[i].shade + quads[i].shade + quads[i].shade;
  }
  else if (quads[i].biome === 'swamp') {
    let bVal = Math.trunc(mapVal(parseInt(quads[i].shade, 16), 82, 255, 80, 150)).toString(16);
    color = '#' + '2266' + bVal;
  }
  else {
    color = '#' + color.toString(16);
  }
  quads[i].newColor = color;

  ctx.fillStyle = color;
  ctx.lineWidth = 0.3;

  ctx.beginPath();
  ctx.moveTo(quads[i].tl.x + newOffsetX, quads[i].tl.y);
  ctx.lineTo(quads[i].tr.x + newOffsetX, quads[i].tr.y);
  ctx.lineTo(quads[i].br.x + newOffsetX, quads[i].br.y);
  ctx.lineTo(quads[i].bl.x + newOffsetX, quads[i].bl.y);
  ctx.lineTo(quads[i].tl.x + newOffsetX, quads[i].tl.y);
  ctx.fill();
  ctx.stroke();
}

// center an image in a quad
function centerImg(quad, img, imgHeight) {
  let centerCoords = findCenter(quad);
  img.width = imgSize;
  img.style.left = centerCoords[0] + canvas.offsetLeft - imgSize/2 + boxMuller()*5 + newOffsetX + 'px';
  img.style.top = centerCoords[1] + canvas.offsetTop - ((imgHeight/50)*imgSize)/2 + boxMuller()*4 - 3 + 'px'; //-3 so the trunk doesn't stick out the bottom
}

// toggle image on a quad, based on the biome of that quad
function quadImg(quad) {
  let coords = quadRef(quad);
  if (quads[quad].img == false) {
    let img = document.createElement('IMG');

    img.src = biomes[quads[quad].biome].src;

    img.classList.add('treeimg');
    img.id = `img:${coords[0]}::${coords[1]}:`; //give each one a unique id for removal

    centerImg(quad, img, biomes[quads[quad].biome].height);
    afterStart.appendChild(img);
    quads[quad].img = true;

    treeNum++;
  }
  else if (quads[quad].img === true && treeNum > 1) {
    let findImg = document.getElementById(`img:${coords[0]}::${coords[1]}:`);
    findImg.parentNode.removeChild(findImg);
    quads[quad].img = false;
    treeNum--;
  }
}

//check if a click on the canvas is inside a quadrilateral, and if so, which one
function checkInside(e) {
  //cross products for each side going in a circle - cross point vectors for both points that define each side
  //needs to be in a 3d coordinate system, with z being the same for all vectors
  //if the cross products are taken going clockwise, in a right-hand coordinate system, if the dot product of a given point vector with each of the line vectors for each of the sides is negative, that point is inside the polygon
  //the sign of the dot product is flipped if going counterclockwise or using a left-hand coordinate system

  let tempSideVector;

  for (let j = 0; j < quads.length; j++) {
    let dotChecks = [];
    for (let i = 0; i < 4; i++) {
      tempSideVector = crossProd([quads[j][corners[i]].x, quads[j][corners[i]].y], [quads[j][corners[i+1]].x, quads[j][corners[i+1]].y]);
      dotChecks.push(dotProd(tempSideVector, [e.clientX - newOffsetX, e.clientY - canvas.offsetTop + window.pageYOffset, 1]));
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
  let avgY = (quads[quad].tl.y + quads[quad].tr.y + quads[quad].br.y + quads[quad].bl.y)/4;
  let avgX = (quads[quad].tl.x + quads[quad].tr.x + quads[quad].br.x + quads[quad].bl.x)/4;
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
 
//check if there is an adjacent quad with the specified property being the specified value 
function adjQuad (checkQuad, prop, val) {
  if ((checkQuad%(gridWidth-1)-gridWidth+2 !== 0 && quads[checkQuad+1] !== undefined && quads[checkQuad+1][prop] === val) || 
      (checkQuad%(gridWidth-1) !== 0 && quads[checkQuad-1] !== undefined && quads[checkQuad-1][prop] ===  val) || 
      (quads[checkQuad + gridWidth-1] !== undefined && quads[checkQuad + gridWidth-1][prop] ===  val) || 
      (quads[checkQuad - (gridWidth-1)] !== undefined && quads[checkQuad - (gridWidth-1)][prop] ===  val)) {
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
function biome(size, type) {
  size --; //correct for the center one already being counted - size is the radius in quads
  let center;
  //do while loop to make sure the biomes don't generate on top of or right next to each other
  do {
    center = Math.trunc(Math.random()*quads.length);
  }
  while (quads[center].biome !== 'default' || !adjQuad(center, 'biome', 'default'));

  let centerCoords = quadRef(center);
  quads[center].biome = type;
  //add some sort of randomness to the biome shape?

  //array of coordinates for biome
  let biome = [];
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size-i; j++) {
        let tempQuad = quadRef([centerCoords[0]+((size-i)-j)*coordSigns[k]+biomeFixAlign[k], centerCoords[1]+j*coordSigns[k+1]+biomeFixAlign[k]]);
        if (quads[tempQuad] !== undefined) {
          biome.push(tempQuad);
          quads[tempQuad].biome = type;
        }
      }
    }
  }
}