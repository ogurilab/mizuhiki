//let shapes = [];
let layers = [];
//let mode2D = true;
let ume_points = [], awaji_points = [], awajiRl_points = [], awajiRr_points = [], renzoku_points = [];
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
let sketch2, modalSketch;
let partsSketches = [];
let selectedCurveIndex;

let outerCurveWeight = 30;
let innerCurveWeight = 5;
/*
let innerCurveColors = [
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
  { r: 201, g: 23, b: 30 },
  { r: 187, g: 188, b: 222 },
];*/
let innerCurveColors = [
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
]

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
  let selectedLayerIndex = null;
  let fixFrontButton;
  let mode2D_f = 0;
  let pg;
  let highlightedShapeIndex = -1;
  let highlightedLayerIndex = -1;
  let isLayerManipulating = false;
  let selectedColor = null;
  let pendingShape = null;
  let resizeCornerSize = 10;
  let resizing = null;
  let angle = 0; // 回転角度の初期値
  let previousMouseX; // 前のマウスのX座標
  let slider; // スライダーの変数
  let customizeShapeIndex = -1;
  let customizeLayerIndex = -1;
  let selectedcustomizeShape = null;

  p.setup = function() {
    canvas = p.createCanvas(800, 800);
    canvas.parent('canvas');
    
    // 'add-〇〇-button' 形式のすべてのボタンにイベントリスナーを追加
    document.querySelectorAll('[id^="add-"][id$="-button"]').forEach(button => {
      let shapeType = button.id.split('-')[1];  // '〇〇' の部分を取得
      button.addEventListener('click', () => p.addNewShape(shapeType));
    });

    //document.getElementById('add-ume-button').addEventListener('click', () => p.showSizeSelector('ume'));
    //document.getElementById('add-awaji-button').addEventListener('click', () => p.showSizeSelector('awaji'));
    //document.getElementById('add-renzoku-button').addEventListener('click', () => p.showSizeSelector('renzoku'));
    document.getElementById('convert-button').addEventListener('click', p.convert);
    
    //p.setupSizeSelectors();
    p.setupShapesColorSelector();
    definePoints();
    
    defaultCameraZ = (p.height/2) / p.tan(p.PI/6) * 1.15;
    pg = p.createGraphics(800, 800);

    layerList = document.getElementById('layer-list');
    const layerMenuButton = document.getElementById('layer-menu-button');
    layerMenuButton.addEventListener('click', p.toggleLayerMenu);
    layerList.addEventListener('mousedown', () => {
      isLayerManipulating = true;
    });
  
    document.addEventListener('mouseup', () => {
      isLayerManipulating = false;
    });

    p.documentClickHandler();
    p.setupRotationSlider();

    // レイヤーリストの初期化
    p.updateLayerList();
  }

  p.draw = function () {
    p.background(250);
    //console.log(layers);
    if (mode2D) {
      p.push();
      //resetMatrix(); // 座標系をリセット  
      if (mode2D_f == 1) {
        p.translate(-p.width/2, -p.height/2);
      }
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
          //angle = p.radians(slider.value()); // スライダーの値をラジアンに変換
          
          // 各図形の描画
          //p.rotate(angle); // 回転を適用
          //p.rotate(p.radians(shape.rotation || 0)); // 回転度に基づいて回転

          p.push();
          p.translate(shape.x, shape.y);
          p.rotate(p.radians(shape.rotation));
    
          // 各図形の描画
          if (shape.color) {
            p.fill(shape.color);
          } else  {
            p.noStroke();
            p.noFill();
          }
          if (shape.type === 'awaji') {
            //p.fill(165, 42, 42, 100);
            p.drawInvertedTriangle(0, 0, shape.d);
            //console.log(shape.x, shape.y, shape.d);
            // 逆三角形の右上の頂点にリサイズコーナーを配置
            let cornerX =shape.d / 2;
            let cornerY =-shape.d / 2;
            p.rect(cornerX - resizeCornerSize / 2, cornerY - resizeCornerSize / 2, resizeCornerSize, resizeCornerSize);
          } else if (shape.type === 'ume') {
            //p.fill(165, 42, 42, 100);
            p.ellipse(0, 0, shape.d);
            let markerX =shape.d/2 * p.cos(p.QUARTER_PI);  // QUARTER_PI=45度
            let markerY =shape.d/2 * p.sin(p.QUARTER_PI);
            p.rect(markerX - resizeCornerSize / 2, markerY - resizeCornerSize / 2, resizeCornerSize, resizeCornerSize);
          } else if (shape.type === 'renzoku') {
            //p.fill(165, 42, 42, 100);
            p.drawRenzokuawaji(0, 0, shape.w, shape.l);
            p.rect(shape.w/2 - resizeCornerSize/2, shape.l/2 - resizeCornerSize/2, resizeCornerSize, resizeCornerSize);
          }
          p.pop();
        });
      });
      // サイズを変更する処理
      if (resizing) {
        p.resizeShape(resizing);
      }
      // マウスオーバー時ハイライトの描画
      if (highlightedShapeIndex !== -1 && highlightedLayerIndex !== -1) {
        const layer = layers[highlightedLayerIndex];
        try {
          const shape = layer.shapes[highlightedShapeIndex];
          p.noFill();
          p.stroke(0, 255, 0);
          p.strokeWeight(4);
          if (shape.d){
            p.ellipse(shape.x, shape.y, shape.d + 20);
          } else {
            if (shape.w > shape.l){
              p.ellipse(shape.x, shape.y, shape.w + 20);
            } else {
              p.ellipse(shape.x, shape.y, shape.l + 20);
            }
          }
        } catch (error) { // レイヤー変換の一瞬エラーが出るため
          console.error('Shape or Layer not found for indices:', highlightedLayerIndex, highlightedShapeIndex);
        }
      }
      // 図形選択ハイライトの描画
      if (customizeShapeIndex !== -1 && customizeLayerIndex !== -1) {
        const layer = layers[customizeLayerIndex];
        try {
          const shape = layer.shapes[customizeShapeIndex];
          p.noFill();
          p.stroke(255, 0, 0);
          p.strokeWeight(4);
          if (shape.d){
            p.ellipse(shape.x, shape.y, shape.d + 20);
          } else {
            if (shape.w > shape.l){
              p.ellipse(shape.x, shape.y, shape.w + 20);
            } else {
              p.ellipse(shape.x, shape.y, shape.l + 20);
            }
          }
        } catch (error) { // レイヤー変換の一瞬エラーが出るため
          console.error('Shape or Layer not found for indices:', customizeLayerIndex, customizeShapeIndex);
        }
      }
      p.pop();
    } else {
      drawAxis(p);
      
      if (!cameraFixed && !isLayerManipulating) {
        p.orbitControl();
      } else if (cameraFixed) {
        // カメラを正面に固定
        p.camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
      }
      
      layers.forEach((layer, layerIndex) => {
        layer.shapes.forEach((shape, index) => {
          drawShape(p, shape, layerIndex, index, 0, -1);
        });
      });    
      
      if (cameraFixed) {
        //p.drawLabels();
      }
      
      // マウスオーバー時ハイライトの描画
      if (highlightedShapeIndex !== -1 && highlightedLayerIndex !== -1) {
        const layer = layers[highlightedLayerIndex];
        try {
          const shape = layer.shapes[highlightedShapeIndex];
          p.push();
          p.translate(shape.x - p.width/2, shape.y - p.height/2, shape.zIndex + 1);
          p.noFill();
          p.stroke(0, 255, 0);
          p.strokeWeight(4);
          
          // ellipseを使用して円を描画
          if (shape.d){
            p.ellipse(0, 0, shape.d * 1.1, shape.d * 1.1);
          } else {
            if (shape.w > shape.l){
              p.ellipse(0, 0, shape.w * 1.1, shape.w * 1.1);
            } else {
              p.ellipse(0, 0, shape.l * 1.1, shape.l * 1.1);
            }
          }
          p.ellipse(0, 0, shape.d * 1.1, shape.d * 1.1);
          p.pop();
        } catch (error) { // レイヤー変換の一瞬エラーが出るため
          console.error('Shape or Layer not found for indices:', highlightedLayerIndex, highlightedShapeIndex);
        }
      }
      // 図形選択ハイライトの描画
      if (customizeShapeIndex !== -1 && customizeLayerIndex !== -1) {
        const layer = layers[customizeLayerIndex];
        try {
          const shape = layer.shapes[customizeShapeIndex];
          p.push();
          p.translate(shape.x - p.width/2, shape.y - p.height/2, shape.zIndex + 1);
          p.noFill();
          p.stroke(255, 0, 0);
          p.strokeWeight(4);
          
          // ellipseを使用して円を描画
          if (shape.d){
            p.ellipse(0, 0, shape.d * 1.1, shape.d * 1.1);
          } else {
            if (shape.w > shape.l){
              p.ellipse(0, 0, shape.w * 1.1, shape.w * 1.1);
            } else {
              p.ellipse(0, 0, shape.l * 1.1, shape.l * 1.1);
            }
          }
          p.ellipse(0, 0, shape.d * 1.1, shape.d * 1.1);
          p.pop();
        } catch (error) { // レイヤー変換の一瞬エラーが出るため
          console.error('Shape or Layer not found for indices:', customizeLayerIndex, customizeShapeIndex);
        }
      }
    }
  }
/*
  p.drawLabels = function () {
    // オフスクリーンバッファをクリア
    pg.clear();
    
    pg.push();
    pg.textSize(30);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.fill(0);  // 黒色のテキスト
    pg.noStroke();
    
    for (let layer of layers) {
      for (let i = 0; i < layer.shapes.length; i++) {
        let shape = layer.shapes[i];
        let x = shape.x;
        let y = shape.y;
        let z = shape.zIndex || 0;  // zIndexがない場合は0を使用
        
        // ラベルのテキスト
        let labelText = `${i}`;
        
        // ラベルの位置（形状の右上に配置）
        let labelX, labelY;
        if (shape.d) {
          labelX = x + (shape.d / 2);
          labelY = y - (shape.d / 2);
        } else {
          labelX = x + shape.w / 1.5;
          labelY = y - shape.l / 1.5;
        }
        
        // zに応じてテキストサイズを調整
        let adjustedSize = 30 / (1 + p.abs(z) * 0.01);
        pg.textSize(adjustedSize);
        
        // ラベルを描画
        pg.text(labelText, labelX, labelY);
      }
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
*/
  //逆三角形の描画
  p.drawInvertedTriangle = function (x, y, d) {
    p.push();
    p.translate(x, y);
    p.triangle(0, d/2, -d/2, -d/2, d/2, -d/2);
    p.pop();
  }

  //連続あわじ結びの描画
  p.drawRenzokuawaji = function (x, y, w, l) {
    p.push();
    //p.translate(x, y);
    p.rectMode(p.CENTER);
    p.rect(x, y, w, l);
    p.pop();
  }
/*
  //選択された図形の種類によってサイズ選択ボタンを表示・非表示にする
  p.showSizeSelector = function (type) {
    currentType = type;
    document.getElementById('ume-size-selector').classList.toggle('hidden', type !== 'ume');
    document.getElementById('awaji-size-selector').classList.toggle('hidden', type !== 'awaji');
    document.getElementById('renzoku-size-selector').classList.toggle('hidden', type !== 'renzoku');
  }

  //サイズオプションにクリックイベントを設定する
  p.setupSizeSelectors = function () {
    document.querySelectorAll('.size-selector .size-option').forEach(option => {
      option.addEventListener('click', () => p.selectSize(option.getAttribute('data-size')));
    });
  }

  //選択されたサイズの図形を作成してshapesに格納
  p.selectSize = function (size) {
    let newShape;
    if (size.includes(' ')) {
      let shapeLength = size.toString().split(' ')[0] * 50; // 1cm = 50px と仮定
      let shapeWidth = size.toString().split(' ')[1] * 50; 
      newShape = {
        type: currentType,
        x: p.width/2,
        y: p.height/2,
        w: shapeWidth,
        l: shapeLength,
        scale: Math.max(shapeLength, shapeWidth) / 500,
        //...p.getCurveParameters(currentType, 0, shapeLength, shapeWidth)
      };
    } else {
      let shapeDiameter = size * 50; // 1cm = 50px と仮定
      newShape = {
        type: currentType,
        x: p.width/2,
        y: p.height/2,
        d: shapeDiameter,
        scale: shapeDiameter / 300,
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      };
    }

    pendingShape = newShape;
    selectedColor = null;
    document.getElementById('color-selector').classList.remove('hidden');
    
    //サイズを選択したらボタンを隠す
    document.getElementById('ume-size-selector').classList.add('hidden');
    document.getElementById('awaji-size-selector').classList.add('hidden');
    document.getElementById('renzoku-size-selector').classList.add('hidden');
  }
*/

  //図形ボタンが押されたら一定のサイズで作成しpendingShapeに格納
  p.addNewShape = function (type) {
    let newShape;
    if (type === 'renzoku') {
      let shapeLength = 5 * 50; // 1cm = 50px と仮定
      let shapeWidth = 2 * 50; 
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        w: shapeWidth,
        l: shapeLength,
        scale: Math.max(shapeLength, shapeWidth) / 500,
        rotation: 0,
        //...p.getCurveParameters(currentType, 0, shapeLength, shapeWidth)
      };
    } else if (type === 'awaji' || type === 'ume'){
      let shapeDiameter = 3 * 50; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        d: shapeDiameter,
        scale: shapeDiameter / 300,
        rotation: 0,
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      };
    }

    pendingShape = newShape;
    selectedColor = null;
    document.getElementById('color-selector').classList.remove('hidden');
  }

  p.setupShapesColorSelector = function () {
    let colorSelector = document.getElementById('color-selector');
    colorSelector.querySelectorAll('.color-option').forEach(button => {
      button.addEventListener('click', () => {
        selectedColor = button.getAttribute('data-color');
        if (mode2D == true) {// 図景全体の色設定
          colorSelector.classList.add('hidden');
          if (pendingShape) {
            p.addDecidedShape();
          }
        } else if (selectedCurve && selectedcustomizeShape) {
          console.log('ok');
          // 選択されたカーブに色を適用
          let { layerIndex, shapeIndex, curveIndex } = selectedCurve;
          innerCurvesData[layerIndex][shapeIndex][curveIndex].color = selectedColor;
          
          p.changeSelectedCurveColor(button.getAttribute('data-color'));
          
          // カーブ番号の選択をリセット
          selectedCurve = null;
          nowKey = null;
        } else {// インナーカーブの色設定
          //p.changeSelectedCurveColor(button.getAttribute('data-color'));
        }
      });
    });
  }

  p.addDecidedShape = function () {
    if (pendingShape && selectedColor) {
        pendingShape.color = selectedColor;
        //pendingShape.innerCurveColor = selectedColor; // インナーカーブ用の色も設定
        let newLayer = {name: `Layer ${layers.length + 1}`, shapes: [pendingShape]};
        layers.push(newLayer);

        p.updateLayerList();
        
        // zIndexを設定
        let zOffset = 0;
        layers.forEach(layer => {
            layer.shapes.forEach(shape => {
                shape.zIndex = zOffset;
            });
            zOffset += 8;
        });

        // compShapesを更新
        compShapes = layers.flatMap(layer => layer.shapes);
  
        // innerCurvesData の初期化
        let newLayerIndex = layers.length - 1; // 新しいレイヤーのインデックス
        if (!innerCurvesData[newLayerIndex]) {
            innerCurvesData[newLayerIndex] = [];
        }
        //innerCurvesData[newLayerIndex].push([]);  // 新しい shape に対応する空のデータを追加（drop()でやっているためなくていいっぽい？）

        pendingShape = null;
        selectedColor = null;  // 色の選択をリセット
    }
  }

  //2D->3Dへの変換
  p.convert = function () {
    if (mode2D && layers.length > 0) {
      mode2D = false;
      canvas.remove();
      canvas = p.createCanvas(800, 800, p.WEBGL);
      canvas.parent('canvas');
      
      document.getElementById('add-button-container').classList.add('hidden');
      //document.getElementById('color-selector').classList.remove('hidden');
      document.getElementById('color-label').classList.remove('hidden');
      //document.getElementById('color-option').classList.remove('hidden');
      
      // 正面固定ボタンを追加
      fixFrontButton = p.createButton('2D <~> 3D');
      fixFrontButton.position(p.width - 100, p.height - 40);
      fixFrontButton.mousePressed(p.toggleFixedFrontView);

      // サイズ決定
      layers.forEach((layer) => {
        layer.shapes.forEach((shape) => {
            if (shape.d) {
              shape.scale = shape.d/300;
              decideSizeParameters(shape, shape.type, shape.d, 0, 0);
            } else {
              shape.scale = Math.max(shape.l, shape.w) / 500;
              decideSizeParameters(shape, shape.type, 0, shape.w, shape.l);
            }
        });
      });

      // zIndexを設定
      /*
      let zOffset = 0;
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
          shape.zIndex = zOffset;
        });
          zOffset += 8;
      });*/

      // compShapesを更新
      //compShapes = layers.flatMap(layer => layer.shapes);
        
      // sketch2を再初期化
      //initializeTab2();
    }else if(!mode2D){
      p.camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
      mode2D = true;
      canvas.remove();
      canvas = p.createCanvas(800, 800);
      canvas.parent('canvas');
      
      document.getElementById('add-button-container').classList.remove('hidden');
      document.getElementById('color-selector').classList.add('hidden');
      document.getElementById('color-label').classList.add('hidden');
      //document.getElementById('color-option').classList.add('hidden');
      
      // 正面固定ボタンを削除
      if (fixFrontButton) {
        fixFrontButton.remove();
      }
    
      // 座標を2Dモードに戻す
      /*
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
          delete shape.zIndex;
        });
      });*/
    
      if(mode2D_f == 0){
        mode2D_f = 1;
      }
      //translate(-width/2, -height/2);
    }
    }
/*
  p.decideSizeParameters = function (shape, type, circleDiameter, shapeWidth, shapeLength) {
    let cmSize = circleDiameter / 50;
    if (circleDiameter != 0) {
      cmSize = circleDiameter / 50; // ピクセルをセンチメートルに変換
    } else {
      cmSize = shapeLength / 50;
    }

    // デフォルトのパラメータ
    let defaultParams = {
      numInnerCurves: 4,
      outerCurveWeight: 30,
      innerCurveWeight: 6.5
    };

    // モデルの種類ごとにパラメータを定義
    let params = {
      ume: {
        1.0: { numInnerCurves: 1, outerCurveWeight: 15, innerCurveWeight: 5 , materialCm: 30 },
        1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
        2.3: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 30 },
        2.8: { numInnerCurves: 4, outerCurveWeight: 26, innerCurveWeight: 5 , materialCm: 30 },
        3.3: { numInnerCurves: 5, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 },
        4.0: { numInnerCurves: 6, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 }
      },
      awaji: {
        1: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 , materialCm: 30 },
        1.5: { numInnerCurves: 2, outerCurveWeight: 19, innerCurveWeight: 5 , materialCm: 30 },
        2: { numInnerCurves: 3, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 30 },
        2.5: { numInnerCurves: 4, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 },
        3: { numInnerCurves: 5, outerCurveWeight: 33, innerCurveWeight: 5 , materialCm: 30 }
      },
      renzoku: {
        2: { numInnerCurves: 1, outerCurveWeight: 8, innerCurveWeight: 5 , materialCm: 30 },
        3.3: { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5 , materialCm: 30 },
        4: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 30 },
        5.5: { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 30 }
      },
      // その他のモデルが追加される場合はここに定義
      other: {
        1: { numInnerCurves: 1, outerCurveWeight: 12, innerCurveWeight: 5 , materialCm: 30 },
        1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
        2: { numInnerCurves: 3, outerCurveWeight: 24, innerCurveWeight: 5 , materialCm: 30 },
        2.5: { numInnerCurves: 4, outerCurveWeight: 28, innerCurveWeight: 5 , materialCm: 30 },
        3: { numInnerCurves: 5, outerCurveWeight: 32, innerCurveWeight: 5 , materialCm: 30 }
      }
    };

    // 指定されたタイプが存在しない場合、デフォルトパラメータを適用
    if (!params[type]) {
      shape.numInnerCurves = defaultParams.numInnerCurves;
      shape.outerCurveWeight = defaultParams.outerCurveWeight;
      shape.innerCurveWeight = defaultParams.innerCurveWeight;
      return;
    }
    // 使用可能なサイズキーを取得して、数値に変換
    let availableSizes = Object.keys(params[type]).map(size => Number(size)).sort((a, b) => a - b);
    // 初期値として最も近いサイズを最初の要素に設定
    let closestSize = availableSizes[0];
    // 各サイズと比較して、cmSize以下でcmSizeに最も近いサイズを探す
    for (let i = 1; i < availableSizes.length; i++) {
      let currentSize = availableSizes[i];
      // 現在のサイズがcmSizeを超えたらループを終了、越える直前のものをサイズとして設定
      if (currentSize > cmSize) {
        break;
      }
      closestSize = currentSize;
    }

    // 最も近いサイズに対応するパラメータを shape に適用
    let closestParams = params[type][closestSize];
    shape.numInnerCurves = closestParams.numInnerCurves;
    //shape.outerCurveWeight = closestParams.outerCurveWeight;
    shape.innerCurveWeight = closestParams.innerCurveWeight;
    shape.outerCurveWeight = cmSize * 8;  // shapeSize に基づいてスケール
    // ↑図形によって難しいようなら各パラメータのouterCurveWeightの場所に調整値を入れる
  }*/
/*
  p.getCurveParameters = function (type, circleDiameter, shapeLength, shapeWidth) {
    let cmSize = circleDiameter / 50;
    if (circleDiameter != 0) {
      cmSize = circleDiameter / 50; // ピクセルをセンチメートルに変換
    } else {
      cmSize = shapeLength / 50;
    }

    // デフォルトのパラメータ
    let defaultParams = {
      numInnerCurves: 4,
      outerCurveWeight: 30,
      innerCurveWeight: 6.5
    };

    // モデルの種類ごとにパラメータを定義
    let params = {
      ume: {
        1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
        2.3: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 30 },
        2.8: { numInnerCurves: 4, outerCurveWeight: 26, innerCurveWeight: 5 , materialCm: 30 },
        3.3: { numInnerCurves: 5, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 },
        4: { numInnerCurves: 6, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 }
      },
      awaji: {
        1: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 , materialCm: 30 },
        1.5: { numInnerCurves: 2, outerCurveWeight: 19, innerCurveWeight: 5 , materialCm: 30 },
        2: { numInnerCurves: 3, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 30 },
        2.5: { numInnerCurves: 4, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 },
        3: { numInnerCurves: 5, outerCurveWeight: 33, innerCurveWeight: 5 , materialCm: 30 }
      },
      renzoku: {
        2: { numInnerCurves: 1, outerCurveWeight: 8, innerCurveWeight: 5 , materialCm: 30 },
        3.3: { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5 , materialCm: 30 },
        4: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 30 },
        5.5: { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 30 }
      },
      // その他のモデルが追加される場合はここに定義
      other: {
        1: { numInnerCurves: 1, outerCurveWeight: 12, innerCurveWeight: 5 , materialCm: 30 },
        1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
        2: { numInnerCurves: 3, outerCurveWeight: 24, innerCurveWeight: 5 , materialCm: 30 },
        2.5: { numInnerCurves: 4, outerCurveWeight: 28, innerCurveWeight: 5 , materialCm: 30 },
        3: { numInnerCurves: 5, outerCurveWeight: 32, innerCurveWeight: 5 , materialCm: 30 }
      }
    };

    // タイプが指定されていない、または対応するサイズがない場合はデフォルトを返す
    if (!params[type] || !params[type][cmSize]) {
      return defaultParams;
    }

    // 該当するタイプとサイズのパラメータを返す
    return params[type][cmSize];
  }
*/
  p.toggleFixedFrontView = function () {
    cameraFixed = !cameraFixed;
  }

  p.selectCurve = function (layerIndex, shapeIndex) {
    if (!mode2D) {
      p.keyPressed = function() {
        if (selectedcustomizeShape && p.key >= '0' && p.key <= '9') {
          if (nowKey) {
            p.changeSelectedCurveColor(originalColor);
          }
          nowKey = p.key;
          curveIndex = p.key;
          selectedCurve = { layerIndex: layerIndex, shapeIndex: shapeIndex, curveIndex: curveIndex };
          //console.log("Selected curve:", selectedCurve);
          // 元の色を保存
          originalColor = innerCurvesData[layerIndex][shapeIndex][curveIndex].color;
          p.changeSelectedCurveColor({ r: 255, g: 255, b: 0 }); // 黄色
        } else if (p.key >= '0' && p.key <= '9') {
          // 他のキーが押された場合、選択を解除して色を元に戻す
          if (selectedCurve) {
            let { layerIndex, shapeIndex, curveIndex } = selectedCurve;
            innerCurvesData[layerIndex][shapeIndex][curveIndex].color = originalColor;
            
            // 色を元に戻す
            p.changeSelectedCurveColor(originalColor);
            
            // 選択解除
            originalColor = null;
            nowKey = null;
            selectedCurve = null;
            //console.log('Curve selection canceled.');
          }
        }
      }
    }
  }
/*
  p.keyPressed = function () {
    if (!mode2D && cameraFixed) {
      if (p.key === 'c' || p.key === 'C') {
        console.log('c key pressed');
        if (selectedCurve) {
          p.resetSelectedCurveColor();
          p.resetSelectionState();
        } 
        nowKey = 'c';
        nowLayerKey = -1;
        nowShapeKey = -1;
        nowIndexKey = -1;
      }
      
      if (nowKey === 'c') {
        if (nowLayerKey === -1) {
          // レイヤー選択フェーズ
          if (p.key >= '0' && p.key <= '9') {
            nowLayerKey = parseInt(p.key);
            if (nowLayerKey < layers.length) {
              console.log("Selected layer:", nowLayerKey);
            } else {
              console.log("Invalid layer index");
              nowLayerKey = -1;
            }
          }
        } else if (nowShapeKey === -1) {
          // 図形選択フェーズ
          if (p.key >= '0' && p.key <= '9') {
            nowShapeKey = parseInt(p.key);
            if (nowShapeKey < layers[nowLayerKey].shapes.length) {
              console.log("Selected shape:", nowShapeKey);
            } else {
              console.log("Invalid shape index");
              nowShapeKey = -1;
            }
          }
        } else if (nowIndexKey === -1) {
          // カーブ選択フェーズ
          if (p.key >= '0' && p.key <= '9') {
            nowIndexKey = parseInt(p.key);
            let shape = layers[nowLayerKey].shapes[nowShapeKey];
            if (innerCurvesData[nowLayerKey] && 
                innerCurvesData[nowLayerKey][nowShapeKey] && 
                innerCurvesData[nowLayerKey][nowShapeKey][nowIndexKey]) {
              selectedCurve = { layerIndex: nowLayerKey, shapeIndex: nowShapeKey, curveIndex: nowIndexKey };
              console.log("Selected curve:", selectedCurve);
              p.changeSelectedCurveColor({ r: 255, g: 255, b: 0 }); // 黄色
            } else {
              console.log("Invalid curve index");
              nowIndexKey = -1;
            }
          }
        }
      }
    }
  }
  */
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
      let { layerIndex, shapeIndex, curveIndex } = selectedCurve;
      if (innerCurvesData[layerIndex] && 
          innerCurvesData[layerIndex][shapeIndex] && 
          innerCurvesData[layerIndex][shapeIndex][curveIndex]) {
        innerCurvesData[layerIndex][shapeIndex][curveIndex].color = color;
      }
    }
  }

  p.resetSelectedCurveColor = function () {
    if (selectedCurve && originalColor) {
      let { layerIndex, shapeIndex, curveIndex } = selectedCurve;
      if (innerCurvesData[layerIndex] && 
          innerCurvesData[layerIndex][shapeIndex] && 
          innerCurvesData[layerIndex][shapeIndex][curveIndex]) {
        innerCurvesData[layerIndex][shapeIndex][curveIndex].color = originalColor;
      }
    }
  }

  p.resetSelectionState = function () {
    nowKey = '';
    nowLayerKey = -1;
    nowShapeKey = -1;
    nowIndexKey = -1;
    selectedCurve = null;
    originalColor = null;
  }

  p.mousePressed = function () {
    // リサイズ処理
    for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex--) {
      let layer = layers[layerIndex];
      for (let shapeIndex = layer.shapes.length - 1; shapeIndex >= 0; shapeIndex--) {
        let shape = layer.shapes[shapeIndex];
  
        // 図形ごとの判定
        if (shape.type === 'awaji') {
          let cornerX = shape.x + shape.d / 2;
          let cornerY = shape.y - shape.d / 2;
          if (p.mouseX > cornerX - resizeCornerSize && p.mouseX < cornerX &&
              p.mouseY > cornerY - resizeCornerSize && p.mouseY < cornerY) {
                console.log("ok");
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'ume') {
          let markerX = shape.x + shape.d / 2 * p.cos(p.QUARTER_PI);
          let markerY = shape.y + shape.d / 2 * p.sin(p.QUARTER_PI);
          if (p.mouseX > markerX - resizeCornerSize / 2 && p.mouseX < markerX + resizeCornerSize / 2 &&
              p.mouseY > markerY - resizeCornerSize / 2 && p.mouseY < markerY + resizeCornerSize / 2) {
                console.log("ok");
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'renzoku') {
          let cornerX = shape.x + shape.w / 2;
          let cornerY = shape.y + shape.l / 2;
          if (p.mouseX > cornerX - resizeCornerSize / 2 && p.mouseX < cornerX + resizeCornerSize / 2 &&
              p.mouseY > cornerY - resizeCornerSize / 2 && p.mouseY < cornerY + resizeCornerSize / 2) {
                console.log("ok");
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        }
      }
    }
    resizing = null; // どの図形にも当たらなかった場合はリサイズ状態を解除

    // 図形移動
    if (mode2D && document.getElementById('tab1').checked) {
      for (let i = 0; i < layers.length; i++) {
        for (let j = 0; j < layers[i].shapes.length; j++) {
          let shape = layers[i].shapes[j];
          if (shape.d) {
            if (p.dist(p.mouseX, p.mouseY, shape.x, shape.y) < shape.d / 2) {
              selectedShape = shape;
              selectedLayerIndex = i;
              break;
            }
          } else {
            if (p.mouseX > shape.x - shape.w / 2 && p.mouseX < shape.x + shape.w / 2 &&
            p.mouseY > shape.y - shape.l / 2 && p.mouseY < shape.y + shape.l / 2) {
            
            selectedShape = shape;
            selectedLayerIndex = i;
            break;
            }
          }
        }
        if (selectedShape) break;
      }
    }
  }
  
  p.mouseDragged = function () {
    // リサイズ処理
    if (resizing) {
      p.resizeShape(resizing);
    }
    // 図形移動
    if (mode2D && selectedShape && document.getElementById('tab1').checked) {
      if (selectedShape.d) {
        selectedShape.x = p.constrain(p.mouseX, selectedShape.d/2, p.width - selectedShape.d/2);
        selectedShape.y = p.constrain(p.mouseY, selectedShape.d/2, p.height - selectedShape.d/2);
      } else {
        selectedShape.x = p.constrain(p.mouseX, selectedShape.w/2, p.width - selectedShape.w/2);
        selectedShape.y = p.constrain(p.mouseY, selectedShape.l/2, p.height - selectedShape.l/2);
      }
    }
  }
  
  p.mouseReleased = function () {
    // リサイズ処理
    if (resizing) {
      resizing = null;
    }
    // 図形移動
    if (mode2D) {
      selectedShape = null;
      selectedLayerIndex = -1;
    }
  }

  p.resizeShape = function (resizing) {
    let layer = layers[resizing.layerIndex];
    let shape = layer.shapes[resizing.shapeIndex];
  
    let minSize; // 最小サイズ
    let maxSize; // 最大サイズ
    let minWidth, maxWidth;
    let minLength, maxLength;
    if (shape.type === 'awaji') {
      minSize = 30;
      maxSize = 200;
      shape.d = p.constrain((p.mouseX - shape.x) * 2, minSize, maxSize);
    } else if (shape.type === 'ume') {
      minSize = 50;
      maxSize = 200;
      shape.d = p.constrain(p.dist(shape.x, shape.y, p.mouseX, p.mouseY) * 2, minSize, maxSize);
    } else if (shape.type === 'renzoku') {
      minWidth = 40;
      maxWidth = 150;
      minLength = 70;
      maxLength = 400;
      // 現在のサイズを一時的に取得
      let newWidth = p.constrain((p.mouseX - shape.x) * 2, minWidth, maxWidth);
      let newLength = p.constrain((p.mouseY - shape.y) * 2, minLength, maxLength);
      
      // 幅と高さの差を計算
      let sizeDifference = newLength - newWidth;

        // 差が閾値以内の場合のみサイズを更新
        if (sizeDifference >= 20) {
          shape.w = newWidth;
          shape.l = newLength;
      }
    }
  }  

  p.toggleLayerMenu = function () {
    layerList.classList.toggle('hidden');
  }

  p.updateLayerList = function () {
    layerList.innerHTML = '';

    layers.forEach((layer, layerIndex) => {
      const layerItem = document.createElement('li');
      layerItem.className = 'layer-item';
      layerItem.draggable = true;
      layerItem.innerHTML = `
        <span class="layer-name">${layer.name}</span>
        <ul class="shape-list"></ul>
      `;

      const shapeList = layerItem.querySelector('.shape-list');

      layer.shapes.forEach((shape, shapeIndex) => {
        const shapeItem = document.createElement('li');
        shapeItem.className = 'shape-item';
        shapeItem.draggable = true;
        shapeItem.innerHTML = `
          <span class="drag-handle">&#9776;</span>
          <span>${shape.type} ${shapeIndex}</span>
        `;

        shapeItem.addEventListener('dragstart', (e) => p.dragStart(e, 'shape', layerIndex, shapeIndex));
        shapeItem.addEventListener('dragover', p.dragOver);
        shapeItem.addEventListener('drop', (e) => p.drop(e, 'shape'));

        // マウスオーバー時のハイライト
        shapeItem.addEventListener('mouseover', () => {
          const shapeItems = shapeList.querySelectorAll('.shape-item');
          const dynamicIndex = Array.from(shapeItems).indexOf(shapeItem);
          highlightedShapeIndex = dynamicIndex;

          // 所属レイヤーを見つける
          const layerIndexOfShape = layers.findIndex(layer => layer.shapes.includes(shape));
          highlightedLayerIndex = layerIndexOfShape;
          //p.redraw();
        });

        shapeItem.addEventListener('mouseout', () => {
          highlightedShapeIndex = -1;
          highlightedLayerIndex = -1;
          //p.redraw();
        });

        shapeItem.addEventListener('click', () => {
          //event.stopPropagation();  // 他のクリックイベントが発生しないようにする
          const shapeItems = shapeList.querySelectorAll('.shape-item');
          const dynamicIndex = Array.from(shapeItems).indexOf(shapeItem);
        
          // クリックされた図形のインデックスを取得
          const layerIndexOfShape = layers.findIndex(layer => layer.shapes.includes(shape));

          // クリックされた図形を選択状態に設定
          customizeShapeIndex = dynamicIndex;
          customizeLayerIndex = layerIndexOfShape;
          // 図形を選択、カスタマイズ可能に
          p.customizeShape(layerIndexOfShape, dynamicIndex);
        });
        
        shapeList.appendChild(shapeItem);
      });

      layerItem.addEventListener('dragstart', (e) => p.dragStart(e, 'layer', layerIndex));
      layerItem.addEventListener('dragover', p.dragOver);
      layerItem.addEventListener('drop', (e) => p.drop(e, 'layer'));

      layerList.appendChild(layerItem);
    });
  }

  p.dragStart = function (e, type, layerIndex, shapeIndex) {
    isLayerManipulating = true;
    e.stopPropagation(); // イベントの伝播を停止
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, layerIndex, shapeIndex }));
    e.target.classList.add('dragging');
  }

  p.dragOver = function (e) {
    e.preventDefault();
    e.stopPropagation(); // イベントの伝播を停止
    e.target.classList.add('drag-over');
  }

  p.drop = function (e) {
    isLayerManipulating = false;
    e.preventDefault();
    e.stopPropagation(); // イベントの伝播を停止

    const data = JSON.parse(e.dataTransfer.getData('text'));
    const { type, layerIndex, shapeIndex } = data;

    let dropTarget = e.target;
    let dropType = 'layerList'; // デフォルトはレイヤーリスト全体

    if (dropTarget.closest('.shape-item')) {
      dropType = 'shape';
      dropTarget = dropTarget.closest('.shape-item');
    } else if (dropTarget.closest('.layer-item')) {
      dropType = 'layer';
      dropTarget = dropTarget.closest('.layer-item');
    }

    dropTarget.classList.remove('drag-over');
    
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement) {
      draggingElement.classList.remove('dragging');
    }

    if (type === 'layer' && dropType === 'layer') {
      const dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);

      if (layerIndex !== dropLayerIndex) {
        const [draggedLayer] = layers.splice(layerIndex, 1);// 現在のレイヤーリストからドラッグされたレイヤーを取り出し、削除
        layers.splice(dropLayerIndex, 0, draggedLayer);// 削除したレイヤーをドロップ先のインデックスに挿入
        // innerCurvesData も対応するレイヤーの情報を移動
        const [draggedCurveData] = innerCurvesData.splice(layerIndex, 1);// innerCurvesData からドラッグされたレイヤーに対応するデータを取り出し、削除
        innerCurvesData.splice(dropLayerIndex, 0, draggedCurveData);// 削除したデータをドロップ先のインデックスに挿入
      }
    } else if (type === 'shape') {
      let dropLayerIndex;
      let dropShapeIndex = -1;

      if (dropType === 'layer') {
        dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);
      } else if (dropType === 'shape') {
        const dropLayerItem = dropTarget.closest('.layer-item');
        dropLayerIndex = Array.from(layerList.children).indexOf(dropLayerItem);
        const dropShapeList = dropLayerItem.querySelector('.shape-list');
        dropShapeIndex = Array.from(dropShapeList.children).indexOf(dropTarget);
      } else if (dropType === 'layerList') {
        // 新しいレイヤーを作成
        dropLayerIndex = layers.length;
        layers.push({name: `Layer ${layers.length + 1}`, shapes: []});
      }

      if (dropLayerIndex !== undefined) {
        const [draggedShape] = layers[layerIndex].shapes.splice(shapeIndex, 1);
        const [draggedCurveData] = innerCurvesData[layerIndex].splice(shapeIndex, 1); // innerCurvesData からも削除

        if (dropShapeIndex === -1) {
            layers[dropLayerIndex].shapes.push(draggedShape);
            innerCurvesData[dropLayerIndex].push(draggedCurveData); // innerCurvesData にも追加
        } else {
            layers[dropLayerIndex].shapes.splice(dropShapeIndex, 0, draggedShape);
            innerCurvesData[dropLayerIndex].splice(dropShapeIndex, 0, draggedCurveData); // innerCurvesData にも挿入
        }
      }
    }

    p.updateLayerList();
    p.updateShapeZIndex();
  }

/* DOMの順序の更新をの順序の更新を個別に行い、最後のupdateLayerListの呼び出しをなくしている
    現状、以下のやり方だとエラー吐いてる
  p.drop = function (e) {
    e.preventDefault();
    e.stopPropagation();

    const data = JSON.parse(e.dataTransfer.getData('text'));
    const { type, layerIndex, shapeIndex } = data;

    let dropTarget = e.target;
    let dropType = 'layerList';

    if (dropTarget.closest('.shape-item')) {
        dropType = 'shape';
        dropTarget = dropTarget.closest('.shape-item');
    } else if (dropTarget.closest('.layer-item')) {
        dropType = 'layer';
        dropTarget = dropTarget.closest('.layer-item');
    }

    dropTarget.classList.remove('drag-over');
    
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement) {
        draggingElement.classList.remove('dragging');
    }

    if (type === 'layer' && dropType === 'layer') {
        const dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);

        if (layerIndex !== dropLayerIndex) {
            const [draggedLayer] = layers.splice(layerIndex, 1);
            layers.splice(dropLayerIndex, 0, draggedLayer);
            
            // DOM の順序を更新
            if (dropLayerIndex < layerIndex) {
                layerList.insertBefore(draggingElement, dropTarget);
            } else {
                layerList.insertBefore(draggingElement, dropTarget.nextSibling);
            }
        }
    } else if (type === 'shape') {
        let dropLayerIndex;
        let dropShapeIndex = -1;

        if (dropType === 'layer') {
            dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);
        } else if (dropType === 'shape') {
            const dropLayerItem = dropTarget.closest('.layer-item');
            dropLayerIndex = Array.from(layerList.children).indexOf(dropLayerItem);
            const dropShapeList = dropLayerItem.querySelector('.shape-list');
            dropShapeIndex = Array.from(dropShapeList.children).indexOf(dropTarget);
        } else if (dropType === 'layerList') {
            // 新しいレイヤーを作成
            dropLayerIndex = layers.length;
            const newLayer = {name: `Layer ${layers.length + 1}`, shapes: []};
            layers.push(newLayer);
            
            // 新しいレイヤーの DOM 要素を作成
            const newLayerItem = document.createElement('li');
            newLayerItem.className = 'layer-item';
            newLayerItem.innerHTML = `
                <span class="layer-name">${newLayer.name}</span>
                <ul class="shape-list"></ul>
            `;
            layerList.appendChild(newLayerItem);
            dropTarget = newLayerItem.querySelector('.shape-list');
        }

        if (dropLayerIndex !== undefined) {
            const [draggedShape] = layers[layerIndex].shapes.splice(shapeIndex, 1);

            if (dropShapeIndex === -1) {
                layers[dropLayerIndex].shapes.push(draggedShape);
                dropTarget.querySelector('.shape-list').appendChild(draggingElement);
            } else {
                layers[dropLayerIndex].shapes.splice(dropShapeIndex, 0, draggedShape);
                dropTarget.parentNode.insertBefore(draggingElement, dropTarget.nextSibling);
            }
        }
    }

    p.updateShapeZIndex();
  }
  */

  p.updateShapeZIndex = function () {
    let zOffset = 0;
    layers.forEach(layer => {
      layer.shapes.forEach(shape => {
        shape.zIndex = zOffset;
      });
      zOffset += 8;
    });
  }

  p.customizeShape = function (layerIndex, shapeIndex) {
    selectedcustomizeShape = layers[layerIndex].shapes[shapeIndex];

    // スライダーを表示
    document.getElementById('rotation-slider-container').classList.remove('hidden');
    // スライダーの値を選択した図形の回転度に設定
    document.getElementById('rotation-slider').value = selectedcustomizeShape.rotation;

    if (!mode2D) {
      document.getElementById('color-selector').classList.remove('hidden');
      document.getElementById('color-label').classList.remove('hidden');
      p.selectCurve(layerIndex, shapeIndex);
    }
  }

  // レイヤーリスト外をクリックした時、図形の選択解除
  p.documentClickHandler = function() {
    document.addEventListener('click', (event) => {
      let colorSelector = document.getElementById('color-selector');
      let rotationSlider = document.getElementById('rotation-slider-container');
      // クリックされたのがshapeItemでなければ選択解除
      if (customizeShapeIndex !== -1 && customizeLayerIndex !== -1) {
        // クリックされた場所がレイヤーリスト・カラー選択・スライダー以外か確認
        if (!layerList.contains(event.target) && !colorSelector.contains(event.target) && !rotationSlider.contains(event.target)) {
          customizeShapeIndex = -1;
          customizeLayerIndex = -1;

          selectedcustomizeShape = null;
          rotationSlider.classList.add('hidden');
          if (!mode2D){// カラー選択を非表示に
            colorSelector.classList.add('hidden');
          }
        }
      }
    });
  };

  p.setupRotationSlider = function() {
    // スライダーのイベントリスナーを設定
    let rotationSlider = document.getElementById('rotation-slider');
    rotationSlider.addEventListener('input', function(event) {
      if (selectedcustomizeShape) {
        const rotationValue = event.target.value; // スライダーの値を取得
        selectedcustomizeShape.rotation = rotationValue; // 図形に回転度を格納
      }
      event.stopPropagation(); // スライダー操作中は他のクリックイベントを無視
    });
  };
}, 'canvas');

let partsCanvas;

function initializeTab2() {
  if (sketch2) {
    //console.log(sketch2);
    sketch2.remove(); // タブ2のスケッチを削除
    sketch2 = null; // スケッチ2の参照をクリア
    partsSketches.forEach(sketch => {
      sketch.remove();
    });
    partsSketches = [];
  }
  // サイズ決定(変換もしていない場合に必要)
  layers.forEach((layer) => {
    layer.shapes.forEach((shape) => {
      if (shape.d) {
        shape.scale = shape.d/300;
        decideSizeParameters(shape, shape.type, shape.d, 0, 0);
      } else {
        shape.scale = Math.max(shape.l, shape.w) / 500;
        decideSizeParameters(shape, shape.type, 0, shape.w, shape.l);
      }
    });
  });    

  const container = document.getElementById('complete-view-container');
  container.innerHTML = ''; // コンテナをクリア

  const completeContent = document.createElement('h1');
  completeContent.textContent = '完成図';
  container.appendChild(completeContent);

  // キャンバスコンテナを追加
  const canvasContainer = document.createElement('div');
  canvasContainer.id = 'canvas2';
  container.appendChild(canvasContainer);

  // sketch2を初期化
  sketch2 = new p5((p) => {
    p.setup = function() {
      let canvas = p.createCanvas(800, 800, p.WEBGL);
      canvas.parent('canvas2');
      definePoints();
    }

    p.draw = function() {
      p.background(250);
      drawAxis(p);
      p.orbitControl();
      /*
      for (let i = compShapes.length - 1; i >= 0; i--) {
        drawShape(p, compShapes[i], i);
      }
      */
      let indexCounter = 0;
      layers.forEach((layer, layerIndex) => {
        layer.shapes.forEach((shape, shapeIndex) => {
          drawShape(p, shape, layerIndex, shapeIndex, 0, -1);
          indexCounter++;
        });
      });
      
    }
  }, 'canvas2');

  // 水平線を追加
  const hr = document.createElement('hr');
  container.appendChild(hr);

  // 追加のキャンバスコンテナを追加
  /*
  const partsCanvasContainer = document.createElement('div');
  partsCanvasContainer.id = 'parts-canvas';
  container.appendChild(partsCanvasContainer);

  // 既存の追加キャンバスを削除
  if (partsCanvas) {
    partsCanvas.remove();
  }*/

  // 追加のキャンバスを初期化
  /*
  partsCanvas = new p5((p) => {
    p.setup = function() {
      let canvas = p.createCanvas(400, 400);
      canvas.parent('parts-canvas');
    }

    p.draw = function() {
      // 追加のキャンバスの描画ロジック
      p.background(200);
      p.text('追加のキャンバス', 10, 30);
      // ここに追加のキャンバスの描画コードを記述
    }
  }, 'parts-canvas');*/

  // 追加のテキストコンテンツ
  const partsContent = document.createElement('h1');
  partsContent.textContent = 'パーツ一覧';
  container.appendChild(partsContent);
  // 追加のキャンバスコンテナを作成
  const partsCanvasContainer = document.createElement('div');
  partsCanvasContainer.id = 'parts-canvas-container';
  container.appendChild(partsCanvasContainer);
  
  // 既存のキャンバスがあれば削除
  document.querySelectorAll('#parts-canvas-container canvas').forEach(canvas => {
    canvas.remove();
  });
  
  // 各パーツごとに新しいキャンバスを作成
  layers.forEach((layer, layerIndex) => {
    layer.shapes.forEach((shape, shapeIndex) => {
      // キャンバス要素を作成
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'canvas-wrapper';
      partsCanvasContainer.appendChild(canvasWrapper);
      
      // 新しいp5インスタンスを作成して個々のキャンバスに3Dモデルを描画
      const sketch = new p5((p) => {
        p.setup = function() {
          let canvas = p.createCanvas(250, 250, p.WEBGL);
          canvas.parent(canvasWrapper);
        }
  
        p.draw = function() {
          p.background(250);
          p.orbitControl();
          drawShape(p, shape, layerIndex, shapeIndex, 1, -1);  // 個別の形状を描画
        }
      }, canvasWrapper);
      partsSketches.push(sketch);

      // 「作成する」ボタンの追加
      const createButton = document.createElement('button');
      createButton.textContent = '作成する'; // ボタンのテキスト
      canvasWrapper.appendChild(createButton);

      // ボタンのクリックイベントを設定
      createButton.addEventListener('click', () => {
        // ボタンがクリックされたときの処理をここに書く
        //console.log(`レイヤー ${layerIndex} のパーツ ${shapeIndex} の作り方の表示`);
        showModal(layerIndex, shapeIndex);
      });

      // モーダルを表示する関数
      function showModal(layerIndex, shapeIndex) {
        const modal = document.getElementById('modal');
        const modalText = document.getElementById('modal-text');
        const modalCanvasContainer = document.getElementById('modal-canvas-container');
        
        // モーダルに表示する内容を設定
        modalText.textContent = `水引中央で作成してください`;

        // モーダルを表示
        modal.style.display = 'block';

        // 既存のキャンバスをクリア
        modalCanvasContainer.innerHTML = '';

        // プロセス数表示用のテキスト
        const processText = document.createElement('div');
        processText.id = 'process-buffer';
        modalCanvasContainer.appendChild(processText);

        // グローバル変数としてボタンを取得
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');

        let processNo = 1;
        const totalProcesses = getTotalProcesses(shape.type);

        // ボタンの状態を更新する関数
        function updateButtonStates() {
          prevButton.disabled = processNo <= 1;
          nextButton.disabled = processNo >= totalProcesses;

          // ボタンの色を更新
          prevButton.style.backgroundColor = prevButton.disabled ? '#ccc' : '#007bff';
          nextButton.style.backgroundColor = nextButton.disabled ? '#ccc' : '#007bff';

          // 同時に工程数も表示
          processText.textContent = `${processNo} / ${totalProcesses}`;
        }

        // 既存のスケッチを削除
        if (modalSketch) {
          modalSketch.remove();
          modalSketch = null;
        }
        // キャンバスを生成し、モーダル内に追加
        modalSketch = new p5((p) => {
          p.setup = function() {
            let canvas = p.createCanvas(400, 400, p.WEBGL);
            canvas.parent(modalCanvasContainer);
            updateButtonStates();
          };

          p.draw = function() {
            p.background(250);
            p.orbitControl();
            // 制御点に基づくカーブ描画やパーツの描画をここで行う
            // 現在の processNo に基づいて制御点を取得、描画
            drawShape(p, shape, layerIndex, shapeIndex, 1, processNo);
          };
        }, modalCanvasContainer);
       
        // 矢印ボタンのクリックイベント
        prevButton.addEventListener('click', () => {
          if (processNo > 1) {
            processNo--;
            updateButtonStates();
            // キャンバスを再描画
            modalSketch.redraw();
          }
        });

        nextButton.addEventListener('click', () => {
          if (processNo < totalProcesses) {
            processNo++;
            updateButtonStates();
            // キャンバスを再描画
            modalSketch.redraw();
          }
        });

        // モーダルを閉じるイベント
        const closeModal = document.querySelector('.modal .close');
        closeModal.onclick = function() {
          modal.style.display = 'none';
        }

        // モーダルの外をクリックしたら閉じる
        window.onclick = function(event) {
          if (event.target === modal) {
            modal.style.display = 'none';
          }
        }
      }
    });
  });

  // リストを更新
  updateMaterialsList();
}

// タブ切り替え時にinitializeTab1, 2を呼び出す
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('label[for="tab2"]').addEventListener('click', initializeTab2);
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
        canvas.parent('canvas2');
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
    }, 'canvas2');
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

function drawShape(p, shape, layerIndex,shapeIndex, parts_f, processNo) {
  p.push();
  if (parts_f == 1) {
    p.translate(0, 0, 0);
  } else {
    p.translate(shape.x - p.width/2, shape.y - p.height/2, shape.zIndex);
    p.rotateZ(p.radians(shape.rotation));
  }
  let scaleValue = shape.scale * 1.62;// 初期値
  //console.log(shape.x, shape.y); 
  let points;
  if (processNo == -1) {
    if (shape.type === 'awaji') {
      points = awaji_points;
    } else if (shape.type === 'ume') {
      points = ume_points;
    } else if (shape.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.7, 0.6]; // インデックス0は使用しない
      scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
      points = renzokuAwaji(shape.renzokuNum);//何連続か
    }
  } else {
    points = getProcessPoints(shape.type, processNo);
  }
  p.scale(scaleValue);
  
  let innerCurves = createInnerCurves(p, points, shape.numInnerCurves, shape.outerCurveWeight, shape.innerCurveWeight);

  p.noFill();
  if (shape.innerCurveWeight) {
    p.strokeWeight(shape.innerCurveWeight);
  }
  let shapeInnerCurves = [];
  for (let i = 0; i < innerCurves.length; i++) {
    let color;
    if (innerCurvesData[layerIndex]&&innerCurvesData[layerIndex][shapeIndex] && innerCurvesData[layerIndex][shapeIndex][i]) {// インナーカーブに色が設定してあれば
      color = innerCurvesData[layerIndex][shapeIndex][i].color;
    } else {// 設定してなければ図形の色で
      color=shape.color;
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
  
  // `innerCurvesData[layerIndex]` が存在しない場合は初期化
  if (!innerCurvesData[layerIndex]) {
    innerCurvesData[layerIndex] = [];
  }
  
  // `innerCurvesData[layerIndex][shapeIndex]` が存在しない場合は初期化
  if (!innerCurvesData[layerIndex][shapeIndex]) {
    innerCurvesData[layerIndex][shapeIndex] = [];
  }
  // インナーカーブのデータを更新または追加
  innerCurvesData[layerIndex][shapeIndex] = shapeInnerCurves;
  
  p.pop();
}

//各モデル（工程の変数があるので後々消したい）
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
    { x: 15, y: -45, z: -7 },//
    { x: 70, y: -30, z: 5 },
    { x: 70, y: 25, z: -10 },
    { x: 10, y: 45, z: 5 },
    { x: -40, y: 0, z: -5 },
    { x: -60, y: -30, z: 5 },
    { x: -90, y: -90, z: 0 }
  ];
   
  renzoku_points = awaji_points.map(point => {
    return {
      x: point.x,
      y: point.y + 70,
      z: point.z
    };
  });

  awajiRl_points = [
    { x: -45, y: -30, z: 5 },
    { x: 15, y: -75, z: -7 },
    { x: 70, y: -60, z: 5 },
    { x: 70, y: -5, z: -10 },
    { x: 10, y: 5, z: 5 },
    { x: -40, y: -20, z: -5 },
    { x: -60, y: -60, z: 5 },
    { x: -90, y: -120, z: 0 }
  ]

  awajiRr_points = [
    { x: 90, y: -120, z: 0 },
    { x: 60, y: -60, z: -5 },
    { x: 40, y: -20, z: 5 },
    { x: -10, y: 5, z: -5 },
    { x: -70, y: -5, z: 10 },
    { x: -70, y: -60, z: -5 },
    { x: -15, y: -75, z: 7 },
    { x: 45, y: -30, z: -5 },
  ]
}
/*
function getPartsPoints(type, processNo) {
  let awaji = {
    process1: [
      { x: 45, y: 0, z: -5 },
      { x: 30, y: 65, z: 8 },
      { x: -30, y: 65, z: -8 },
      { x: -45, y: 0, z: 5 },
    ],
    process2: [
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
    ],
    process3: [
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
      { x: 15, y: -45, z: -7 },//
      { x: 70, y: -30, z: 5 },
      { x: 70, y: 25, z: -10 },
      { x: 10, y: 45, z: 5 },
      { x: -40, y: 0, z: -5 },
      { x: -60, y: -30, z: 5 },
      { x: -90, y: -90, z: 0 }
    ]
  }

  // typeによってパーツを選択
  switch (type) {
    case 'awaji':
      selectedParts = awaji;
      break;
    default:
      selectedParts = awaji; // デフォルトはawaji
  }

  // totalProcesses（プロセスの数）を取得
  const totalProcesses = Object.keys(selectedParts).length;

  // 指定されたprocessNoのデータを取得
  const processPoints = selectedParts[`process${processNo}`];

  // 必要なデータをオブジェクトで返す
  return {
    points: processPoints,
    totalProcesses: totalProcesses,
    processNo: processNo,
  };
}*/

const partsPoints = {
  awaji: {
    process1: [
      { x: -200, y: -90, z: -5 },
      { x: -120, y: -80, z: -5 }, 
      { x: -45, y: -60, z: -5 }, 
      { x: 18, y: -30, z: -5 }, 
      { x: 45, y: 15, z: -5 }, 
      { x: 30, y: 65, z: 8 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 15, z: 5 }, 
      { x: -18, y: -30, z: 5 }, 
      { x: 45, y: -60, z: 5 }, 
      { x: 120, y: -80, z: 5 }, 
      { x: 200, y: -90, z: 5 },
    ],
    process2: [
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
      { x: -45, y: 15, z: 5 },
      { x: -18, y: -30, z: 5 }, 
      { x: 45, y: -60, z: 5 }, 
      { x: 120, y: -80, z: 5 }, 
      { x: 200, y: -90, z: 5 },
    ],
    process3: [
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
      { x: 15, y: -45, z: -7 },//
      { x: 70, y: -30, z: 5 },
      { x: 70, y: 25, z: -10 },
      { x: 10, y: 45, z: 5 },
      { x: -40, y: 0, z: -5 },
      { x: -60, y: -30, z: 5 },
      { x: -90, y: -90, z: 0 }
    ],
    // 他のプロセス
  },
  // 他のパーツタイプ
};

function getTotalProcesses(type) {
  const selectedParts = partsPoints[type];
  return Object.keys(selectedParts).length;
}

function getProcessPoints(type, processNo) {
  const selectedParts = partsPoints[type];
  return selectedParts[`process${processNo}`];
}

function renzokuAwaji(n) {
  let points = renzoku_points;
  let new_awajiRr = awajiRr_points;
  let new_awajiRl = awajiRl_points;
  let yDiff = Math.abs(new_awajiRr[0].y - new_awajiRr[6].y - 60);
  
  for (let i=0; i<n-1; i++){
    
    points = new_awajiRr.concat(points.slice(1));
    points = points.slice(0, -1).concat(new_awajiRl);
    
    // 新しい配列を作成し、y 座標を差分だけ小さくする
    new_awajiRr = new_awajiRr.map(point => {
      return { x: point.x, y: point.y - yDiff, z: point.z};
    });
    new_awajiRl = new_awajiRl.map(point => {
      return { x: point.x, y: point.y - yDiff, z: point.z};
    });
    
  }

  // 最上部と最下部のy座標を取得市、中心点を計算
  let yValues = points.map(point => point.y);
  let maxY = Math.max(...yValues);
  let minY = Math.min(...yValues);
  let centerY = (maxY + minY) / 2;

  // 図形を中心に合わせるためにオフセットを計算
  const offsetY = centerY;

  // 全てのポイントのy座標をoffsetYだけ減少させる
  points = points.map(point => {
    return { x: point.x, y: point.y - offsetY, z: point.z };
  });
  return points;
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

function decideSizeParameters(shape, type, circleDiameter, shapeWidth, shapeLength) {
  let cmSize = null, cmWidth = null, cmLength = null;
  if (circleDiameter != 0) {
    cmSize = circleDiameter / 50; // ピクセルをセンチメートルに変換
  } else {
    cmWidth = shapeWidth / 50;
    cmLength = shapeLength /  50;
  }

  // デフォルトのパラメータ
  let defaultParams = {
    numInnerCurves: 4,
    outerCurveWeight: 30,
    innerCurveWeight: 6.5
  };

  // モデルの種類ごとにパラメータを定義
  let params = {
    ume: {
      1.0: { numInnerCurves: 1, outerCurveWeight: 15, innerCurveWeight: 5 , materialCm: 23},
      1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
      2.3: { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 45 },
      2.8: { numInnerCurves: 4, outerCurveWeight: 26, innerCurveWeight: 5 , materialCm: 45 },
      3.3: { numInnerCurves: 5, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 45 },
      4.0: { numInnerCurves: 6, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 45 }
    },
    awaji: {
      1: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 , materialCm: 23 },
      1.5: { numInnerCurves: 2, outerCurveWeight: 19, innerCurveWeight: 5 , materialCm: 23 },
      2: { numInnerCurves: 3, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 23 },
      2.5: { numInnerCurves: 4, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 23 },
      3: { numInnerCurves: 5, outerCurveWeight: 33, innerCurveWeight: 5 , materialCm: 23 },
      3.5: { numInnerCurves: 6, outerCurveWeight: 33, innerCurveWeight: 5 , materialCm: 30 }
    },
    renzoku: {
      '1-2': { numInnerCurves: 1, outerCurveWeight: 8, innerCurveWeight: 5 , materialCm: 23 },
      '1.5-3.3': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5 , materialCm: 45 },
      '2-4': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5 , materialCm: 45 },
      '2.5-5.5': { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 60 },
      '3-5.6': { numInnerCurves: 5, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 60 }
    },
    // その他のモデルが追加される場合はここに定義
    other: {
      1: { numInnerCurves: 1, outerCurveWeight: 12, innerCurveWeight: 5 , materialCm: 30 },
      1.5: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
      2: { numInnerCurves: 3, outerCurveWeight: 24, innerCurveWeight: 5 , materialCm: 30 },
      2.5: { numInnerCurves: 4, outerCurveWeight: 28, innerCurveWeight: 5 , materialCm: 30 },
      3: { numInnerCurves: 5, outerCurveWeight: 32, innerCurveWeight: 5 , materialCm: 30 }
    }
  };

  // 指定されたタイプが存在しない場合、デフォルトパラメータを適用
  if (!params[type]) {
    shape.numInnerCurves = defaultParams.numInnerCurves;
    shape.outerCurveWeight = defaultParams.outerCurveWeight;
    shape.innerCurveWeight = defaultParams.innerCurveWeight;
    return;
  }

  if (type === 'renzoku') {
    let sizeDifference = Math.abs(shapeWidth - shapeLength);
    if (sizeDifference >= 350) {
      shape.renzokuNum = 8;
    } else if (sizeDifference >= 320) {
      shape.renzokuNum = 7;
    } else if (sizeDifference >= 280) {
      shape.renzokuNum = 6;
    } else if (sizeDifference >= 230) {
      shape.renzokuNum = 5;
    } else if (sizeDifference >= 180) {
      shape.renzokuNum = 4;
    } else if (sizeDifference >= 130) {
      shape.renzokuNum = 3;
    } else {
      shape.renzokuNum = 2;
    }
  }

  let closestParams, closestSize;
  if (cmSize) {
    // 使用可能なサイズキーを取得して、数値に変換
    let availableSizes = Object.keys(params[type]).map(size => Number(size)).sort((a, b) => a - b);
    // 初期値として最も近いサイズを最初の要素に設定
    closestSize = availableSizes[0];
    // 各サイズと比較して、cmSize以下でcmSizeに最も近いサイズを探す
    for (let i = 1; i < availableSizes.length; i++) {
      let currentSize = availableSizes[i];
      // 現在のサイズがcmSizeを超えたらループを終了、越える直前のものをサイズとして設定
      if (currentSize > cmSize) {
        break;
      }
      closestSize = currentSize;
    }
  // 最も近いサイズに対応するパラメータを shape に適用
  closestParams = params[type][closestSize];
    //console.log(closestParams);
  } else {// 使用可能なサイズキーを取得して、幅と高さに分解し、数値に変換
    let availableKeys = Object.keys(params.renzoku);
    let closestKey = availableKeys[0];
    let minDifference = Infinity;
    
    // 各キーを比較して、誤差の合計が最小のキーを探す
    for (let i = 0; i < availableKeys.length; i++) {
      let currentKey = availableKeys[i];
      let [widthKey, lengthKey] = currentKey.split('-').map(Number);
    
      let widthDifference = Math.abs(widthKey - cmWidth);
      let lengthDifference = Math.abs(lengthKey - cmLength);
    
      // 誤差の合計を計算
      let totalDifference = widthDifference + lengthDifference;
    
      // 最も小さい誤差のキーを探す
      if (totalDifference < minDifference) {
        minDifference = totalDifference;
        closestKey = currentKey;
      }
    }
    closestParams = params[type][closestKey];
  }

  shape.numInnerCurves = closestParams.numInnerCurves;
  //shape.outerCurveWeight = closestParams.outerCurveWeight;
  shape.innerCurveWeight = closestParams.innerCurveWeight;
  if(cmSize){
  shape.outerCurveWeight = cmSize * 8;  // shapeSize に基づいてスケール
  // ↑図形によって難しいようなら各パラメータのouterCurveWeightの場所に調整値を入れる
  }else{
    shape.outerCurveWeight = (cmWidth + cmLength) / 2 * 6; 
  }
  shape.materialCm = closestParams.materialCm;
}

function getMaterialColor (){
  let material = []
  let j = 0;
  layers.forEach((layer, layerIndex) => {
    layer.shapes.forEach((shape, shapeIndex) => {
      for (let i = 0; i < shape.numInnerCurves; i++) {
        let color;
        if (innerCurvesData[layerIndex]&&innerCurvesData[layerIndex][shapeIndex] && innerCurvesData[layerIndex][shapeIndex][i]) {
          color = innerCurvesData[layerIndex][shapeIndex][i].color;
        } else {
          color=shape.color;
        }
        material[j] = {
          color: color, // color情報
          cm: shape.materialCm // cm情報
        };
        j++;
      }
    });
  });
  let materialz = {}; // materialz の初期化

  // material をループ
  for (let i = 0; i < material.length; i++) {
    const { color, cm } = material[i]; // material[i] の color と cm を取得

    // materialz[color] が未定義なら初期化
    if (!materialz[color]) {
      materialz[color] = {};
    }

    // materialz[color][cm] が未定義なら初期化
    if (!materialz[color][cm]) {
      materialz[color][cm] = { num: 0 }; // num を 0 で初期化
    }

    // num のカウントを増やす
    materialz[color][cm].num += 1;
  }

  // 結果を確認
  //console.log(materialz);
  return materialz;
}

// `materialz` をもとに `<ul id="materials-list">` にリスト項目を追加する関数
function updateMaterialsList() {
  const materialsList = document.getElementById('materials-list'); // <ul> 要素を取得

  // 一度クリアする（すでにある要素を削除）
  materialsList.innerHTML = '';

  let material = getMaterialColor();

  // material の各 color, cm, num をループ
  for (let color in material) {
    for (let cm in material[color]) {
      const num = material[color][cm].num;

      // <li> 要素を作成
      const listItem = document.createElement('li');
      // 色のボックスを作成
      const colorBox = document.createElement('span');
      colorBox.classList.add('color-box');
      colorBox.style.backgroundColor = color;
      const textSpan = document.createElement('span');
      textSpan.textContent = `${cm}cm, ${num}本`;

      // <ul> に <li> を追加
      listItem.appendChild(colorBox);
      listItem.appendChild(textSpan);
      materialsList.appendChild(listItem);
    }
  }
}