/**
 To do: 
 * Add randomness to biomes - edge quads now have a 15% chance to not be there
 * Save more things in browser storage?
 * better win message system (not an alert)
 * Stop you from changing trees after you win?
 * Add more growth stages for trees? (I'm not sure this would be good from a game mechanic standpoint)
 * be able to remove saplings and get a seed back? or nothing?
 * be able to buy more than one seed of each kind
 * add different saplings for each tree type
 * come up with a better tree than 'default'
 * give different tree different attributes? more seeds, more logs, faster growth?
 * more logs: kapok
 * more seeds: pine?
 * faster growth: mangrove?
 * add 'new game' button
 * easter egg idea: remove all the trees back down to one? or let them remove all the trees once they get it full?
 */

"use strict"

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

const logNum = document.getElementById('logNum');
const treebtns = document.getElementById('treebtns');
const priceDisplay = document.getElementById('priceDisplay');

let treeImgs = document.getElementsByClassName('treeimg');

function gotchem(item, defalt, type=localStorage) {
  let getem = type.getItem(item);
  let parsem = JSON.parse(getem);
  if (getem !== null && parsem !== undefined) return parsem;
  return defalt;
};

//returns v1 cross v2 for 3D vectors
//use 1 for the z term in all vectors - needed to make the checkInside thing work, not sure how it works
const crossProd = (v1, v2) => [v1[1] - v2[1], v2[0] - v1[0], v1[0]*v2[1] - v1[1]*v2[0]];

//returns v1 dot v2
const dotProd = (v1, v2) => v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];

//maps a value from one range to another (taken from arduino map function)
const mapVal = (val, fromLow, fromHigh, toLow, toHigh) => (val - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;

//Box-Muller transform (turns a uniform distribution into a standard one)
const boxMuller = () => Math.sqrt(-2*Math.log(Math.random()))*Math.sin(Math.PI*2*Math.random());

canvas.width = window.innerWidth; //set canvas to width of window
let ctx = canvas.getContext('2d'); //get context
ctx.lineJoin = 'round'; //round the line joins - not really noticable with the really thin lines

let points = []; //temporary array for storing points before linking them to quads
let quads = []; //array for quadrilaterals (one letter for readability, or at least that's my excuse)

//for the canvasclick & win functions so they don't do anything while not on the game screen
let screen = 'start';
let logs = 0;
let price = 50;
let win = false;

class Biome {
  constructor(tree, src, height, width, seeds, seedCounter) {
    this.tree = tree
    this.src = src;
    this.height = height;
    this.width = width;
    this.seeds = seeds;
    this.seedCounter = document.getElementById(seedCounter);
  }

  buySeeds() {
    this.seeds ++;
    logs -= price;
    price += 50;
    priceDisplay.textContent = price;
    logNum.textContent = logs;
  }

  updateSeedCount(val) {
    this.seeds += val;
    this.seedCounter.textContent = this.seeds;
  }
}

//data for each of the biomes (image, color & amount of seeds)
const biomes = {
  default: new Biome ('default', 'tearTreeSmall.png', 94, 50, 5, 'defaultSeedCount'),
  jungle: new Biome ('kapok', 'jungleTreeSmall.png', 53, 50, 0, 'kapokSeedCount'),
  mountain: new Biome ('pine', 'pineTreeSmall.png', 63, 50, 0, 'pineSeedCount'),
  swamp: new Biome ('mangrove', 'mangroveTreeSmall.png', 50, 50, 0, 'mangroveSeedCount'),
}
let biomeKeys = Object.keys(biomes).slice(1); //remove the default biome so it doesn't generate a biome that's just the default, and because you can't buy default seeds

class Quad {
  constructor(tl, tr, br, bl, color, biome, tree, treed) {
    this.tl = {x: tl.x, y: tl.y};
    this.tr = {x: tr.x, y: tr.y};
    this.br = {x: br.x, y: br.y};
    this.bl = {x: bl.x, y: bl.y};
    this.color = color;
    this.biome = biome;
    this.tree = tree;
    this.treed = false;
    this.img = undefined; //for readability, just set up img for later (not necessary)
  }

  updateTree(startTree=false) {
    if (this.tree === 'none' && biomes[this.biome].seeds > 0) {
      treeNum++;
      biomes[this.biome].updateSeedCount(-1);

      let img = document.createElement('IMG');
      img.src = 'saplingSmall.png';
      
      img.id = `img${quads.indexOf(this)}`; //for repositioning with window resizes
      img.classList.add('treeimg'); //set the position to absolute

      centerImg(this, img, biomes[this.biome].height);
      afterStart.appendChild(img);
      this.img = img;
      this.tree = 'sapling';
      this.treed = true;

      //start growth timeout
      let timeout = startTree ? 0 : 4000 + Math.trunc(Math.random()*2000); //zero for the starting tree so you start with a full grown tree
      window.setTimeout(() => {
        this.tree = 'tree';
        this.img.src = biomes[this.biome].src;
      }, timeout);
    }
    else if (this.tree === 'tree' && treeNum > 1) {
      this.img.parentNode.removeChild(this.img);
      logs ++;
      logNum.textContent = logs;
      biomes[this.biome].updateSeedCount(Math.random() > 0.25 ? 1 : 2); //I think this gives about a 25% chance of getting two seeds
      this.tree = 'none';
      treeNum--;
    }
  }
}

//variable for blind counting of trees
let treeNum = 0;

//changes the number of points in the grid
let gridWidth = gotchem('gridWidth', 19);
let maxGridWidth = 21;
let minGridWidth = 5;
let gridHeight = 9;
//spacing between points on the grid in pixels
let gridSize = 75;
let imgSize = gridSize/2.2; //should be about the right size for trees, based on the grid size

let gridOffsetY = 50; //offset from top of canvas
//offset from left of canvas
let gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2; //center the grid in the window
let newOffsetX = 0;
canvas.height = 2*gridOffsetY+gridSize*(gridHeight-1)+5; //set canvas height given the grid height and offset from top

window.addEventListener('load', () => {
  widthNum.value = gridWidth-1;
  widthSlider.value = gridWidth;
}, false);

startbtn.addEventListener('click', start, false);
howtobtn.addEventListener('click', howto, false);
backbtn.addEventListener('click', back, false);
resumebtn.addEventListener('click', resume, false);
treebtns.addEventListener('click', buySeeds, false);

//change grid size and offsets with the slider
widthSlider.addEventListener('input', () => {
  widthNum.value = widthSlider.value-1; 
  gridWidth = parseInt(widthSlider.value);
  localStorage.setItem('gridWidth', JSON.stringify(gridWidth));
  gridOffsetX = (window.innerWidth-(gridSize*(gridWidth-1)))/2;
}, false);

//same with text input
widthNum.addEventListener('input', () => {
  widthNum.value = Math.max(Math.min(parseInt(widthNum.value)+1, maxGridWidth-1), minGridWidth-1); //limit textbox input to the slider limits
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
    let quadNum = parseInt(treeImgs[i].id.slice(treeImgs[i].id.indexOf('g')+1)); //remove the 'img' from the id to just get the quad number
    centerImg(quads[quadNum], treeImgs[i]);
  }
}, false);

document.addEventListener('click', canvasClick, false);

//hide start screen and show canvas, set starting quad, and replace start button with resume button
function start() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';
  resumebtn.style.display = 'block';
  startbtn.style.display = "none";
  backbtn.style.display = 'block';

  widthInput.style.display = 'none';
  widthWarning.style.display = 'none';
  randomGrid(); //generate the random point grid

  drawBiomes(); //draw all the biomes

  drawQuads(); //draw all the quads

  //Put a tree on a random quad so you can put trees in
  let startQuad;
  let timeout = 0;
  do {
    startQuad = Math.trunc(Math.random()*quads.length);
    if (timeout > quads.length) {
      quads.forEach(i => {
        i.biome = 'default';
      })
      drawBiomes();
      drawQuads();
      timeout = 0;
    }
    timeout++;
  }
  while (quads[startQuad].biome !== 'default' || !adjQuad(startQuad, 'biome', 'default')) //change the starting quad while it's either not on the default biome or doesn't have any default biome adjacent to it

  quads[startQuad].updateTree(true);
  //set time out so it doesn't add a tree under where you clicked the start button - not a good solution, but it seems to work
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
};

//go to the how to screen
function howto() {
  ssbtnsdiv.style.display = 'none';
  howtodiv.style.display = 'inline';
  backbtn.style.display = 'block';
}

//go back to the starting screen
function back() {
  ssbtnsdiv.style.display = '';
  afterStart.style.display = 'none';
  howtodiv.style.display = 'none';
  backbtn.style.display = 'none';
  screen = 'start';
}

//resume the already started game
function resume() {
  ssbtnsdiv.style.display = 'none';
  afterStart.style.display = 'inline';
  backbtn.style.display = 'block';
  window.setTimeout(() => {
    screen = 'game';
  }, 100)
}

//buy seeds
function buySeeds(e) {
  if (logs >= price && e.target.matches('button')) {
    for (let i = 0; i < biomeKeys.length; i++) {
      let tempTree = e.target.id.slice(0, e.target.id.indexOf('b')); //remove "btn" from the end of the id to get just the tree name
      if (biomes[biomeKeys[i]].tree === tempTree) {
        biomes[[biomeKeys[i]]].buySeeds();
        e.target.style.display = 'none';
        document.getElementById(tempTree + 'Seeds').style.display = 'inline';
      }
    }
  }
}

//generate a semirandom grid and sort into quadrilateral points in quads array
function randomGrid() {
  //generate random points
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
      let maxGVal = (((gridHeight-1)*(gridWidth-1)/2+20)*4); //calculate the maximum of the gVal formula (below) for mapping
      let gVal = Math.trunc(mapVal((((i+1)*(j+1)/2+20)*4), 82, maxGVal, 75, 255)); //map so it doesn't max out near the bottom right of the grid
      let color = [33, gVal, 33];

      //add each to quadrilaterals array
      quads.push(new Quad(points[i][j], points[i+1][j], points[i+1][j+1], points[i][j+1], color, 'default', 'none'));
    }
  }
  points = []; //clear points array - better? less memory usage?
};

//handle clicks on the canvas
function canvasClick(e) {
  let clickedQuad = checkInside(e);
  //have to do !== false because the first quad is 0

  if (clickedQuad !== false && screen === 'game' && (adjQuad(clickedQuad, 'tree', 'tree') === true || quads[clickedQuad].tree === 'tree' || quads[clickedQuad].treed === true)) {
    quads[clickedQuad].updateTree();
  }
  if (treeNum === quads.length && screen === 'game' && win === false) {
    alert('You win!');
    win = true;
  }
}

//go through quads array and draw all quads
function drawQuads() {
  //draw all the quadrilaterals
  for (let i = 0; i < quads.length; i++) {
    drawQuad(i);
  }
}

//draw one quad
function drawQuad(i, color=quads[i].color) {
  switch (quads[i].biome) {
    case 'jungle': 
      color = `rgb(${color.map(i => i*.75)})`; //darken the green proportionally (looks better than subtracting an absolute value I think)
    break;
    case 'mountain':
      color = `rgb(${color[1]}, ${color[1]}, ${color[1]})`; //grayscale it
    break;
    case 'swamp':
      color = `rgb(34, 102, ${Math.trunc(mapVal(color[1], 82, 255, 80, 150))})`; //remap the generated shade to be the blue value
    break;
    default:
      color = `rgb(${color})`; //else just format it correctly (for default biome)
    break;
  }
  
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
function centerImg(quad, img, imgHeight, imgWidth=50) {
  let centerCoords = findCenter(quad);
  img.width = imgSize;
  img.style.left = centerCoords[0] + canvas.offsetLeft - imgSize/2 + boxMuller()*5 + newOffsetX + 'px';
  img.style.top = centerCoords[1] + canvas.offsetTop - ((imgHeight/imgWidth)*imgSize)/2 + boxMuller()*4 - 3 + 'px'; //-3 to move it up so the trunk doesn't stick out the bottom
}

//check if a click on the canvas is inside a quadrilateral, and if so, which one
function checkInside(e) {
  //cross products for each side going in a circle - cross point vectors for both points that define each side
  //needs to be in a 3d coordinate system, with z being the same for all vectors
  //if the cross products are taken going clockwise, in a right-hand coordinate system, if the dot product of a given point vector with each of the line vectors for each of the sides is negative, that point is inside the polygon
  //the sign of the dot product is flipped if going counterclockwise or using a left-hand coordinate system
  //or randomly when switching to a quad class instead of defining an object each time pushing to the quads array??????????
  
  const corners = ['tl', 'tr', 'br', 'bl', 'tl']; //tl twice so it goes all the way around - for generating side cross products for checkInside

  quadsLoop: for (let j = 0; j < quads.length; j++) {
    for (let i = 0; i < 4; i++) {
      let tempSideVector = crossProd([quads[j][corners[i]].x, quads[j][corners[i]].y], [quads[j][corners[i+1]].x, quads[j][corners[i+1]].y]);
      if (dotProd(tempSideVector, [e.clientX - newOffsetX, e.clientY - canvas.offsetTop + window.pageYOffset, 1]) < 0 === false) {
        continue quadsLoop; //skip to next quad if one side of the current quad is false
      }
    }
    return j; //if they're all true, return the quad number
  }
}

//return canvas coordinates of the center of a quad - input a quad object
function findCenter(quad) {
  let avgY = (quad.tl.y + quad.tr.y + quad.br.y + quad.bl.y)/4;
  let avgX = (quad.tl.x + quad.tr.x + quad.br.x + quad.bl.x)/4;
  return [avgX, avgY];
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

//switches between coordinates and numbers for quads - only used for generating biomes at the moment
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

function drawBiomes() {
  //set up biomes in random order so either one can be on top
  for (let i = biomeKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [biomeKeys[i], biomeKeys[j]] = [biomeKeys[j], biomeKeys[i]];
  }
  //draw the biomes in the new random order
  for (let i = 0; i < biomeKeys.length; i++) {
    makeBiome(4, biomeKeys[i]);
  }
}

//generate a biome
function makeBiome(size, type) {
  size --; //correct for the center one already being counted - size is the radius in quads
  let center;
  //do while loop to make sure the biomes don't generate on top of or right next to each other
  do {
    center = Math.trunc(Math.random()*quads.length);
  }
  while (quads[center].biome !== 'default' || !adjQuad(center, 'biome', 'default'));

  let centerCoords = quadRef(center);
  quads[center].biome = type;

  // for making each quadrant of the biomes line up right
  const coordSigns = [1, 1, -1, -1, 1]; //1 again at the end 'cause it wraps around
  const biomeFixAlign = [0, -1, 0, 1];

  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size-i; j++) {
        if ((i === 0 && Math.random() > .15) || i !== 0) {
          let tempQuad = quadRef([centerCoords[0]+((size-i)-j)*coordSigns[k]+biomeFixAlign[k], centerCoords[1]+j*coordSigns[k+1]+biomeFixAlign[k]]);
          if (quads[tempQuad] !== undefined) {
            quads[tempQuad].biome = type;
          }
        }
      }
    }
  }
}