// sizes
const COLS = 25
const ROWS = 25;
const SIZE = 20;

// data
var grid    = [];
var stack   = [];
var route   = [];
var deadend = [];

// colors
const COLOR_START   = 'lime';
const COLOR_FINISH  = 'blue';
const COLOR_ROUTE   = 'rgb(	124,252,0)';
const COLOR_DEADEND = 'rgb(139,0,0)';

// მდგომარეობა
const STATES = {
  SELECT_START : 0,
  SELECT_FINISH: 1,
  SOLVE        : 2
};
var state;

// პოზიციები
var counter=1;
var current;
var start;
var finish;

// rრენდერი
var pg; // ლაბირინთის ბუფერი
var canvas;
var framerate = 15;

function setup() {
  canvas = createCanvas(COLS * SIZE + 1, ROWS * SIZE + 1);
  canvas.parent('sketch');

  // დაფის რენდერი
  for (var j = 0; j < ROWS; ++j) {
    var row = [];
    for (var i = 0; i < COLS; ++i) {
      var cell = new Cell(j, i);
      row.push(cell);
    }
    grid.push(row);
  }

  // ლაბირინთის გენერაცია ყოველ რეფრეშზე
  current = grid[0][0];
  current.visited = true;

  var unvisited = ROWS * COLS - 1;

  while (unvisited) {
    // ს1
    var next = current.getRndNeighbor();
    if (next) {
      // ს2
      stack.push(current);

      // ს3
      removeWall(current, next);

      // ს4
      current = next;
      if (!current.visited) {
        current.visited = true;
        --unvisited;
      }
    } else if (stack.length > 0) {
      current = stack.pop();
    }
  }

  // show maze
  for (var j = 0; j < ROWS; ++j) {
    for (var i = 0; i < COLS; ++i) {
      grid[j][i].show();
    }
  }

  // buffer maze image
  pg = createGraphics(width, height);
  pg.copy(canvas, 0, 0, width, height, 0, 0, width, height);

  state = STATES.SELECT_START;
  infoText('აირჩიეთ საწყისი უჯრა');
}

function draw() {
  // ლაბირინთი
  image(pg);

  // საწყისის არჩევა
  if (state === STATES.SELECT_START) {
    getCellUnderCursor().stroke(COLOR_START);
    return;
  }

  // საბოლოოს არჩევა
  if (state === STATES.SELECT_FINISH) {
    getCellUnderCursor().stroke(COLOR_FINISH);
    start.stroke(COLOR_START);
    return;
  }

  // ალგორითმის რეალიზაცია ( ქვემოთ მიწერია ალგორითმები)
  if (state === STATES.SOLVE) {

    if (current != finish) {
      // ს1
      var next = current.getRndNeighbor(true);
      if (next) {
        // ს2
        route.push(current);
        counter=counter+1;

        // ს3
        current = next;
        current.visited = true;
      }
      else if (route.length > 0) {
        // ბქ
        counter=counter+1;
        deadend.push(current);
        current = route.pop();
      }
      else {

        infoText('impossible: cells passed '+counter);
        
        
        noLoop();
      }
    } else {
      // გასასვლელი
      infoText('Finish: cells passed '+counter);
      
      noLoop();
    }

    showRoute();
  }

  start.stroke(COLOR_START);
  finish.stroke(COLOR_FINISH);
}

function showRoute() {
   var c;
  current.highlight(COLOR_START);
  for (var i = 0; i < route.length; ++i) {
    route[i].highlight(COLOR_ROUTE);

  }
  for (var i = 0; i < deadend.length; ++i) {
    deadend[i].highlight(COLOR_DEADEND);
  }
}

function getCellUnderCursor() {
  var i = floor(constrain(mouseX, 0, width  - 2) / SIZE);
  var j = floor(constrain(mouseY, 0, height - 2) / SIZE);
  return grid[j][i];
}

function mouseClicked() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 ||mouseY > height) {
    return;
  }

  // select start cell
  if (state === STATES.SELECT_START) {
    start = getCellUnderCursor();
    state = STATES.SELECT_FINISH;
    infoText('აირჩიე საბოლოო  უჯრა');
    return;
  }

  // ბოლო უჯრის ამორჩევა
  if (state === STATES.SELECT_FINISH) {
    finish = getCellUnderCursor();
    state = STATES.SOLVE;
    infoText('START');

    // ფსევდო შემოწმება,დაშვებით
    for (var j = 0; j < ROWS; ++j) {
      for (var i = 0; i < COLS; ++i) {
        grid[j][i].visited = false;
      }
    }

    // საყსის არჩევა
    current = start;
    current.visited = true;

    frameRate(framerate);
  }
}

function keyPressed() {
  if (keyCode == UP_ARROW) {
    framerate += 5;
    frameRate(framerate);
  }
  else if (keyCode == DOWN_ARROW) {
    framerate = max(1, framerate - 5);
    frameRate(framerate);
  }
}

function getCell(j, i) {
  if (j < 0 || j > ROWS - 1 || i < 0 || i > COLS - 1) {
    return undefined;
  }

  return grid[j][i];
}

function isFenced(a, b) {
  if (a.i === b.i && a.j === b.j + 1) {
    return a.walls.top || b.walls.bottom;
  }
  if (a.i === b.i - 1 && a.j === b.j) {
    return a.walls.right || b.walls.left;
  }
  if (a.i === b.i && a.j === b.j - 1) {
    return a.walls.bottom || b.walls.top;
  }
  if (a.i === b.i + 1 && a.j === b.j) {
    return a.walls.left || b.walls.right;
  }
}

function removeWall(a, b) {
  if (a.i === b.i && a.j === b.j + 1) {
    a.walls.top    = false;
    b.walls.bottom = false;
  }
  else if (a.i === b.i - 1 && a.j === b.j) {
    a.walls.right = false;
    b.walls.left  = false;
  }
  else if (a.i === b.i && a.j === b.j - 1) {
    a.walls.bottom = false;
    b.walls.top    = false;
  }
  else if (a.i === b.i + 1 && a.j === b.j) {
    a.walls.left  = false;
    b.walls.right = false;
  }
}

function infoText(message) {
  document.getElementById('title').textContent = message;
}
