// script.js
// Pathfinding Visualizer: BFS, DFS, IDS (vanilla JS)
// Put this file in same folder as index.html and style.css

const gridEl = document.getElementById('grid');
const runBtn = document.getElementById('runBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const randomWallsBtn = document.getElementById('randomWallsBtn');
const algoSelect = document.getElementById('algoSelect');
const speedInput = document.getElementById('speed');
const rowsInput = document.getElementById('rows');

const modeStart = document.getElementById('modeStart');
const modeEnd = document.getElementById('modeEnd');
const modeWall = document.getElementById('modeWall');
const modeErase = document.getElementById('modeErase');

const exploredCountEl = document.getElementById('exploredCount');
const pathLenEl = document.getElementById('pathLen');

let ROWS = +rowsInput.value;
let COLS = ROWS;
let cellSize;
let grid = [];
let isRunning = false;
let stopRequested = false;
let mode = 'start'; // 'start' | 'end' | 'wall' | 'erase'
let startNode = null;
let endNode = null;

// helper sleep
const sleep = ms => new Promise(r => setTimeout(r, ms));

// create grid
function makeGrid(rows) {
  gridEl.innerHTML = '';
  grid = [];
  ROWS = rows;
  COLS = rows;
  const total = rows * rows;
  // set CSS grid
  gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
  // create nodes
  for(let r=0;r<rows;r++){
    const row = [];
    for(let c=0;c<cols;c++){
      const cell = document.createElement('div');
      cell.className = 'cell empty cell gridline';
      cell.dataset.r = r; cell.dataset.c = c;
      // add event listeners
      cell.addEventListener('click', onCellClick);
      gridEl.appendChild(cell);
      row.push({el: cell, r, c, type: 'empty', parent: null});
    }
    grid.push(row);
  }
}

// fix variable name typo (cols)
let cols = COLS;

// handle clicks
function onCellClick(e){
  if(isRunning) return;
  const el = e.currentTarget;
  const r = +el.dataset.r, c = +el.dataset.c;
  const node = grid[r][c];

  if(mode === 'start'){
    if(startNode) setNodeType(startNode, 'empty');
    setNodeType(node, 'start');
    startNode = node;
  } else if(mode === 'end'){
    if(endNode) setNodeType(endNode, 'empty');
    setNodeType(node, 'end');
    endNode = node;
  } else if(mode === 'wall'){
    if(node.type === 'empty') setNodeType(node, 'wall');
  } else if(mode === 'erase'){
    if(node === startNode) startNode = null;
    if(node === endNode) endNode = null;
    setNodeType(node, 'empty');
  }
}

function setNodeType(node, type){
  node.type = type;
  node.el.className = 'cell ' + type + (type === 'empty' ? ' cell gridline' : '');
  if(type === 'start') { node.el.classList.add('start'); }
  if(type === 'end') { node.el.classList.add('end'); }
  if(type === 'wall') { node.el.classList.add('wall'); }
  if(type === 'frontier'){ node.el.classList.add('frontier'); }
  if(type === 'visited'){ node.el.classList.add('visited'); }
  if(type === 'path'){ node.el.classList.add('path'); }
}

// UI Mode toggles
[modeStart, modeEnd, modeWall, modeErase].forEach(btn=>{
  btn.addEventListener('click', ()=> {
    [modeStart, modeEnd, modeWall, modeErase].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.id === 'modeStart' ? 'start' : btn.id === 'modeEnd' ? 'end' : btn.id === 'modeWall' ? 'wall' : 'erase';
  });
});

// clear grid
function clearGrid(){
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      grid[r][c].parent = null;
      setNodeType(grid[r][c], 'empty');
    }
  }
  startNode = null; endNode = null;
  exploredCountEl.textContent = '0';
  pathLenEl.textContent = '0';
}

// random walls
function randomWalls(){
  clearGrid();
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(Math.random() < 0.18) setNodeType(grid[r][c],'wall');
    }
  }
}

// grid neighbors
function neighbors(node){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const result = [];
  for(const [dr,dc] of dirs){
    const nr = node.r + dr, nc = node.c + dc;
    if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS){
      const n = grid[nr][nc];
      if(n.type !== 'wall') result.push(n);
    }
  }
  return result;
}

// BFS
async function bfs(){
  if(!startNode || !endNode) return;
  isRunning = true; stopRequested = false;
  const q = [];
  q.push(startNode);
  const visited = new Set();
  visited.add(startNode);
  startNode.parent = null;
  let explored = 0;
  while(q.length && !stopRequested){
    const node = q.shift();
    if(node !== startNode && node !== endNode) setNodeType(node,'visited');
    explored++; exploredCountEl.textContent = explored;
    if(node === endNode) break;
    for(const n of neighbors(node)){
      if(!visited.has(n)){
        visited.add(n);
        n.parent = node;
        if(n !== endNode) setNodeType(n,'frontier');
        q.push(n);
      }
    }
    await sleep( Math.max(10, +speedInput.value) );
  }
  if(!stopRequested && endNode.parent){
    // reconstruct path
    let cur = endNode; let length = 0;
    while(cur && cur !== startNode){
      if(cur !== endNode) setNodeType(cur,'path');
      cur = cur.parent; length++;
      await sleep(20);
    }
    pathLenEl.textContent = length;
  }
  isRunning = false;
}

// DFS (recursive)
async function dfs(){
  if(!startNode || !endNode) return;
  isRunning = true; stopRequested = false;
  const visited = new Set();
  let found = false;
  let explored = 0;
  async function dfsRec(node){
    if(stopRequested || found) return;
    visited.add(node);
    if(node !== startNode && node !== endNode) { setNodeType(node,'visited'); }
    explored++; exploredCountEl.textContent = explored;
    if(node === endNode){ found = true; return; }
    for(const n of neighbors(node)){
      if(!visited.has(n) && !found){
        n.parent = node;
        if(n !== endNode) setNodeType(n,'frontier');
        await sleep( Math.max(10, +speedInput.value) );
        await dfsRec(n);
      }
      if(stopRequested || found) return;
    }
  }
  await dfsRec(startNode);
  if(!stopRequested && endNode.parent){
    let cur = endNode; let length = 0;
    while(cur && cur !== startNode){
      if(cur !== endNode) setNodeType(cur,'path');
      cur = cur.parent; length++;
      await sleep(20);
    }
    pathLenEl.textContent = length;
  }
  isRunning = false;
}

// IDS: iterative deepening DFS
async function ids(){
  if(!startNode || !endNode) return;
  isRunning = true; stopRequested = false;
  let found = false;
  let explored = 0;

  async function dls(node, depth, visited){
    if(stopRequested || found) return false;
    if(depth === 0){
      if(node === endNode) { found = true; return true; }
      return false;
    }
    visited.add(node);
    if(node !== startNode && node !== endNode) setNodeType(node,'visited');
    explored++; exploredCountEl.textContent = explored;
    for(const n of neighbors(node)){
      if(stopRequested || found) return false;
      if(!visited.has(n)){
        n.parent = node;
        if(n !== endNode) setNodeType(n,'frontier');
        await sleep( Math.max(10, +speedInput.value) );
        if(await dls(n, depth-1, visited)) return true;
      }
    }
    return false;
  }

  // increase depth until found or maxDepth
  const maxDepth = ROWS * COLS;
  for(let depth=1; depth<=maxDepth && !stopRequested && !found; depth++){
    // reset parents for new run
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) grid[r][c].parent = null;
    const visited = new Set();
    await dls(startNode, depth, visited);
  }

  if(!stopRequested && endNode.parent){
    let cur = endNode; let length = 0;
    while(cur && cur !== startNode){
      if(cur !== endNode) setNodeType(cur,'path');
      cur = cur.parent; length++;
      await sleep(20);
    }
    pathLenEl.textContent = length;
  }
  isRunning = false;
}

// events
runBtn.addEventListener('click', async ()=>{
  if(isRunning) return;
  // reset any old frontier/visited/path except start/end/walls
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(grid[r][c].type !== 'wall' && grid[r][c] !== startNode && grid[r][c] !== endNode){
      setNodeType(grid[r][c],'empty');
      grid[r][c].parent = null;
    }
  }
  exploredCountEl.textContent = '0';
  pathLenEl.textContent = '0';

  if(algoSelect.value === 'bfs') await bfs();
  else if(algoSelect.value === 'dfs') await dfs();
  else if(algoSelect.value === 'ids') await ids();
});

stopBtn.addEventListener('click', ()=>{
  stopRequested = true;
});

clearBtn.addEventListener('click', ()=>{
  if(isRunning) return;
  clearGrid();
});

randomWallsBtn.addEventListener('click', ()=>{
  if(isRunning) return;
  randomWalls();
});

rowsInput.addEventListener('input', ()=>{
  if(isRunning) return;
  const r = +rowsInput.value;
  makeGrid(r);
});

speedInput.addEventListener('input', ()=>{ /* just changes speed */ });

// initialization
makeGrid(ROWS);

// pre-place some start/end for convenience
(function seed(){
  const mid = Math.floor(ROWS/3);
  setNodeType(grid[mid][Math.floor(ROWS/4)], 'start'); startNode = grid[mid][Math.floor(ROWS/4)];
  setNodeType(grid[ROWS-mid-1][Math.floor(ROWS*0.75)], 'end'); endNode = grid[ROWS-mid-1][Math.floor(ROWS*0.75)];
})();
