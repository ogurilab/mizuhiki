let shapes = [];
//let mode2D = true;
let ume_points = [], awaji_points = [];
//let currentType = null;
let innerCurvesData = [];
//let selectedCurve = null;
//let cameraFixed = false;
//let nowKey = null;
//let nowShapeKey = -1;
//let nowIndexKey = -1;
//let originalColor = null;
//let selectedShape = null;
let layerList;
//let fixFrontButton;
//let mode2D_f = 0;
let compShapes = [];
let sketch2;


//let completeCanvas;

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


let sketch1 = new p5((p) => {
  let canvas;
  let mode2D = true;
  let currentType = null;
  let selectedCurve = null;
  let cameraFixed = false;
  let nowKey = null;
  let nowShapeKey = -1;
  let nowIndexKey = -1;
  let originalColor = null;
  let selectedShape = null;
  let fixFrontButton;
  let mode2D_f = 0;
  let pg;
  let highlightedShapeIndex = -1;

  p.setup = function() {
    canvas = p.createCanvas(800, 800);
    canvas.parent('canvas-container');
    
    document.getElementById('add-ume-button').addEventListener('click', () => p.showSizeSelector('ume'));
    document.getElementById('add-awaji-button').addEventListener('click', () => p.showSizeSelector('awaji'));
    document.getElementById('convert-button').addEventListener('click', p.convert);
    
    p.setupSizeSelectors();
    p.setupColorSelector();
    definePoints();
    
    defaultCameraZ = (p.height/2) / p.tan(p.PI/6) * 1.15;
    pg = p.createGraphics(800, 800);

    layerList = document.getElementById('layer-list');
    const layerMenuButton = document.getElementById('layer-menu-button');
    layerMenuButton.addEventListener('click', p.toggleLayerMenu);

    // レイヤーリストの初期化
    p.updateLayerList();
  }

  p.draw = function () {
    p.background(250);
    
    if (mode2D) {
      p.push();
      //resetMatrix(); // 座標系をリセット  
      if (mode2D_f == 1) {
        p.translate(-p.width/2, -p.height/2);
      }
      for (let i=0; i<shapes.length; i++) {
        if (shapes[i].type === 'awaji') {
          p.fill(0, 255, 0, 100);
          p.drawInvertedTriangle(shapes[i].x, shapes[i].y, shapes[i].d);
        } else if (shapes[i].type === 'ume') {
          p.fill(255, 0, 0, 100);
          p.ellipse(shapes[i].x, shapes[i].y, shapes[i].d);
        }
      }
      // ハイライトの描画
      if (highlightedShapeIndex !== -1) {
        const shape = shapes[highlightedShapeIndex];
        p.noFill();
        p.stroke(255, 0, 0);
        p.strokeWeight(4);
        p.ellipse(shape.x, shape.y, shape.d + 20);
      }
      p.pop();
    } else {
      drawAxis(p);
      
      if (!cameraFixed) {
        p.orbitControl();
      } else {
        // カメラを正面に固定
        p.camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
      }
      
      for (let i = shapes.length - 1; i >= 0; i--) {
        drawShape(p, shapes[i], i);
      }
      
      if (cameraFixed) {
        p.drawLabels();
      }
      
      // ハイライトの描画
      if (highlightedShapeIndex !== -1) {
        const shape = shapes[highlightedShapeIndex];
        p.push();
        p.translate(shape.x - p.width/2, shape.y - p.height/2, shape.zIndex);
        p.noFill();
        p.stroke(255, 0, 0);
        p.strokeWeight(4);
        
        // ellipseを使用して円を描画
        p.ellipse(0, 0, shape.d * 1.1, shape.d * 1.1);
        p.pop();
      }
    }
  }

  p.drawLabels = function () {
    // オフスクリーンバッファをクリア
    pg.clear();
    
    pg.push();
    pg.textSize(30);
    pg.textAlign(p.CENTER, p.CENTER);
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
      let adjustedSize = 30 / (1 + p.abs(z) * 0.01);
      pg.textSize(adjustedSize);
      
      // ラベルを描画
      pg.text(labelText, labelX, labelY);
    }
    pg.pop();
    
    // オフスクリーンバッファをメインキャンバスに描画
    p.push();
    p.texture(pg);
    p.noStroke();
    p.translate(0, 0, 1);  // ラベルを最前面に表示
    p.plane(p.width, p.height);
    p.pop();
  }

  //逆三角形の描画
  p.drawInvertedTriangle = function (x, y, d) {
    p.push();
    p.translate(x, y);
    p.triangle(0, d/2, -d/2, -d/2, d/2, -d/2);
    p.pop();
  }

  //選択された図形の種類によってサイズ選択ボタンを表示・非表示にする
  p.showSizeSelector = function (type) {
    currentType = type;
    document.getElementById('ume-size-selector').classList.toggle('hidden', type !== 'ume');
    document.getElementById('awaji-size-selector').classList.toggle('hidden', type !== 'awaji');
  }

  //サイズオプションにクリックイベントを設定する
  p.setupSizeSelectors = function () {
    document.querySelectorAll('.size-selector .size-option').forEach(option => {
      option.addEventListener('click', () => p.selectSize(option.getAttribute('data-size')));
    });
  }

  //選択されたサイズの図形を作成してshapesに格納
  p.selectSize = function (size) {
    let shapeDiameter = size * 50; // 1cm = 50px と仮定
    shapes.push({
      type: currentType,
      x: p.width/2,
      y: p.height/2,
      d: shapeDiameter,
      scale: shapeDiameter / 300,
      ...p.getCurveParameters(currentType, shapeDiameter)
    });
    
    //サイズを選択したらボタンを隠す
    document.getElementById('ume-size-selector').classList.add('hidden');
    document.getElementById('awaji-size-selector').classList.add('hidden');

    p.updateLayerList();
  }

  //2D->3Dへの変換
  p.convert = function () {
    if (mode2D && shapes.length > 0) {
      mode2D = false;
      canvas.remove();
      canvas = p.createCanvas(800, 800, p.WEBGL);
      canvas.parent('canvas-container');
      
      document.getElementById('add-button-container').classList.add('hidden');
      document.getElementById('color-selector').classList.remove('hidden');
      
      // 正面固定ボタンを追加
      fixFrontButton = p.createButton('2D <~> 3D');
      fixFrontButton.position(p.width - 100, p.height - 40);
      fixFrontButton.mousePressed(p.toggleFixedFrontView);

      // zIndexを設定
      for (let i = 0; i < shapes.length; i++) {
        shapes[i].zIndex = i * 8;  // 8ずつマイナス方向にずらす
        //console.log(shapes[i].x, shapes[i].y);
      }

      // compShapesを更新
      compShapes = JSON.parse(JSON.stringify(shapes));
      
      // sketch2を再初期化
      initializeCompleteView();
    }else if(!mode2D){
      p.camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
      mode2D = true;
      canvas.remove();
      canvas = p.createCanvas(800, 800);
      canvas.parent('canvas-container');
      
      document.getElementById('add-button-container').classList.remove('hidden');
      document.getElementById('color-selector').classList.add('hidden');
      
      // 正面固定ボタンを削除
      if (fixFrontButton) {
        fixFrontButton.remove();
      }
    
      // 座標を2Dモードに戻す
      for (let shape of shapes) {
        delete shape.zIndex;
      }
    
      if(mode2D_f == 0){
        mode2D_f = 1;
      }
      //translate(-width/2, -height/2);
    }
  }


  p.getCurveParameters = function (type, circleDiameter) {
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

  p.setupColorSelector = function () {
    let colorSelector = document.getElementById('color-selector');
    colorSelector.querySelectorAll('.color-option').forEach(button => {
      button.addEventListener('click', () => p.changeSelectedCurveColor(button.getAttribute('data-color')));
    });
  }

  p.toggleFixedFrontView = function () {
    cameraFixed = !cameraFixed;
  }

  p.keyPressed = function () {
    if (!mode2D && cameraFixed) {
      if (p.key === 'c' || p.key === 'C') {
        console.log('c key pressed');
        if (selectedCurve) {
          // If a curve is already selected, reset it
          p.resetSelectedCurveColor();
          p.resetSelectionState();
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
          if (p.key >= '0' && p.key <= '9') {
            nowShapeKey = parseInt(p.key);
            console.log("Selected shape:", 'shape' + nowShapeKey);
          }
        } else if (nowIndexKey === -1) {
          // Curve selection phase
          if (p.key >= '0' && p.key <= '9') {
            nowIndexKey = parseInt(p.key);
            console.log("Selected curve index:", nowIndexKey);
            if (innerCurvesData[nowShapeKey] && innerCurvesData[nowShapeKey][nowIndexKey]) {
              selectedCurve = { shapeIndex: nowShapeKey, curveIndex: nowIndexKey };
              console.log("Selected curve:", selectedCurve);
              p.changeSelectedCurveColor({ r: 255, g: 255, b: 0 }); // 黄色
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

  p.changeSelectedCurveColor = function (color) {
    if (selectedCurve) {
      let { shapeIndex, curveIndex } = selectedCurve;
      innerCurvesData[shapeIndex][curveIndex].color = color;
    }
  }

  p.resetSelectedCurveColor = function () {
    if (selectedCurve && originalColor) {
      let { shapeIndex, curveIndex } = selectedCurve;
      innerCurvesData[shapeIndex][curveIndex].color = originalColor;
    }
  }

  p.resetSelectionState = function () {
    nowKey = '';
    nowShapeKey = -1;
    nowIndexKey = -1;
    selectedCurve = null;
    originalColor = null;
  }

  p.mousePressed = function () {
    if (mode2D) {
      for (let shape of shapes) {
        if (p.dist(p.mouseX, p.mouseY, shape.x, shape.y) < shape.d / 2) {
          selectedShape = shape;
          break;
        }
      }
    }
  }

  p.mouseDragged = function () {
    //console.log(p.mouseX, p.mouseY);
    if (mode2D && selectedShape) {
      selectedShape.x = p.constrain(p.mouseX, selectedShape.d/2, p.width - selectedShape.d/2);
      selectedShape.y = p.constrain(p.mouseY, selectedShape.d/2, p.height - selectedShape.d/2);
      //console.log(selectedShape.x ,selectedShape.y);
    }
  }

  p.mouseReleased = function () {
    selectedShape = null;
  }

  p.toggleLayerMenu = function () {
    layerList.classList.toggle('hidden');
  }

  p.updateLayerList = function () {
    layerList.innerHTML = '';
    shapes.forEach((shape, index) => {
      const li = document.createElement('li');
      
      // ドラッグハンドルの作成
      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '&#9776;'; // Unicode for vertical ellipsis (⋮)
      
      // テキスト用のspan要素
      const textSpan = document.createElement('span');
      textSpan.textContent = `${shape.type} ${index}`;
      
      li.appendChild(dragHandle);
      li.appendChild(textSpan);
      
      li.draggable = true;
      li.addEventListener('dragstart', p.dragStart);
      li.addEventListener('dragover', p.dragOver);
      li.addEventListener('drop', p.drop);

      // マウスオーバー時のハイライト
      li.addEventListener('mouseover', () => {
        // リスト内の現在のインデックスを取得
        const dynamicIndex = Array.from(layerList.children).indexOf(li);
        highlightedShapeIndex = dynamicIndex;
      });
      li.addEventListener('mouseout', () => {
          highlightedShapeIndex = -1;
      });

      layerList.appendChild(li);
    });
  }

  p.dragStart = function (e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.classList.add('dragging');

    // 図形のハイライトを消す
    if (highlightedShapeIndex) {
      highlightedShapeIndex = -1;
    }
  }

  p.dragOver = function (e) {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement && e.target !== draggingElement) {
      e.target.classList.add('drag-over');
    }
  }

  p.drop = function (e) {
    e.preventDefault(); // デフォルトのドロップ動作を防止
    const data = e.dataTransfer.getData('text'); // ドラッグ開始時に設定されたデータを取得
    const draggedElement = Array.from(layerList.children).find(el => el.textContent.includes(data)); // ドラッグされた要素を特定
    const dropTarget = e.target.closest('li'); // ドロップ先の最も近いli要素を取得

    if (draggedElement !== dropTarget) { // ドラッグ元とドロップ先が異なる場合のみ処理を行う
        const draggedIndex = Array.from(layerList.children).indexOf(draggedElement); // ドラッグされた要素のインデックスを取得
        const dropIndex = Array.from(layerList.children).indexOf(dropTarget); // ドロップ先要素のインデックスを取得

        // shapes配列の順序を更新
        const [removedShape] = shapes.splice(draggedIndex, 1); // ドラッグされた要素をshapes配列から削除し、その要素を取得
        shapes.splice(dropIndex, 0, removedShape); // 削除した要素をドロップ先の位置に挿入

        // innerCurvesDataの順序も同様に更新
        const [removedInnerCurveData] = innerCurvesData.splice(draggedIndex, 1);
        innerCurvesData.splice(dropIndex, 0, removedInnerCurveData);

        // DOMの順序を更新
        if (dropIndex < draggedIndex) {
            layerList.insertBefore(draggedElement, dropTarget); // ドロップ先が上の場合、その位置に挿入
        } else {
            layerList.insertBefore(draggedElement, dropTarget.nextSibling); // ドロップ先が下の場合、その次の位置に挿入
        }

      // zIndexを更新
      p.updateShapeZIndex();
    }

    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    document.querySelector('.dragging').classList.remove('dragging');
  }

  p.updateShapeZIndex = function () {
    shapes.forEach((shape, index) => {
      shape.zIndex = (shapes.length - 1 - index) * -8;
    });
  }
}, 'canvas-container');

let additionalCanvas;

function initializeCompleteView() {
  const container = document.getElementById('complete-view-container');
  container.innerHTML = ''; // コンテナをクリア

  // キャンバスコンテナを追加
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas-container2';
  container.appendChild(canvasContainer);

  // 既存のスケッチを削除
  if (sketch2) {
    sketch2.remove();
  }

  // sketch2を初期化
  sketch2 = new p5((p) => {
    p.setup = function() {
      let canvas = p.createCanvas(800, 800, p.WEBGL);
      canvas.parent('canvas-container2');
      definePoints();
    }

    p.draw = function() {
      p.background(250);
      drawAxis(p);
      p.orbitControl();
      
      for (let i = compShapes.length - 1; i >= 0; i--) {
        drawShape(p, compShapes[i], i);
      }
    }
  }, 'canvas-container2');

  // 水平線を追加
  const hr = document.createElement('hr');
  container.appendChild(hr);

  // 追加のキャンバスコンテナを追加
  const additionalCanvasContainer = document.createElement('div');
  additionalCanvasContainer.id = 'additional-canvas-container';
  container.appendChild(additionalCanvasContainer);

  // 既存の追加キャンバスを削除
  if (additionalCanvas) {
    additionalCanvas.remove();
  }

  // 追加のキャンバスを初期化
  /*
  additionalCanvas = new p5((p) => {
    p.setup = function() {
      let canvas = p.createCanvas(400, 400);
      canvas.parent('additional-canvas-container');
    }

    p.draw = function() {
      // 追加のキャンバスの描画ロジック
      p.background(200);
      p.text('追加のキャンバス', 10, 30);
      // ここに追加のキャンバスの描画コードを記述
    }
  }, 'additional-canvas-container');*/

  // 追加のテキストコンテンツ
  const additionalContent = document.createElement('h1');
  additionalContent.textContent = 'パーツ';
  container.appendChild(additionalContent);
}

// タブ切り替え時にinitializeCompleteViewを呼び出す
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('label[for="tab2"]').addEventListener('click', initializeCompleteView);
});

/*完成図キャンバスの実装のみ
これと、convert内でcompShapesの更新と関数の呼び出しを追加
function initializeTab2() {
  // タブ2が選択されたときに呼び出される関数
  setTimeout(() => {
    if (sketch2) {
      sketch2.remove(); // 既存のスケッチを削除
    }
    sketch2 = new p5((p) => {
      p.setup = function() {
        let canvas = p.createCanvas(800, 800, p.WEBGL);
        canvas.parent('canvas-container2');
        definePoints();
      }

      p.draw = function() {
        p.background(250);
        drawAxis(p);
        p.orbitControl();
        
        for (let i = compShapes.length - 1; i >= 0; i--) {
          drawShape(p, compShapes[i], i);
        }
      }
    }, 'canvas-container2');
  }, 0);
}
*/

//３次元軸の描画
function drawAxis(p) {
  p.strokeWeight(1);
  p.stroke(255, 0, 0);
  p.line(-400, 0, 0, 400, 0, 0);
  p.stroke(0, 255, 0);
  p.line(0, -400, 0, 0, 400, 0);
  p.stroke(0, 0, 255);
  p.line(0, 0, -400, 0, 0, 400);
}

function drawShape(p, shape, shapeIndex) {
  p.push();
  p.translate(shape.x - p.width/2, shape.y - p.height/2, shape.zIndex);
  let scaleValue = shape.scale * 1.62;
  p.scale(scaleValue);
  //console.log(shape.x, shape.y); 
  let points;
  if (shape.type === 'awaji') {
    points = awaji_points;
  } else if (shape.type === 'ume') {
    points = ume_points;
  }
  
  let innerCurves = createInnerCurves(p, points, shape.numInnerCurves, shape.outerCurveWeight, shape.innerCurveWeight);
  
  p.noFill();
  p.strokeWeight(shape.innerCurveWeight);
  
  let shapeInnerCurves = [];
  for (let i = 0; i < innerCurves.length; i++) {
    let color;
    if (innerCurvesData[shapeIndex] && innerCurvesData[shapeIndex][i]) {
      color = innerCurvesData[shapeIndex][i].color;
    } else {
      color = innerCurveColors[i % innerCurveColors.length];
    }
    
    if (typeof color === 'string') {
      p.stroke(color);
    } else {
      p.stroke(color.r, color.g, color.b);
    }
    
    drawCurveFromPoints(p, innerCurves[i]);
    shapeInnerCurves.push({
      points: innerCurves[i],
      color: color
    });
  }
  
  // インナーカーブのデータを更新または追加
  innerCurvesData[shapeIndex] = shapeInnerCurves;
  
  p.pop();
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

function drawCurveFromPoints(p, pts) {
  p.beginShape();
  p.curveVertex(pts[0].x, pts[0].y, pts[0].z);
  for (let pt of pts) {
    p.curveVertex(pt.x, pt.y, pt.z);
  }
  p.curveVertex(pts[pts.length-1].x, pts[pts.length-1].y, pts[pts.length-1].z);
  p.endShape();
}

function createInnerCurves(p, points, numInnerCurves, outerCurveWeight, innerCurveWeight) {
  let innerCurves = [];
  let curveWidth = outerCurveWeight;

  if (numInnerCurves == 1) {
    innerCurves.push(createOffsetCurve(p, points, 0));
  } else {
    for (let i = 0; i < numInnerCurves; i++) {
      let offset = p.map(i, 0, numInnerCurves - 1, -curveWidth/2 + innerCurveWeight/2, curveWidth/2 - innerCurveWeight/2);
      innerCurves.push(createOffsetCurve(p, points, offset));
    }
  }
  
  return innerCurves;
}

//指定されたオフセットに基づいて元の曲線を変形
function createOffsetCurve(p, originalCurve, offset) {
  return originalCurve.map((pt, index) => {
    let prev, next;

    if (index === 0) {
      // 最初の点の場合、次の点のみを考慮
      next = originalCurve[index + 1];
      prev = { x: pt.x - (next.x - pt.x), y: pt.y - (next.y - pt.y), z: pt.z - (next.z - pt.z) };
    } else if (index === originalCurve.length - 1) {
      // 最後の点の場合、前の点のみを考慮
      prev = originalCurve[index - 1];
      next = { x: pt.x - (prev.x - pt.x), y: pt.y - (prev.y - pt.y), z: pt.z - (prev.z - pt.z) };
    } else {
      // 中間の点の場合、両側の点を考慮
      prev = originalCurve[index - 1];
      next = originalCurve[index + 1];
    }

    let tangent = p.createVector(next.x - prev.x, next.y - prev.y, next.z - prev.z).normalize();
    let normal = p.createVector(-tangent.y, tangent.x, 0).normalize();

    return {
      x: pt.x + normal.x * offset,
      y: pt.y + normal.y * offset,
      z: pt.z + normal.z * offset
    };
  });
}