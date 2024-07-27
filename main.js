let shapes = [];
let mode2D = true;
let canvas;
let ume_points = [], awaji_points = [];
let currentType = null;
let innerCurvesData = [];
let selectedCurve = null;
let cameraFixed = false;
let nowKey = null;
let nowShapeKey = -1;
let nowIndexKey = -1;
let originalColor = null;
let selectedShape = null;
let layerList;
let fixFrontButton;
let mode2D_f = 0;

let outerCurveWeight = 30;
let innerCurveWeight = 5;
let innerCurveColors = [
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
];
let pg;

function setup() {
  canvas = createCanvas(800, 800);
  canvas.parent('canvas-container');
  
  document.getElementById('add-ume-button').addEventListener('click', () => showSizeSelector('ume'));
  document.getElementById('add-awaji-button').addEventListener('click', () => showSizeSelector('awaji'));
  document.getElementById('convert-button').addEventListener('click', convert);
  
  setupSizeSelectors();
  setupColorSelector();
  definePoints();
  
  defaultCameraZ = (height/2) / tan(PI/6) * 1.15;
  pg = createGraphics(800, 800);

  layerList = document.getElementById('layer-list');
  const layerMenuButton = document.getElementById('layer-menu-button');
  layerMenuButton.addEventListener('click', toggleLayerMenu);

  // レイヤーリストの初期化
  updateLayerList();
}

function draw() {
  background(250);
  
  if (mode2D) {
    push();
    //resetMatrix(); // 座標系をリセット  
    if (mode2D_f == 1) {
      translate(-width/2, -height/2);
    }
    for (let shape of shapes) {
      if (shape.type === 'awaji') {
        fill(0, 255, 0, 100);
        drawInvertedTriangle(shape.x, shape.y, shape.d);
      } else if (shape.type === 'ume') {
        fill(255, 0, 0, 100);
        ellipse(shape.x, shape.y, shape.d);
      }
    }
    pop();
  } else {
    drawAxis();
    
    if (!cameraFixed) {
      orbitControl();
    } else {
      // カメラを正面に固定
      camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
    }
    
    for (let i = shapes.length - 1; i >= 0; i--) {
      drawShape(shapes[i], i);
    }
    
    if (cameraFixed) {
      drawLabels();
    }
  }
}

function drawLabels() {
  // オフスクリーンバッファをクリア
  pg.clear();
  
  pg.push();
  pg.textSize(30);
  pg.textAlign(CENTER, CENTER);
  pg.fill(0);  // 黒色のテキスト
  pg.noStroke();
  
  for (let i = 0; i < shapes.length; i++) {
    let shape = shapes[i];
    let x = shape.x;
    let y = shape.y;
    let z = shape.zIndex || 0;  // zIndexがない場合は0を使用
    
    // ラベルのテキスト
    let labelText = `${i}`;
    
    // ラベルの位置（形状の右上に配置）
    let labelX = x + (shape.d / 2);
    let labelY = y - (shape.d / 2);
    
    // zに応じてテキストサイズを調整
    let adjustedSize = 30 / (1 + abs(z) * 0.01);
    pg.textSize(adjustedSize);
    
    // ラベルを描画
    pg.text(labelText, labelX, labelY);
  }
  pg.pop();
  
  // オフスクリーンバッファをメインキャンバスに描画
  push();
  texture(pg);
  noStroke();
  translate(0, 0, 1);  // ラベルを最前面に表示
  plane(width, height);
  pop();
}

//３次元軸の描画
function drawAxis() {
  strokeWeight(1);
  stroke(255, 0, 0);
  line(-400, 0, 0, 400, 0, 0);
  stroke(0, 255, 0);
  line(0, -400, 0, 0, 400, 0);
  stroke(0, 0, 255);
  line(0, 0, -400, 0, 0, 400);
}

//逆三角形の描画
function drawInvertedTriangle(x, y, d) {
  push();
  translate(x, y);
  triangle(0, d/2, -d/2, -d/2, d/2, -d/2);
  pop();
}

//選択された図形の種類によってサイズ選択ボタンを表示・非表示にする
function showSizeSelector(type) {
  currentType = type;
  document.getElementById('ume-size-selector').classList.toggle('hidden', type !== 'ume');
  document.getElementById('awaji-size-selector').classList.toggle('hidden', type !== 'awaji');
}

//サイズオプションにクリックイベントを設定する
function setupSizeSelectors() {
  document.querySelectorAll('.size-selector .size-option').forEach(option => {
    option.addEventListener('click', () => selectSize(option.getAttribute('data-size')));
  });
}

//選択されたサイズの図形を作成してshapesに格納
function selectSize(size) {
  let shapeDiameter = size * 50; // 1cm = 50px と仮定
  shapes.push({
    type: currentType,
    x: width/2,
    y: height/2,
    d: shapeDiameter,
    scale: shapeDiameter / 300,
    ...getCurveParameters(currentType, shapeDiameter)
  });
  
  //サイズを選択したらボタンを隠す
  document.getElementById('ume-size-selector').classList.add('hidden');
  document.getElementById('awaji-size-selector').classList.add('hidden');

  updateLayerList();
}

//2D->3Dへの変換
function convert() {
  if (mode2D && shapes.length > 0) {
    mode2D = false;
    canvas.remove();
    canvas = createCanvas(800, 800, WEBGL);
    canvas.parent('canvas-container');
    
    document.getElementById('add-button-container').classList.add('hidden');
    document.getElementById('color-selector').classList.remove('hidden');
    
    // 正面固定ボタンを追加
    fixFrontButton = createButton('2D <~> 3D');
    fixFrontButton.position(width - 50, height - 40);
    fixFrontButton.mousePressed(toggleFixedFrontView);

    // zIndexを設定
    for (let i = 0; i < shapes.length; i++) {
      shapes[i].zIndex = i * 8;  // 8ずつマイナス方向にずらす
      console.log(shapes[i].x, shapes[i].y);
    }
  }else if(!mode2D){
    camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
    mode2D = true;
    canvas.remove();
    canvas = createCanvas(800, 800);
    canvas.parent('canvas-container');
    
    document.getElementById('add-button-container').classList.remove('hidden');
    document.getElementById('color-selector').classList.add('hidden');
    
    // 正面固定ボタンを削除
    if (fixFrontButton) {
      fixFrontButton.remove();
    }
  
    // 座標を2Dモードに戻す
    for (let shape of shapes) {
      //shape.x += width / 2;
      //shape.y += height / 2;
      delete shape.zIndex;
    }
  
    if(mode2D_f == 0){
      mode2D_f = 1;
    }
    //translate(-width/2, -height/2);
  }
}

function drawShape(shape, shapeIndex) {
  push();
  translate(shape.x - width/2, shape.y - height/2, shape.zIndex);
  let scaleValue = shape.scale * 1.62;
  scale(scaleValue);
  //console.log(shape.x, shape.y); 
  let points;
  if (shape.type === 'awaji') {
    points = awaji_points;
  } else if (shape.type === 'ume') {
    points = ume_points;
  }
  
  let innerCurves = createInnerCurves(points, shape.numInnerCurves, shape.outerCurveWeight, shape.innerCurveWeight);
  
  noFill();
  strokeWeight(shape.innerCurveWeight);
  
  let shapeInnerCurves = [];
  for (let i = 0; i < innerCurves.length; i++) {
    let color;
    if (innerCurvesData[shapeIndex] && innerCurvesData[shapeIndex][i]) {
      color = innerCurvesData[shapeIndex][i].color;
    } else {
      color = innerCurveColors[i % innerCurveColors.length];
    }
    
    if (typeof color === 'string') {
      stroke(color);
    } else {
      stroke(color.r, color.g, color.b);
    }
    
    drawCurveFromPoints(innerCurves[i]);
    shapeInnerCurves.push({
      points: innerCurves[i],
      color: color
    });
  }
  
  // インナーカーブのデータを更新または追加
  innerCurvesData[shapeIndex] = shapeInnerCurves;
  
  pop();
}

function definePoints() {
  ume_points = [
    { x: -40, y: 40, z: -8 },
    { x: -30, y: -45, z: -3 },
    { x: 10, y: -83, z: 5 },
    { x: 50, y: -75, z: -1 },
    { x: 60, y: -30, z: -5 }, 
    { x: 40, y: 0, z: 5 }, 
    { x: -10, y: 45, z: -5 }, 
    { x: -70, y: 25, z: 10 }, 
    { x: -70, y: -30, z: -5 }, 
    { x: -15, y: -45, z: 5 }, 
    { x: 45, y: 0, z: -5 }, 
    { x: 30, y: 65, z: 8 }, 
    { x: -30, y: 65, z: -8 }, 
    { x: -45, y: 0, z: 7 }, 
    { x: 15, y: -45, z: -5 }, 
    { x: 70, y: -30, z: 5 }, 
    { x: 70, y: 25, z: -10 }, 
    { x: 10, y: 45, z: 5 }, 
    { x: -40, y: 0, z: 0 }, 
    { x: -60, y: -30, z: 5 }, 
    { x: -45, y: -75, z: 1 },
    { x: -5, y: -80, z: -5 },
    { x: 25, y: -40, z: 7 },
    { x: 10, y: 45, z: -10 }
  ];
  
  awaji_points = [
    { x: 90, y: -90, z: 0 },
    { x: 60, y: -30, z: -5 },
    { x: 40, y: 0, z: 5 },
    { x: -10, y: 45, z: -5 },
    { x: -70, y: 25, z: 10 },
    { x: -70, y: -30, z: -5 },
    { x: -15, y: -45, z: 7 },
    { x: 45, y: 0, z: -5 },
    { x: 30, y: 65, z: 8 },
    { x: -30, y: 65, z: -8 },
    { x: -45, y: 0, z: 5 },
    { x: 15, y: -45, z: -7 },
    { x: 70, y: -30, z: 5 },
    { x: 70, y: 25, z: -10 },
    { x: 10, y: 45, z: 5 },
    { x: -40, y: 0, z: -5 },
    { x: -60, y: -30, z: 5 },
    { x: -90, y: -90, z: 0 }
  ];
}

function drawCurveFromPoints(pts) {
  beginShape();
  curveVertex(pts[0].x, pts[0].y, pts[0].z);
  for (let p of pts) {
    curveVertex(p.x, p.y, p.z);
  }
  curveVertex(pts[pts.length-1].x, pts[pts.length-1].y, pts[pts.length-1].z);
  endShape();
}

function createInnerCurves(points, numInnerCurves, outerCurveWeight, innerCurveWeight) {
  let innerCurves = [];
  let curveWidth = outerCurveWeight;

  if (numInnerCurves == 1) {
    innerCurves.push(createOffsetCurve(points, 0));
  } else {
    for (let i = 0; i < numInnerCurves; i++) {
      let offset = map(i, 0, numInnerCurves - 1, -curveWidth/2 + innerCurveWeight/2, curveWidth/2 - innerCurveWeight/2);
      innerCurves.push(createOffsetCurve(points, offset));
    }
  }
  
  return innerCurves;
}

//指定されたオフセットに基づいて元の曲線を変形
function createOffsetCurve(originalCurve, offset) {
  return originalCurve.map((p, index) => {
    let prev, next;

    if (index === 0) {
      // 最初の点の場合、次の点のみを考慮
      next = originalCurve[index + 1];
      prev = { x: p.x - (next.x - p.x), y: p.y - (next.y - p.y), z: p.z - (next.z - p.z) };
    } else if (index === originalCurve.length - 1) {
      // 最後の点の場合、前の点のみを考慮
      prev = originalCurve[index - 1];
      next = { x: p.x - (prev.x - p.x), y: p.y - (prev.y - p.y), z: p.z - (prev.z - p.z) };
    } else {
      // 中間の点の場合、両側の点を考慮
      prev = originalCurve[index - 1];
      next = originalCurve[index + 1];
    }

    let tangent = createVector(next.x - prev.x, next.y - prev.y, next.z - prev.z).normalize();
    let normal = createVector(-tangent.y, tangent.x, 0).normalize();

    return {
      x: p.x + normal.x * offset,
      y: p.y + normal.y * offset,
      z: p.z + normal.z * offset
    };
  });
}

function getCurveParameters(type, circleDiameter) {
  let cmSize = circleDiameter / 50; // ピクセルをセンチメートルに変換

  // デフォルトのパラメータ
  let defaultParams = {
    numInnerCurves: 4,
    outerCurveWeight: 30,
    innerCurveWeight: 6.5
  };

  // モデルの種類ごとにパラメータを定義
  let params = {
    ume: {
      1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 },
      2.3: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 },
      2.8: { numInnerCurves: 4, outerCurveWeight: 26, innerCurveWeight: 5 },
      3.3: { numInnerCurves: 5, outerCurveWeight: 29, innerCurveWeight: 5 },
      4: { numInnerCurves: 6, outerCurveWeight: 29, innerCurveWeight: 5 }
    },
    awaji: {
      1: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 },
      1.5: { numInnerCurves: 2, outerCurveWeight: 19, innerCurveWeight: 5 },
      2: { numInnerCurves: 3, outerCurveWeight: 25, innerCurveWeight: 5 },
      2.5: { numInnerCurves: 4, outerCurveWeight: 29, innerCurveWeight: 5 },
      3: { numInnerCurves: 5, outerCurveWeight: 33, innerCurveWeight: 5 }
    },
    // その他のモデルが追加される場合はここに定義
    other: {
      1: { numInnerCurves: 1, outerCurveWeight: 12, innerCurveWeight: 5 },
      1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 },
      2: { numInnerCurves: 3, outerCurveWeight: 24, innerCurveWeight: 5 },
      2.5: { numInnerCurves: 4, outerCurveWeight: 28, innerCurveWeight: 5 },
      3: { numInnerCurves: 5, outerCurveWeight: 32, innerCurveWeight: 5 }
    }
  };

  // タイプが指定されていない、または対応するサイズがない場合はデフォルトを返す
  if (!params[type] || !params[type][cmSize]) {
    return defaultParams;
  }

  // 該当するタイプとサイズのパラメータを返す
  return params[type][cmSize];
}

function setupColorSelector() {
  let colorSelector = document.getElementById('color-selector');
  colorSelector.querySelectorAll('.color-option').forEach(button => {
    button.addEventListener('click', () => changeSelectedCurveColor(button.getAttribute('data-color')));
  });
}

function toggleFixedFrontView() {
  cameraFixed = !cameraFixed;
}

function keyPressed() {
  if (!mode2D && cameraFixed) {
    if (key === 'c' || key === 'C') {
      console.log('c key pressed');
      if (selectedCurve) {
        // If a curve is already selected, reset it
        resetSelectedCurveColor();
        resetSelectionState();
        nowKey = 'c';
      } else {
        // Start new selection
        nowKey = 'c';
        nowShapeKey = -1;
        nowIndexKey = -1;
      }
      //return; // Exit the function here to avoid further processing
    }
    
    if (nowKey === 'c') {
      if (nowShapeKey === -1) {
        // Shape selection phase
        if (key >= '0' && key <= '9') {
          nowShapeKey = parseInt(key);
          console.log("Selected shape:", 'shape' + nowShapeKey);
        }
      } else if (nowIndexKey === -1) {
        // Curve selection phase
        if (key >= '0' && key <= '9') {
          nowIndexKey = parseInt(key);
          console.log("Selected curve index:", nowIndexKey);
          if (innerCurvesData[nowShapeKey] && innerCurvesData[nowShapeKey][nowIndexKey]) {
            selectedCurve = { shapeIndex: nowShapeKey, curveIndex: nowIndexKey };
            console.log("Selected curve:", selectedCurve);
        changeSelectedCurveColor({ r: 255, g: 255, b: 0 }); // 黄色
          } else {
            console.log("Invalid curve index");
            nowIndexKey = -1; // Reset if invalid
          }
        }
      }
    }
  }

}
/*
function mouseClicked() {
  if (!mode2D && cameraFixed) {
    let clickedCurve = findClickedCurve();
    if (clickedCurve) {
      selectedCurve = clickedCurve;
      console.log("Selected curve:", selectedCurve);
    }
  }
}

function findClickedCurve() {
  if (cameraFixed) {
    let mouseVector = createVector(mouseX - width / 2, mouseY - height / 2);

    for (let i = 0; i < innerCurvesData.length; i++) {
      let shape = shapes[i];
      let shapePos = createVector(shape.x - width / 2, shape.y - height / 2);

      for (let j = 0; j < innerCurvesData[i].length; j++) {
        let curve = innerCurvesData[i][j];
        if (isPointOnCurve(mouseVector, shapePos, curve.points, shape.scale)) {
          return { shapeIndex: i, curveIndex: j };
        }
      }
    }
  }
  return null;
}


function isPointOnCurve(mousePos, shapePos, points, scale) {
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = createVector(points[i].x, points[i].y).mult(scale).add(shapePos);
    let p2 = createVector(points[i + 1].x, points[i + 1].y).mult(scale).add(shapePos);

    if (distToSegment(mousePos, p1, p2) < 10) {
      return true;
    }
  }
  return false;
}

function distToSegment(p, v, w) {
  let l2 = p5.Vector.sub(v, w).magSq();
  if (l2 == 0) return p.dist(v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = constrain(t, 0, 1);
  return p.dist(p5.Vector.lerp(v, w, t));
}
*/

function changeSelectedCurveColor(color) {
  if (selectedCurve) {
    let { shapeIndex, curveIndex } = selectedCurve;
    innerCurvesData[shapeIndex][curveIndex].color = color;
  }
}

function resetSelectedCurveColor() {
  if (selectedCurve && originalColor) {
    let { shapeIndex, curveIndex } = selectedCurve;
    innerCurvesData[shapeIndex][curveIndex].color = originalColor;
  }
}

function resetSelectionState() {
  nowKey = '';
  nowShapeKey = -1;
  nowIndexKey = -1;
  selectedCurve = null;
  originalColor = null;
}

function mousePressed() {
  if (mode2D) {
    for (let shape of shapes) {
      if (dist(mouseX, mouseY, shape.x, shape.y) < shape.d / 2) {
        selectedShape = shape;
        break;
      }
    }
  }
}

function mouseDragged() {
  console.log(mouseX, mouseY);
  if (mode2D && selectedShape) {
    selectedShape.x = constrain(mouseX, selectedShape.d/2, width - selectedShape.d/2);
    selectedShape.y = constrain(mouseY, selectedShape.d/2, height - selectedShape.d/2);
    console.log(selectedShape.x ,selectedShape.y);
  }
}

function mouseReleased() {
  selectedShape = null;
}

function toggleLayerMenu() {
  layerList.classList.toggle('hidden');
}

function updateLayerList() {
  layerList.innerHTML = '';
  shapes.forEach((shape, index) => {
    const li = document.createElement('li');
    li.textContent = `${shape.type} ${index}`;
    li.draggable = true;
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragover', dragOver);
    li.addEventListener('drop', drop);
    layerList.appendChild(li);
  });
}

function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.textContent);
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData('text');
  const draggedElement = Array.from(layerList.children).find(el => el.textContent === data);
  const dropTarget = e.target;

  if (draggedElement !== dropTarget) {
    const draggedIndex = Array.from(layerList.children).indexOf(draggedElement);
    const dropIndex = Array.from(layerList.children).indexOf(dropTarget);

    // shapes配列の順序を更新
    const [removedShape] = shapes.splice(draggedIndex, 1);
    shapes.splice(dropIndex, 0, removedShape);

    // DOMの順序を更新
    if (dropIndex < draggedIndex) {
      layerList.insertBefore(draggedElement, dropTarget);
    } else {
      layerList.insertBefore(draggedElement, dropTarget.nextSibling);
    }

    // zIndexを更新
    updateShapeZIndex();
  }
}

function updateShapeZIndex() {
  shapes.forEach((shape, index) => {
    shape.zIndex = (shapes.length - 1 - index) * -8;
  });
}