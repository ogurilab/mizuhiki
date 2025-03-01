let layers = [];
let ume_points = [], awaji_points = [], awajiRl_points = [], awajiRr_points = [], renzoku_points = [], aioien_points = [], kame_points = [], kame2_points = [];
let innerCurvesData = [];
let layerList;
let compShapes = [];
let sketch2, modalSketch;
let partsSketches = [];
//let selectedCurveIndex;

let outerCurveWeight = 30;
let innerCurveWeight = 5;
let innerCurveColors = [
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
  { r: 165, g: 42, b: 42 },
]
let id = 0;
let selectedcustomizeShape = null;

// デザインタブ
let sketch1 = new p5((p) => {
  let canvas;
  let mode2D = true;// 図形モードと変換後のフラグ
  let mode2D_f = 0;
  let currentType = null;
  let selectedCurve = null;
  let cameraFixed = false;//カメラ固定フラグ
  let fixFrontButton;//カメラ固定ボタン
  let nowKey = null;//カーブ選択に使用
  let nowShapeKey = -1;
  let nowIndexKey = -1;
  let originalColor = null;
  let selectedShape = null;//図形移動
  let selectedLayerIndex = null;//多分いらない
  let pg;
  let highlightedShapeIndex = -1;//緑の円
  let highlightedLayerIndex = -1;
  let isLayerManipulating = false;//レイヤーリストの表示非表示
  let selectedColor = null;
  let pendingShape = null;
  let resizeCornerSize = 10;
  let resizing = null;//サイズ変更
  let angle = 0; // 回転角度の初期値
  let customizeShapeIndex = -1;//図形詳細設定、選択された図形
  let customizeLayerIndex = -1;

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
    p.setupCuttingButton();

    // レイヤーリストの初期化
    p.updateLayerList();
  }

  p.draw = function () {
    p.background(250);
    //console.log(layers);
    if (mode2D) {
      let connectionDistance = 20; // 接続判定の距離
      p.push();
      //resetMatrix(); // 座標系をリセット  
      if (mode2D_f == 1) {
        p.translate(-p.width/2, -p.height/2);
      }
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
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
            p.drawInvertedTriangle(shape, 0, 0, shape.d);
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
            p.drawRenzokuawaji(shape, 0, 0, shape.w, shape.l);
            //p.drawRenzokuawaji(0, 0, shape.w, shape.l);
            p.rect(shape.w/2 - resizeCornerSize/2, shape.l/2 - resizeCornerSize/2, resizeCornerSize, resizeCornerSize);
          } else if (shape.type === 'aioien') {
            //p.fill(165, 42, 42, 100);
            p.drawDonut(0, 0, shape.d, shape.d*0.7);
            let markerX =shape.d/2 * p.cos(p.QUARTER_PI);  // QUARTER_PI=45度
            let markerY =shape.d/2 * p.sin(p.QUARTER_PI);
            p.rect(markerX - resizeCornerSize / 2, markerY - resizeCornerSize / 2, resizeCornerSize, resizeCornerSize);
          } else if (shape.type === 'kame') {
            //p.fill(165, 42, 42, 100);
            p.drawKame(shape, 0, 0, shape.w, shape.l);
            p.rect(shape.w/2 - resizeCornerSize/2, -shape.l/4 - resizeCornerSize/2, resizeCornerSize, resizeCornerSize);
          } else if (shape.type === 'kame2') {
            //p.fill(165, 42, 42, 100);
            p.drawKame2(0, 0, shape.w, shape.l);
            // 楕円上の点を計算
            let markerX = (shape.w / 2) * p.cos(p.QUARTER_PI); // 楕円の横幅 (w) を半径として使用
            let markerY = (shape.l / 2) * p.sin(p.QUARTER_PI); // 楕円の縦幅 (l) を半径として使用
            // 四角を描画
            p.rect(markerX - resizeCornerSize / 2, markerY - resizeCornerSize / 2, resizeCornerSize, resizeCornerSize);
          }
          p.pop();
        });
      });

      // 接続判定を行い、接続が成立している場合に接続線を描画
      /*connectorそれぞれを別判定（実装途中、判定フラグが1つしかない）
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
          shape.connectors.forEach(connector => {
            layers.forEach(otherLayer => {
              otherLayer.shapes.forEach(otherShape => {
                i++;
                if (shape !== otherShape) {
                  otherShape.connectors.forEach(otherConnector => {
                    // 各接続点の座標を計算
                    let connectorX = shape.x + connector.x * Math.cos(p.radians(shape.rotation)) - connector.y * Math.sin(p.radians(shape.rotation));
                    let connectorY = shape.y + connector.x * Math.sin(p.radians(shape.rotation)) + connector.y * Math.cos(p.radians(shape.rotation));
                    
                    let otherConnectorX = otherShape.x + otherConnector.x * Math.cos(p.radians(otherShape.rotation)) - otherConnector.y * Math.sin(p.radians(otherShape.rotation));
                    let otherConnectorY = otherShape.y + otherConnector.x * Math.sin(p.radians(otherShape.rotation)) + otherConnector.y * Math.cos(p.radians(otherShape.rotation));

                    // 距離を計算
                    let distance = p.dist(connectorX, connectorY, otherConnectorX, otherConnectorY);
                    console.log(i+shape.isConnected+ shape.color);
                    
                    // 距離が指定範囲内なら自動で接続
                    if (distance <= connectionDistance) {
                      // 接続が成立した場合、接続を示す線を描画（または他の処理を実行）
                      p.stroke(0, 255, 0); // 緑色の接続線
                      p.line(connectorX, connectorY, otherConnectorX, otherConnectorY);
                      
                      // 接続情報を保存する場合
                      shape.isConnected = true;
                      otherShape.isConnected = true;
                      console.log(`Connected ${shape} to ${otherShape}`);
                    }
                    if (shape.isConnected == true && distance > connectionDistance) {
                      console.log('no');
                      shape.isConnected = false;
                      otherShape.isConnected = false;
                      console.log(`Not connected ${shape} to ${otherShape}`);
                    }
                  });
                }
              });
            });
          });
        });
      });*/
      layers.forEach(layer => {
        layer.shapes.forEach(shape => {
          if (shape.connectors) {
            layer.shapes.forEach(otherShape => {
              if (shape !== otherShape && otherShape.connectors) {
                shape.connectors.forEach((connectorSet, setIndex) => {
                  // 現在の接続セットの中間点を計算
                  let connector = {
                    x: (connectorSet.points[0].x + connectorSet.points[1].x) / 2,
                    y: (connectorSet.points[0].y + connectorSet.points[1].y) / 2
                  };
                  let connectorX = shape.x + connector.x * Math.cos(p.radians(shape.rotation)) - connector.y * Math.sin(p.radians(shape.rotation));
                  let connectorY = shape.y + connector.x * Math.sin(p.radians(shape.rotation)) + connector.y * Math.cos(p.radians(shape.rotation));
      
                  otherShape.connectors.forEach((otherConnectorSet, otherSetIndex) => {
                    // 他の図形の接続セットの中間点を計算
                    let otherConnector = {
                      x: (otherConnectorSet.points[0].x + otherConnectorSet.points[1].x) / 2,
                      y: (otherConnectorSet.points[0].y + otherConnectorSet.points[1].y) / 2
                    };
                    let otherConnectorX = otherShape.x + otherConnector.x * Math.cos(p.radians(otherShape.rotation)) - otherConnector.y * Math.sin(p.radians(otherShape.rotation));
                    let otherConnectorY = otherShape.y + otherConnector.x * Math.sin(p.radians(otherShape.rotation)) + otherConnector.y * Math.cos(p.radians(otherShape.rotation));
                    
                    //p.ellipse(connectorX, connectorY, 5);
                    //console.log(connectorSet.isConnected);
                    // 距離を計算
                    let distance = p.dist(connectorX, connectorY, otherConnectorX, otherConnectorY);
                    //console.log(connectorSet.isConnected, otherConnectorSet.isConnected);
                    // 接続距離内で接続されていない場合、自動接続(同色の場合)
                    if (shape.color == otherShape.color && connectorSet.isConnected == null && otherConnectorSet.isConnected == null && distance <= connectionDistance) {
                      connectorSet.isConnected = { shape: otherShape, setIndex: otherSetIndex };
                      otherConnectorSet.isConnected = { shape: shape, setIndex: setIndex };
                      //モデルの接続部分を切断（繋げられるように）
                      if (setIndex == 0) {
                        shape.flags.end = true;
                      } else {
                        shape.flags.middle = true;
                      }
                      if (otherSetIndex == 0) {
                        otherShape.flags.end = true;
                      } else {
                        otherShape.flags.middle = true;
                      }
                    } else if (connectorSet.isConnected?.shape === otherShape && connectorSet.isConnected?.setIndex === otherSetIndex && distance > connectionDistance) {
                      // 距離が範囲外の場合、接続解除
                      connectorSet.isConnected = null;
                      otherConnectorSet.isConnected = null;
                    }

                    //切断接続ボタンを勝手に切り替えられないように無効化
                    if (selectedcustomizeShape) {
                      let endCuttingButton = document.getElementById("end-cutting-button");
                      let middleCuttingButton = document.getElementById("middle-cutting-button");
                      if (selectedcustomizeShape === shape && connectorSet.isConnected?.shape === otherShape) { 
                        if (setIndex == 0) {
                          endCuttingButton.disabled = true; // ボタン無効化
                        } else {
                          middleCuttingButton.disabled = true; // ボタン無効化
                        }
                      } else if (selectedcustomizeShape === shape && connectorSet.isConnected === null) {
                        endCuttingButton.disabled = false; // ボタン有効化
                        middleCuttingButton.disabled = false; // ボタン有効化
                      } else if (selectedcustomizeShape === otherShape && otherConnectorSet.isConnected?.shape === shape) {
                        if (otherSetIndex == 0) {
                          endCuttingButton.disabled = true; // ボタン無効化
                        } else {
                          middleCuttingButton.disabled = true; // ボタン無効化
                        } 
                      } else if (selectedcustomizeShape === otherShape && otherConnectorSet.isConnected === null) {
                        endCuttingButton.disabled = false; // ボタン有効化
                        middleCuttingButton.disabled = false; // ボタン有効化
                      }
                    }
      
                    // 接続状態を描画
                    if (connectorSet.isConnected?.shape === otherShape &&
                      connectorSet.isConnected?.setIndex === otherSetIndex) {
                      // 接続点ごとに接続線を描画
                      for (let i = 0; i < 2; i++) {
                        // shape の接続点の座標を計算
                        let connectorX = shape.x + connectorSet.points[i].x * Math.cos(p.radians(shape.rotation)) - connectorSet.points[i].y * Math.sin(p.radians(shape.rotation));
                        let connectorY = shape.y + connectorSet.points[i].x * Math.sin(p.radians(shape.rotation)) + connectorSet.points[i].y * Math.cos(p.radians(shape.rotation));
                    
                        // otherShape の接続点の座標を計算
                        let distances = []; // 距離を保存する配列
                    
                        // 左右の接続点ごとに距離を計算
                        for (let j = 0; j < 2; j++) {
                          let otherConnectorX = otherShape.x + otherConnectorSet.points[j].x * Math.cos(p.radians(otherShape.rotation)) - otherConnectorSet.points[j].y * Math.sin(p.radians(otherShape.rotation));
                          let otherConnectorY = otherShape.y + otherConnectorSet.points[j].x * Math.sin(p.radians(otherShape.rotation)) + otherConnectorSet.points[j].y * Math.cos(p.radians(otherShape.rotation));
                    
                          // 現在の接続点と他の接続点の距離を計算
                          let distance = p.dist(connectorX, connectorY, otherConnectorX, otherConnectorY);
                          distances.push({ j, distance });
                        }
                    
                        // 最も近い接続点を選択
                        distances.sort((a, b) => a.distance - b.distance);
                        let closestConnector = distances[0]; // 最も近い接続点ペア
                    
                        // 最も近い接続点同士を接続
                        let closestOtherConnectorX = otherShape.x + otherConnectorSet.points[closestConnector.j].x * Math.cos(p.radians(otherShape.rotation)) - otherConnectorSet.points[closestConnector.j].y * Math.sin(p.radians(otherShape.rotation));
                        let closestOtherConnectorY = otherShape.y + otherConnectorSet.points[closestConnector.j].x * Math.sin(p.radians(otherShape.rotation)) + otherConnectorSet.points[closestConnector.j].y * Math.cos(p.radians(otherShape.rotation));
                    
                        // 接続線を描画
                        p.push();
                        p.stroke(255, 0, 0); // 赤色の接続線
                        p.strokeWeight(5);
                        p.line(connectorX, connectorY, closestOtherConnectorX, closestOtherConnectorY);
                        p.pop();
                      }
                    }
                  });
                });
              }
            });
          }
        });
      });
      
      // サイズを変更する処理（ここでは要らないんじゃね？）
      if (resizing) {
        //p.resizeShape(resizing);
      }

      // マウスオーバー時ハイライトの描画（緑の円）
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
      // 図形選択ハイライトの描画（赤の円）
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
        p.orbitControl();//カメラ動かせる関数
      } else if (cameraFixed) {
        // カメラを正面に固定
        p.camera(0, 0, defaultCameraZ, 0, 0, 0, 0, 1, 0);
      }
      
      const renderedConnections = new Set(); // 描画済み接続を記録
      layers.forEach((layer, layerIndex) => {
        layer.shapes.forEach((shape, index) => {

          // 切断接続処理を行う関数
          let adjustedPoints = adjustControlPoints(shape);

          let connected = false;
          // connectors 内の isConnected フラグを確認して、接続されているかをチェック
          if (shape.connectors) {
            for (let connectorSet of shape.connectors) {
              if (connectorSet.isConnected !== null) {
                connected = true;
                break;
              }
            }
          }
  
          if (!connected) {
            drawShape(p, shape, layerIndex, index, 0, -1, adjustedPoints);
          } else {
            // 接続されている図形の描画
            shape.connectors.forEach((connectorSet, setIndex) => {
              // 接続先の図形を探す
              if (connectorSet.isConnected?.shape) {
                const shape2 = connectorSet.isConnected.shape;
      
                // 接続ペアを一意に識別するために文字列を生成
                const connectionKey = `${Math.min(shape.id, shape2.id)}-${Math.max(shape.id, shape2.id)}`;
      
                if (!renderedConnections.has(connectionKey)) {
                  // 未描画の接続のみ描画
                  drawConnect(p, shape, layerIndex, index, adjustedPoints, 0, -1);
                  renderedConnections.add(connectionKey);
                }
              }
            });
          }
        });
      });   
      //console.log(renderedConnections); 
      
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
  //３Dモードでテキスト書くやつ
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
  p.drawInvertedTriangle = function (shape, x, y, d) {
    p.push();
    p.translate(x, y);
    p.triangle(0, d/2, -d/2, -d/2, d/2, -d/2);
    // 接続点の描画
    for (let setIndex = 0; setIndex < shape.connectors.length; setIndex++) {
      const connectorSet = shape.connectors[setIndex];
      for (let pointIndex = 0; pointIndex < connectorSet.points.length; pointIndex++) {
        // 接続点の座標を計算
        let connectorX, connectorY;
        if (setIndex === 0) {
          // 第一セット (三角形の上辺: yマイナス方向)
          connectorX = (x + d / 2 - d * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y - d / 2; // 三角形の上辺
        }/* else if (setIndex === 1) {
          // 第二セット (三角形の下辺: yプラス方向)
          connectorX = (x + d / 2 - d * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y + d / 2; // 三角形の下辺
        }*/
  
        // 接続点の座標を更新
        connectorSet.points[pointIndex] = { x: connectorX, y: connectorY };
  
        // 接続点の矢印を描画
        p.stroke(0, 0, 255);
        p.fill(0, 0, 255);
  
        // 矢印の線部分
        p.line(connectorX, connectorY, connectorX, connectorY + (setIndex === 0 ? -15 : 15)); // 上: -15, 下: +15
  
        // 矢印の先端部分
        p.triangle(
          connectorX,
          connectorY + (setIndex === 0 ? -15 : 15),
          connectorX - 5,
          connectorY + (setIndex === 0 ? -9 : 9),
          connectorX + 5,
          connectorY + (setIndex === 0 ? -9 : 9)
        );
      }
    }
    p.pop();
  }

  //連続あわじ結びの描画
  p.drawRenzokuawaji = function (shape, x, y, w, l) {
  //p.drawRenzokuawaji = function (x, y, w, l) {
    p.push();
    //p.translate(x, y);
    p.rectMode(p.CENTER);
    p.rect(x, y, w, l);
    // 接続点の描画
    for (let setIndex = 0; setIndex < shape.connectors.length; setIndex++) {
      const connectorSet = shape.connectors[setIndex];
      for (let pointIndex = 0; pointIndex < connectorSet.points.length; pointIndex++) {
        // 各接続点の情報を取得
        //let connector = connectorSet.points[pointIndex];
    
        // 接続点のX座標とY座標を計算
        let connectorX, connectorY;
        if (setIndex === 0) {
          // 第一セット (図形の上: yマイナス方向)
          connectorX = (x - w / 2 + w * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y - l / 2; // 図形の上辺
        } else if (setIndex === 1) {
          // 第二セット (図形の下: yプラス方向)
          connectorX = (x - w / 2 + w * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y + l / 2; // 図形の下辺
        }
    
        // 接続点の座標を更新
        connectorSet.points[pointIndex] = { x: connectorX, y: connectorY };
    
        // 接続点の矢印を描画
        p.stroke(0, 0, 255);
        p.fill(0, 0, 255);
    
        // 矢印の線部分
        p.line(connectorX, connectorY, connectorX, connectorY + (setIndex === 0 ? -15 : 15)); // 上: -15, 下: +15
    
        // 矢印の先端部分
        p.triangle(
          connectorX,
          connectorY + (setIndex === 0 ? -15 : 15),
          connectorX - 5,
          connectorY + (setIndex === 0 ? -9 : 9),
          connectorX + 5,
          connectorY + (setIndex === 0 ? -9 : 9)
        );
    
      }
    }
    
    p.pop();
  }

  p.drawDonut = function (x, y, outD, innerD) {
    p.push();
    p.translate(x, y);

    p.beginShape();
    // 外側の円
    for (let angle = 0; angle < p.TWO_PI; angle += 0.01) {
      let x = p.cos(angle) * (outD / 2);
      let y = p.sin(angle) * (outD / 2);
      p.vertex(x, y);
    }
    // 内側の円（反時計回りに描く）
    p.beginContour();
    for (let angle = p.TWO_PI; angle > 0; angle -= 0.01) {
      let x = p.cos(angle) * (innerD / 2);
      let y = p.sin(angle) * (innerD / 2);
      p.vertex(x, y);
    }
    p.endContour();
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  p.drawKame = function (shape, x, y, w, l) {
    // 半楕円を描画
    p.arc(x, y-l/4, w, l, 0, p.PI);
    p.push();
    // 接続点の描画
    for (let setIndex = 0; setIndex < shape.connectors.length; setIndex++) {
      const connectorSet = shape.connectors[setIndex];
      for (let pointIndex = 0; pointIndex < connectorSet.points.length; pointIndex++) {
        // 接続点の座標を計算
        let connectorX, connectorY;
        if (setIndex === 0) {
          // 第一セット (三角形の上辺: yマイナス方向)
          connectorX = (x + w / 2 - w * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y-l/4; // 三角形の上辺
        }/* else if (setIndex === 1) {
          // 第二セット (三角形の下辺: yプラス方向)
          connectorX = (x + d / 2 - d * 0.8) * (pointIndex === 0 ? 1 : -1); // 左: 1, 右: -1
          connectorY = y + d / 2; // 三角形の下辺
        }*/
  
        // 接続点の座標を更新
        connectorSet.points[pointIndex] = { x: connectorX, y: connectorY };
  
        // 接続点の矢印を描画
        p.stroke(0, 0, 255);
        p.fill(0, 0, 255);
  
        // 矢印の線部分
        p.line(connectorX, connectorY, connectorX, connectorY + (setIndex === 0 ? -15 : 15)); // 上: -15, 下: +15
  
        // 矢印の先端部分
        p.triangle(
          connectorX,
          connectorY + (setIndex === 0 ? -15 : 15),
          connectorX - 5,
          connectorY + (setIndex === 0 ? -9 : 9),
          connectorX + 5,
          connectorY + (setIndex === 0 ? -9 : 9)
        );
      }
    }
    p.pop();
  }

  p.drawKame2 = function (x, y, w, l) {
    // 半楕円を描画
    p.arc(x, y, w, l, 0, p.TWO_PI);
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
        id: id++,
        type: type,
        x: p.width/2,//座標
        y: p.height/2,
        w: shapeWidth,//縦と横
        l: shapeLength,
        scale: Math.max(shapeLength, shapeWidth) / 500,
        rotation: 0,
        connectors: [
          {
            // 第一セットの接続点
            points: [
              { x: 10, y: 0 }, // 左側
              { x: -10, y: 0 } // 右側
            ],
            isConnected: null, // 各接続点の接続フラグ
          },
          {
            // 第二セットの接続点
            points: [
              { x: 10, y: 0 },
              { x: -10, y: 0 }
            ],
            isConnected: null, // 各接続点の接続フラグ
          }
        ],
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
        //...p.getCurveParameters(currentType, 0, shapeLength, shapeWidth)
      };
    } else if (type === 'awaji'){
      let shapeDiameter = 3 * 50; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        d: shapeDiameter,
        scale: shapeDiameter / 300,
        rotation: 0,
        connectors: [
          {
            // 第一セットの接続点
            points: [
              { x: 10, y: 0 }, // 左側
              { x: -10, y: 0 } // 右側
            ],
            isConnected: null, // 各接続点の接続フラグ
          },/*
          {
            // 第二セットの接続点
            points: [
              { x: 10, y: 0 },
              { x: -10, y: 0 }
            ],
            isConnected: null, // 各接続点の接続フラグ
          }*/
        ],
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      };
    } else if (type === 'kame'){
      let shapeWidth = 2 * 50; 
      let shapeLength = shapeWidth*1.8; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        w: shapeWidth,
        l: shapeLength,
        scale: Math.max(shapeLength, shapeWidth) / 500,
        rotation: 0,
        connectors: [
          {
            // 第一セットの接続点
            points: [
              { x: 10, y: 0 }, // 左側
              { x: -10, y: 0 } // 右側
            ],
            isConnected: null, // 各接続点の接続フラグ
          },/*
          {
            // 第二セットの接続点
            points: [
              { x: 10, y: 0 },
              { x: -10, y: 0 }
            ],
            isConnected: null, // 各接続点の接続フラグ
          }*/
        ],
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      }
    } else if (type === 'kame2'){
      let shapeWidth = 2 * 50; 
      let shapeLength = shapeWidth*1.6; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        w: shapeWidth,
        l: shapeLength,
        scale: Math.max(shapeLength, shapeWidth) / 500,
        rotation: 0,
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      }
    } else if (type === 'ume'){
      let shapeDiameter = 3 * 50; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        d: shapeDiameter,
        scale: shapeDiameter / 300,
        rotation: 0,
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
        //...p.getCurveParameters(currentType, shapeDiameter, 0, 0)
      };
    } else if (type === 'aioien'){
      let shapeDiameter = 3 * 50; // 1cm = 50px と仮定
      newShape = {
        type: type,
        x: p.width/2,
        y: p.height/2,
        d: shapeDiameter,
        scale: shapeDiameter / 300,
        rotation: 0,
        flags : {
          end: true,    // 初期状態: 端が切断されている
          middle: false // 初期状態: 中央が切断されていない
        }
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
        selectedColor = button.getAttribute('data-color');//選択した色を取得
        if (mode2D == true) {// 図形全体の色設定
          colorSelector.classList.add('hidden');
          if (pendingShape) {
            p.addDecidedShape();
          }
        } else if (selectedCurve && selectedcustomizeShape) {
          //console.log('ok');
          // 選択されたカーブに色を適用
          let { layerIndex, shapeIndex, curveIndex } = selectedCurve;
          innerCurvesData[layerIndex][shapeIndex][curveIndex].color = selectedColor;
          
          //innerCurvesDataに色を設定
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

  p.setupCuttingButton = function  () {
    // ボタンの取得
    let endCuttingButton = document.getElementById("end-cutting-button");
    let middleCuttingButton = document.getElementById("middle-cutting-button");
          
    // 初期状態をボタンのテキストから取得
    let isEndCuttingConnected = endCuttingButton.textContent === "接続" ? false : true;
    let isMiddleCuttingConnected = middleCuttingButton.textContent === "接続" ? false : true;
    
    // 上部（端）のボタンのクリックイベント
    endCuttingButton.addEventListener('click', () => {
      isEndCuttingConnected = !isEndCuttingConnected; // 状態を反転
      endCuttingButton.textContent = isEndCuttingConnected ? "切断" : "接続"; // 表示を更新
      //console.log(`上部ボタンの状態: ${isEndCuttingConnected ? "切断" : "接続"}`);
      selectedcustomizeShape.flags.end = !selectedcustomizeShape.flags.end;
    });
    
    // 下部（中央）のボタンのクリックイベント
    middleCuttingButton.addEventListener('click', () => {
      isMiddleCuttingConnected = !isMiddleCuttingConnected; // 状態を反転
      middleCuttingButton.textContent = isMiddleCuttingConnected ? "切断" : "接続"; // 表示を更新
      //console.log(`下部ボタンの状態: ${isMiddleCuttingConnected ? "切断" : "接続"}`);
      selectedcustomizeShape.flags.middle = !selectedcustomizeShape.flags.middle;
    });
  }

  //図形追加２段階目、色を設定してレイヤーに格納
  p.addDecidedShape = function () {
    if (pendingShape && selectedColor) {
        pendingShape.color = selectedColor;
        //pendingShape.innerCurveColor = selectedColor; // インナーカーブ用の色も設定
        //新しいレイヤー作って、そこに図形を格納
        let newLayer = {name: `Layer ${layers.length + 1}`, shapes: [pendingShape]};
        layers.push(newLayer);

        p.updateLayerList();
        
        // zIndexを設定（zの値を設定、レイヤー毎に８ずつ増加）
        let zOffset = 0;
        layers.forEach(layer => {
            layer.shapes.forEach(shape => {
                shape.zIndex = zOffset;
            });
            zOffset += 8;
        });

        // compShapesを更新（ちょっとよくわかんない）
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

  //2D<->3Dへの変換（変換ボタンが押された時の関数）
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

      //接続した結果90を超える長さになるなら変換不可
      let material = getMaterialColor();
      for (const [color, values] of Object.entries(material)) {
        for (const [key, data] of Object.entries(values)) {
          const numericKey = parseInt(key, 10); // キーを整数に変換
          if (numericKey > 90) {
            console.log("水引の長さが90cmを超える場所があるため変換できません。図形の接続を見直してください。");
            p.convert();
          }
        }
      }
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
  //カメラ固定の関数
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
          if (innerCurvesData[layerIndex] && 
              innerCurvesData[layerIndex][shapeIndex] && 
              innerCurvesData[layerIndex][shapeIndex][curveIndex]) {
            selectedCurve = { layerIndex: layerIndex, shapeIndex: shapeIndex, curveIndex: curveIndex };
            //console.log("Selected curve:", selectedCurve);
            originalColor = innerCurvesData[layerIndex][shapeIndex][curveIndex].color;//ハイライトする前に現状の色を覚えさせておいて、ハイライト解除しても大丈夫なようにする
            p.changeSelectedCurveColor({ r: 255, g: 255, b: 0 }); // 黄色でハイライト
          } else {//そんなカーブ存在しません
            console.log("Invalid curve index");
            originalColor = null;
            nowKey = null;
            selectedCurve = null;
          }
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

  //innerCurvesDataに色を設定
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

  //色変更やめたい時、元に戻す
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

  //図形のリサイズ、図形移動の関数
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
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'ume') {
          let markerX = shape.x + shape.d / 2 * p.cos(p.QUARTER_PI);
          let markerY = shape.y + shape.d / 2 * p.sin(p.QUARTER_PI);
          if (p.mouseX > markerX - resizeCornerSize / 2 && p.mouseX < markerX + resizeCornerSize / 2 &&
              p.mouseY > markerY - resizeCornerSize / 2 && p.mouseY < markerY + resizeCornerSize / 2) {
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'renzoku') {
          let cornerX = shape.x + shape.w / 2;
          let cornerY = shape.y + shape.l / 2;
          if (p.mouseX > cornerX - resizeCornerSize / 2 && p.mouseX < cornerX + resizeCornerSize / 2 &&
              p.mouseY > cornerY - resizeCornerSize / 2 && p.mouseY < cornerY + resizeCornerSize / 2) {
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'aioien') {
          let markerX = shape.x + shape.d / 2 * p.cos(p.QUARTER_PI);
          let markerY = shape.y + shape.d / 2 * p.sin(p.QUARTER_PI);
          if (p.mouseX > markerX - resizeCornerSize / 2 && p.mouseX < markerX + resizeCornerSize / 2 &&
              p.mouseY > markerY - resizeCornerSize / 2 && p.mouseY < markerY + resizeCornerSize / 2) {
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex};
            return;
          }
        } else if (shape.type === 'kame') {
          let cornerX = shape.x + shape.w / 2;
          let cornerY = shape.y - shape.l / 4;
          
          // 判定範囲のクリック判定
          if (p.mouseX > cornerX - resizeCornerSize / 2 && p.mouseX < cornerX + resizeCornerSize / 2 &&
              p.mouseY > cornerY - resizeCornerSize / 2 && p.mouseY < cornerY + resizeCornerSize / 2) {
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex };
            return;
          }
        } else if (shape.type === 'kame2') {
          let angle = p.QUARTER_PI; // 四角を描画したい角度（ここでは 45 度）
          
          // 楕円上の点を計算
          let markerX = shape.x + (shape.w / 2) * p.cos(angle); // 楕円の横幅 (w) を半径として使用
          let markerY = shape.y + (shape.l / 2) * p.sin(angle); // 楕円の縦幅 (l) を半径として使用
          
          // 判定範囲のクリック判定
          if (p.mouseX > markerX - resizeCornerSize / 2 && p.mouseX < markerX + resizeCornerSize / 2 &&
              p.mouseY > markerY - resizeCornerSize / 2 && p.mouseY < markerY + resizeCornerSize / 2) {
            resizing = { layerIndex: layerIndex, shapeIndex: shapeIndex };
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
  
  //図形のリサイズ、図形移動の関数
  p.mouseDragged = function () {
    // リサイズ処理
    if (resizing) {
      p.resizeShape(resizing);
    }
    // 図形移動
    if (mode2D && selectedShape && document.getElementById('tab1').checked) {
      if (selectedShape.d) {
        //constrain = 動的な数値(mouseXなど)をconstrainに渡すと、指定した範囲を超えない数値を返してくれる関数
        selectedShape.x = p.constrain(p.mouseX, selectedShape.d/2, p.width - selectedShape.d/2);
        selectedShape.y = p.constrain(p.mouseY, selectedShape.d/2, p.height - selectedShape.d/2);
      } else {
        selectedShape.x = p.constrain(p.mouseX, selectedShape.w/2, p.width - selectedShape.w/2);
        selectedShape.y = p.constrain(p.mouseY, selectedShape.l/2, p.height - selectedShape.l/2);
      }
    }
  }
  
  //図形のリサイズ、図形移動の関数
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

  //リサイズ処理、最大最小を決めてる
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
      //この縦横比だと作れないとかあるかもしれないので細かく設定しよう！
      minWidth = 30;
      maxWidth = 150;
      minLength = 70;
      maxLength = 370;
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
    } else if (shape.type === 'aioien') {
      minSize = 80;
      maxSize = 200;
      shape.d = p.constrain(p.dist(shape.x, shape.y, p.mouseX, p.mouseY) * 2, minSize, maxSize);
    } else if (shape.type === 'kame') {
      minWidth = 80;
      maxWidth = 300;
      shape.w = p.constrain((p.mouseX - shape.x) * 2, minWidth, maxWidth);
      shape.l = shape.w * 1.8;
    } else if (shape.type === 'kame2') {
      minWidth = 50;
      maxWidth = 300;
      shape.w = p.constrain((p.mouseX - shape.x) * 2, minWidth, maxWidth);
      shape.l = shape.w * 1.6;
    }
  }  

  p.toggleLayerMenu = function () {
    layerList.classList.toggle('hidden');
  }

  //レイヤーリストの操作
  p.updateLayerList = function () {
    layerList.innerHTML = '';

    layers.forEach((layer, layerIndex) => {
      const layerItem = document.createElement('li');
      layerItem.className = 'layer-item';
      layerItem.draggable = true;
      layerItem.innerHTML = `
        <span class="layer-name">${layer.name}</span>
        <ul class="shape-list"></ul>
      `;//Layer1 、２、３とかの部分

      const shapeList = layerItem.querySelector('.shape-list');

      layer.shapes.forEach((shape, shapeIndex) => {
        const shapeItem = document.createElement('li');
        shapeItem.className = 'shape-item';
        shapeItem.draggable = true;
        shapeItem.innerHTML = `
          <span class="drag-handle">&#9776;</span>
          <span>${shape.type} ${shapeIndex}</span>
        `;//awaji 1とかの部分

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

        //マウスをどかしたらハイライト消す
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

  //type = shapeをドラッグしてるかレイヤーをドラッグしてるか
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

    let dropTarget = e.target;//ドロップ先
    let dropType = 'layerList'; // ドロップ先のタイプ（デフォルトはレイヤーリスト全体）

    //マウスが近いやつでタイプを決定（レイヤーかshapeか）
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

    //レイヤーの順番を変更
    if (type === 'layer' && dropType === 'layer') {
      const dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);

      if (layerIndex !== dropLayerIndex) {
        const [draggedLayer] = layers.splice(layerIndex, 1);// 現在のレイヤーリストからドラッグされたレイヤーを取り出し、削除
        layers.splice(dropLayerIndex, 0, draggedLayer);// 削除したレイヤーをドロップ先のインデックスに挿入
        // innerCurvesData も対応するレイヤーの情報を移動
        const [draggedCurveData] = innerCurvesData.splice(layerIndex, 1);// innerCurvesData からドラッグされたレイヤーに対応するデータを取り出し、削除
        innerCurvesData.splice(dropLayerIndex, 0, draggedCurveData);// 削除したデータをドロップ先のインデックスに挿入
      }
    } else if (type === 'shape') {//図形を他のレイヤーに移動
      let dropLayerIndex;
      let dropShapeIndex = -1;

      if (dropType === 'layer') {
        dropLayerIndex = Array.from(layerList.children).indexOf(dropTarget);
      } else if (dropType === 'shape') {
        const dropLayerItem = dropTarget.closest('.layer-item');
        dropLayerIndex = Array.from(layerList.children).indexOf(dropLayerItem);
        const dropShapeList = dropLayerItem.querySelector('.shape-list');
        dropShapeIndex = Array.from(dropShapeList.children).indexOf(dropTarget);
      } else if (dropType === 'layerList') {//おそらく不要
        // 新しいレイヤーを作成
        dropLayerIndex = layers.length;
        layers.push({name: `Layer ${layers.length + 1}`, shapes: []});
      }

      if (dropLayerIndex !== undefined) {
        const [draggedShape] = layers[layerIndex].shapes.splice(shapeIndex, 1);
        const [draggedCurveData] = innerCurvesData[layerIndex].splice(shapeIndex, 1); // innerCurvesData からも削除

        // レイヤー移動した時に接続判定を切る
        if (draggedShape.isConnected) {
          const connectedShape = draggedShape.isConnected.shape; // 接続相手の図形を取得
          connectedShape.isConnected = null; // 接続相手の接続情報を解除
          draggedShape.isConnected = null; // ドラッグされた図形の接続情報を解除
        }

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
    //console.log(selectedcustomizeShape.type);

    // スライダーを表示
    document.getElementById('rotation-slider-container').classList.remove('hidden');
    // スライダーの値を選択した図形の回転度に設定
    document.getElementById('rotation-slider').value = selectedcustomizeShape.rotation;

    //切断接続のボタン、図形によってあるのとないのとがある
    if (selectedcustomizeShape.type === 'awaji' || selectedcustomizeShape.type === 'kame') {
      document.getElementById('cutting-button-container').classList.remove('hidden');
      // ボタンの取得
      let endCuttingButton = document.getElementById("end-cutting-button");
      let middleCuttingButton = document.getElementById("middle-cutting-button");
      // 初期状態を取得
      endCuttingButton.textContent = selectedcustomizeShape.flags.end ? "接続" : "切断";
      middleCuttingButton.textContent = selectedcustomizeShape.flags.middle ? "接続" : "切断";
      middleCuttingButton.disabled = true;
    } else if (selectedcustomizeShape.type === 'renzoku') {
      document.getElementById('cutting-button-container').classList.remove('hidden');
      // ボタンの取得
      let endCuttingButton = document.getElementById("end-cutting-button");
      let middleCuttingButton = document.getElementById("middle-cutting-button");
      // 初期状態を取得
      endCuttingButton.textContent = selectedcustomizeShape.flags.end ? "接続" : "切断";
      middleCuttingButton.textContent = selectedcustomizeShape.flags.middle ? "接続" : "切断";
    } else {
      document.getElementById('cutting-button-container').classList.add('hidden');
    }

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
      let cuttingButton = document.getElementById("cutting-button-container");
      // クリックされたのがshapeItemでなければ選択解除
      if (customizeShapeIndex !== -1 && customizeLayerIndex !== -1) {
        // クリックされた場所がレイヤーリスト・カラー選択・スライダー以外か確認
        if (!layerList.contains(event.target) && !colorSelector.contains(event.target) && !rotationSlider.contains(event.target) && !cuttingButton.contains(event.target)) {
          customizeShapeIndex = -1;
          customizeLayerIndex = -1;

          selectedcustomizeShape = null;
          rotationSlider.classList.add('hidden');
          if (!mode2D){// カラー選択を非表示に
            colorSelector.classList.add('hidden');
          }
          cuttingButton.classList.add('hidden');
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
      const renderedConnections = new Set(); // 描画済み接続を記録
      layers.forEach((layer, layerIndex) => {
        layer.shapes.forEach((shape, shapeIndex) => {
          //drawShape(p, shape, layerIndex, shapeIndex, 0, -1, null);
          let adjustedPoints = adjustControlPoints(shape);

          let connected = false;
          // connectors 内の isConnected フラグを確認して、接続されているかをチェック
          if (shape.connectors) {
            for (let connectorSet of shape.connectors) {
              if (connectorSet.isConnected !== null) {
                connected = true;
                break;
              }
            }
          }

          if (!connected) {
            drawShape(p, shape, layerIndex, shapeIndex, 0, -1, adjustedPoints);
          } else {
            // 接続されている図形の描画
            shape.connectors.forEach((connectorSet, setIndex) => {
              // 接続先の図形を探す
              if (connectorSet.isConnected?.shape) {
                const shape2 = connectorSet.isConnected.shape;
      
                // 接続ペアを一意に識別するために文字列を生成
                const connectionKey = `${Math.min(shape.id, shape2.id)}-${Math.max(shape.id, shape2.id)}`;
      
                if (!renderedConnections.has(connectionKey)) {
                  // 未描画の接続のみ描画
                  drawConnect(p, shape, layerIndex, shapeIndex, adjustedPoints, 0, -1);
                  renderedConnections.add(connectionKey);
                }
              }
            });
          }
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
  
  const renderedGroups = new Set(); // 描画済みの図形IDを記録
  // 各パーツごとに新しいキャンバスを作成
  layers.forEach((layer, layerIndex) => {
    layer.shapes.forEach((shape, shapeIndex) => {
      let adjustedPoints = adjustControlPoints(shape);
      let connected = false;
      let connect_f = 0;// コネクト→１
  
      // connectors 内の isConnected フラグを確認
      if (shape.connectors) {
        for (let connectorSet of shape.connectors) {
          if (connectorSet.isConnected !== null) {
            connected = true;
            break;
          }
        }
      }

      if (!connected) {
        // 接続されていない場合は単独の図形を描画
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'canvas-wrapper';
        partsCanvasContainer.appendChild(canvasWrapper);

        const sketch = new p5((p) => {
          p.setup = function () {
            let canvas = p.createCanvas(250, 250, p.WEBGL);
            canvas.parent(canvasWrapper);
          };

          p.draw = function () {
            p.background(250);
            p.orbitControl();
            drawShape(p, shape, layerIndex, shapeIndex, 1, -1, adjustedPoints);
          };
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
          showModal(layerIndex, shapeIndex, connect_f);
        });
      } else {
        // 接続されている場合、接続グループを描画
        shape.connectors.forEach((connectorSet) => {
          if (connectorSet.isConnected?.shape) {
            const shape2 = connectorSet.isConnected.shape;

            // 接続ペアを一意に識別するためのキーを生成
            const connectionKey = `${Math.min(shape.id, shape2.id)}-${Math.max(shape.id, shape2.id)}`;
            connect_f = 1

            if (!renderedGroups.has(connectionKey)) {
              // 新しいキャンバスを作成して接続グループを描画
              const canvasWrapper = document.createElement('div');
              canvasWrapper.className = 'canvas-wrapper';
              partsCanvasContainer.appendChild(canvasWrapper);

              const sketch = new p5((p) => {
                p.setup = function () {
                  let canvas = p.createCanvas(250, 250, p.WEBGL);
                  canvas.parent(canvasWrapper);
                };

                p.draw = function () {
                  p.background(250);
                  p.orbitControl();
                  drawConnect(p, shape, layerIndex, shapeIndex, adjustedPoints, 1, -1);
                };
              }, canvasWrapper);

              partsSketches.push(sketch);

              // 接続ペアを記録
              renderedGroups.add(connectionKey);

              // 「作成する」ボタンの追加
              const createButton = document.createElement('button');
              createButton.textContent = '作成する'; // ボタンのテキスト
              canvasWrapper.appendChild(createButton);

              // ボタンのクリックイベントを設定
              createButton.addEventListener('click', () => {
                // ボタンがクリックされたときの処理をここに書く
                //console.log(`レイヤー ${layerIndex} のパーツ ${shapeIndex} の作り方の表示`);
                showModal(layerIndex, shapeIndex, connect_f);
              });
            }
          }
        });
      }


      // モーダルを表示する関数
      function showModal(layerIndex, shapeIndex, connect_f) {
        const modal = document.getElementById('modal');
        const modalText = document.getElementById('modal-text');
        const modalCanvasContainer = document.getElementById('modal-canvas-container');
        
        // モーダルに表示する内容を設定
        modalText.textContent = ``;

        // モーダルを表示
        modal.style.display = 'block';

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

        // 作り方未実装の場合エラー落ちしないように
        if (!partsPoints[shape.type]){
          //return;
        }

        // 既存のキャンバスをクリア
        modalCanvasContainer.innerHTML = '';

        // プロセス数表示用のテキスト
        const processText = document.createElement('div');
        processText.id = 'process-buffer';
        modalCanvasContainer.appendChild(processText);

        // 必要素材を表示する要素を作成
        const materialsText = document.createElement('div');
        materialsText.id = 'materials-text';
        materialsText.style.position = 'absolute';
        materialsText.style.top = '50%';
        materialsText.style.left = '50%';
        materialsText.style.transform = 'translate(-50%, -50%)';
        function getMaterial() {
          const materialsContainer = document.createElement('div'); // <div>コンテナを作成
          let j = 0;
          let material = [];
          let connected = false;
          // connectors 内の isConnected フラグを確認
          if (shape.connectors) {
            for (let connectorSet of shape.connectors) {
              if (connectorSet.isConnected !== null) {
                connected = true;
                break;
              }
            }
          }
          if (connected) {
            // 接続されている場合、接続グループを描画
            shape.connectors.forEach((connectorSet) => {
              if (connectorSet.isConnected?.shape) {
                const shape2 = connectorSet.isConnected.shape;
                // shape と shape2 の曲線本数と cm を取得
                const numCurves1 = shape.numInnerCurves;
                const numCurves2 = shape2.numInnerCurves;
                const maxCurves = Math.max(numCurves1, numCurves2);
                const cm1 = shape.materialCm;
                const cm2 = shape2.materialCm;
          
                // 合計本数に基づく cm の分配を計算
                for (let i = 0; i < maxCurves; i++) {
                  let color;
          
                  if (innerCurvesData[layerIndex] && innerCurvesData[layerIndex][shapeIndex] && innerCurvesData[layerIndex][shapeIndex][i]) {
                    color = innerCurvesData[layerIndex][shapeIndex][i].color;
                  } else {
                    color = shape.color;
                  }
          
                  let cm;
                  if (i < Math.min(numCurves1, numCurves2)) {
                    cm = cm1 + cm2; // 両方の本数が対応する部分は合計 cm
                  } else if (numCurves1 > numCurves2) {
                    cm = cm1;
                  } else {
                    cm = cm2;
                  }
          
                  // material 情報を追加
                  material[j] = {
                    color: color, // color情報
                    cm: cm 
                  };
                  j++;
                }
              }});
              material.forEach(item => {
                if (item.cm === 53) {
                  item.cm = 60;
                } else if (item.cm === 68) {
                  item.cm = 67;
                } else if (item.cm === 75 || item.cm === 83) {
                  item.cm = 90;
                }
              });
          } else {
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
          }
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
          // materialオブジェクトに含まれる色と長さに対してループ
          for (let color in materialz) {
            for (let cm in materialz[color]) {
              const num = materialz[color][cm].num; // 本数

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
              materialsContainer.appendChild(listItem);
            }
          }
          // 必要素材の情報をmaterialsTextに追加
          materialsText.textContent = `必要素材:`;
          materialsText.appendChild(materialsContainer);
        }
        getMaterial();
        modalCanvasContainer.appendChild(materialsText);

        // グローバル変数としてボタンを取得
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');

        let processNo = 0;
        let totalProcesses;
        let middle_f = 0;
        let end_f = 0; 
        let shape2;//接続相手
        if (connect_f == 1) {       
          let shape1ConnectSet, shape2ConnectSet; 
          shape.connectors.forEach((connectorSet, index) => {
            if (connectorSet.isConnected !== null) {
              shape2 = connectorSet.isConnected.shape;  // 接続先の図形を取得
              shape1ConnectSet = index;
            }
          });
          shape2.connectors.forEach((connectorSet, index) => {
            if (connectorSet.isConnected !== null && connectorSet.isConnected.shape === shape) {
              shape2ConnectSet = index; // shape2 の接続セットインデックスを取得
            }
          });
          let total1, total2;//それぞれの全体のプロセス数
          if (shape.type === 'renzoku') {
            total1 = (shape.renzokuNum-1)*4+4;
            if (shape1ConnectSet == 0) {
              //console.log('1');
              
              generateRenzokuPoints(shape.renzokuNum, 'renzoku', 1, 1, total1, 0);
            } else {
              //console.log('2');
              if (shape.flags.end == true) {
                generateRenzokuPoints(shape.renzokuNum, 'renzoku', 0, 1, total1, 0);
              } else {
                generateRenzokuPoints(shape.renzokuNum, 'renzoku', 0, 1, total1, 1);
                end_f = 1;
                total1+=2;
              }
            }
            //console.log(partsPoints['renzoku']);
          } else {total1 = getTotalProcesses(shape.type)};
          if (shape2.type === 'renzoku') {
            total2 = (shape2.renzokuNum-1)*4+3;
            if (shape.flags.end == true && shape2ConnectSet == 1) {
              generateRenzokuPoints(shape2.renzokuNum, 'renzoku2', 0, 0, total2, 1);
              end_f = 1;
              total2+=2;
            } else {
              generateRenzokuPoints(shape2.renzokuNum, 'renzoku2', 0, 0, total2, 0);
            }

            if (shape2.flags.middle == true) {// 下が切断されている場合、
              // partsPoints['renzoku']の最後の要素を取得
              const lastProcessKey = Object.keys(partsPoints['renzoku2']).slice(-1)[0];
              const lastArray = partsPoints['renzoku2'][lastProcessKey];
              // 配列をコピー
              const copiedArray = [...lastArray];
              //console.log(lastArray);
              // 配列の中央の要素2つを削除して分割
              const midIndex = Math.floor(copiedArray[0].length / 2);//中央を計算して
              const firstPart = [...copiedArray[0].slice(0, midIndex - 1), { x: 90, y: 90+(shape2.renzokuNum-1)*90, z: 0 }]; // 中央の前まで
              const secondPart = [{ x: -90, y: 90+(shape2.renzokuNum-1)*90, z: 0 }, ...copiedArray[0].slice(midIndex + 1)]; // 中央の後から
              
              // 新しいプロセスキーを生成（プロセス数を増やす）
              const newProcessKey = `process${Object.keys(partsPoints['renzoku2']).length + 1}`;
              partsPoints['renzoku2'][newProcessKey] = [firstPart, secondPart];
              total2++;
              middle_f = 1;
            }
          } else {total2 = getTotalProcesses(shape2.type)};
          totalProcesses = total1 + total2;
          //console.log(total1, total2, totalProcesses);
          //console.log(totalProcesses);

        } else  if (shape.type === 'renzoku') {
          totalProcesses = (shape.renzokuNum-1)*4+3;
          //console.log('4');
          //generateRenzokuPoints(shape.renzokuNum, 'renzoku', 0, 0, totalProcesses);
          if (shape.flags.end == true) {
            generateRenzokuPoints(shape.renzokuNum, 'renzoku', 0, 0, totalProcesses, 0);
          } else {
            generateRenzokuPoints(shape.renzokuNum, 'renzoku', 0, 0, totalProcesses, 1);
            end_f = 1;
            totalProcesses += 2;
          }
          //console.log(partsPoints['renzoku']);
          if (shape.flags.middle == true) {// 下が切断されている場合、
            // partsPoints['renzoku']の最後の要素を取得
            const lastProcessKey = Object.keys(partsPoints['renzoku']).slice(-1)[0];
            const lastArray = partsPoints['renzoku'][lastProcessKey];
            //console.log(lastArray);
            // 配列をコピー
            const copiedArray = [...lastArray];
            // 配列の中央の要素2つを削除して分割
            const midIndex = Math.floor(copiedArray[0].length / 2);
            const firstPart = [...copiedArray[0].slice(0, midIndex - 1), { x: 90, y: 90+(shape.renzokuNum-1)*90, z: 0 }]; // 中央の前まで
            const secondPart = [{ x: -90, y: 90+(shape.renzokuNum-1)*90, z: 0 }, ...copiedArray[0].slice(midIndex + 1)]; // 中央の後から
            
            //console.log(copiedArray, midIndex, firstPart,secondPart);
            // 新しいプロセスキーを生成
            const newProcessKey = `process${Object.keys(partsPoints['renzoku']).length + 1}`;
            partsPoints['renzoku'][newProcessKey] = [firstPart, secondPart];
                        
            totalProcesses++;
            middle_f = 1;
            //console.log(partsPoints['renzoku']);
          }
          //console.log(partsPoints['renzoku']);
        } else {
          totalProcesses = getTotalProcesses(shape.type);
        }

        // ボタンの状態を更新する関数
        function updateButtonStates() {
          //0より下にはいけない、最大プロセス数より上にはいけない
          prevButton.disabled = processNo <= 0;
          nextButton.disabled = processNo >= totalProcesses;

          // ボタンの色を更新
          prevButton.style.backgroundColor = prevButton.disabled ? '#ccc' : '#007bff';
          nextButton.style.backgroundColor = nextButton.disabled ? '#ccc' : '#007bff';

          // 同時に工程数も表示
          processText.textContent = `${processNo} / ${totalProcesses}`;
          modalText.textContent = '';
          if (connect_f == 1) {
            if (shape.numInnerCurves > shape2.numInnerCurves) {
              if (processNo == 1) {
                modalText.textContent = '長い水引'+shape2.numInnerCurves+'本を持って水引中央で始めます';
              } else if (shape2.renzokuNum 
                ? processNo > (shape2.renzokuNum - 1) * 4 + 3 
                : processNo > getTotalProcesses(shape2.type)) {
                modalText.textContent = '内側に沿うようにして残りの水引を持ちパーツ上部を編む'
              }
            } else if (shape.numInnerCurves < shape2.numInnerCurves) {
              if (processNo == 1) {
                modalText.textContent = '長い水引を外側にして水引中央で始めます';
              } else if (shape2.renzokuNum 
                ? processNo > (shape2.renzokuNum - 1) * 4 + 3 
                : processNo > getTotalProcesses(shape2.type)) {
                modalText.textContent = '内側の水引'+(shape2.numInnerCurves-shape.numInnerCurves)+'本を切り、残りの水引でパーツ上部を編む'
              }
            }
          }

          if (middle_f == 1 ) {
            if (processNo == totalProcesses) {
              modalText.textContent = `パーツ下部の中央をハサミで切る`;
            } else if (processNo == totalProcesses-2 && end_f == 1 ) {
              modalText.textContent = `パーツ上部の右側の端を見えないようにハサミで切る`;
            } else if (processNo == totalProcesses-1 && end_f == 1 ) {
              modalText.textContent = `パーツ上部の左端をカーブさせて右端の後ろに回し接着する`;
            }
          } else {
            if (processNo == totalProcesses-1 && end_f == 1 ) {
              modalText.textContent = `パーツ上部の右側の端を見えないようにハサミで切る`;
            } else if (processNo == totalProcesses && end_f == 1 ) {
              modalText.textContent = `パーツ上部の左端をカーブさせて右端の後ろに回し接着する`;
              //modalText.style.whiteSpace = "pre-line";//改行の時は\nを入れてこれを書く
            }
          }

          if (modalText.textContent == '') {//その他の場合のコメント
            modalText.textContent = `水引中央で作成してください`;
          }
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
            if (processNo >= 1) {
              if (connect_f == 1) {
                getConnectShapeProcess(p, shape, layerIndex, shapeIndex, processNo);
              } else {
                drawShape(p, shape, layerIndex, shapeIndex, 1, processNo, null);
              }
            }
          };
        }, modalCanvasContainer);
       
        // 矢印ボタンのクリックイベント
        prevButton.addEventListener('click', () => {
          //console.log(partsPoints['renzoku']);
          if (processNo > 0) {
            processNo--;
            updateButtonStates();
            if (processNo === 0) {
              materialsText.style.display = 'block';
            }
            // キャンバスを再描画
            modalSketch.redraw();
          }
        });

        nextButton.addEventListener('click', () => {
          if (processNo < totalProcesses+1) {
            processNo++;
            updateButtonStates();
            if (processNo === 1) {
              materialsText.style.display = 'none';
            }
            // キャンバスを再描画
            modalSketch.redraw();
          }
        });
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

function drawShape(p, shape, layerIndex,shapeIndex, parts_f, processNo, point) {
  //processNo = -1 -> 作り方以外の描画、1~だったら、そのプロセス数のモデルの描画
  //parts_f = 1 -> パーツ一覧のキャンバス用で、キャンバス中央、回転なしで描画
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
    if (shape.type === 'connect') {
      points = point;
    } else {
      if (shape.type === 'awaji') {
        //points = [awaji_points];
        points = point;
      } else if (shape.type === 'ume') {
        points = [ume_points];
      } else if (shape.type === 'renzoku') {
        const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55]; // インデックス0は使用しない
        scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
        //points = [renzokuAwaji(shape.renzokuNum)];//何連続か
        points = point;
      } else if (shape.type === 'aioien') {
        scaleValue = shape.scale * 1.3;
        points = [aioien_points];
      } else if (shape.type === 'kame') {
        scaleValue = shape.scale  * 1.2;
        points = point;
      } else if (shape.type === 'kame2') {
        scaleValue = shape.scale  * 1.4;
        points = [kame2_points];
      }
    p.scale(scaleValue);
    }
  } else {//モデルのタイプとプロセス数を渡して制作途中のモデルの配列をもらう
    if (shape.type === 'connect') {
      points = point;
      scaleValue = 1;
    } else if (shape.type === 'renzoku') {
      points = getProcessPoints(shape.type, processNo);
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55]; // インデックス0は使用しない
      scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
    } else if (shape.type === 'aioien') {
      points = [getProcessPoints(shape.type, processNo)];
      scaleValue = shape.scale * 1.3;
    } else if (shape.type === 'kame') {
      points = [getProcessPoints(shape.type, processNo)];
      scaleValue = shape.scale  * 1.2;
    } else if (shape.type === 'kame2') {
      points = [getProcessPoints(shape.type, processNo)];
      scaleValue = shape.scale  * 1.4;
    } else {
      points = [getProcessPoints(shape.type, processNo)];
    }
    p.scale(scaleValue);
  }
  
  let innerCurves;
  if (shape.type == 'connect') {
    //console.log(points);
    // 選ばれたインデックスを取得
    //接続元と接続相手のインナーカーブの数を取得して、大きい方に合わせる
    let selectedIndex = shape.shape[0].numInnerCurves > shape.shape[1].numInnerCurves ? 0 : 1;
    innerCurves = createInnerCurvesConnect(p, points, shape.shape[selectedIndex].numInnerCurves, shape.shape[selectedIndex].outerCurveWeight, shape.innerCurveWeight);
  } else {
    innerCurves = createInnerCurves(p, points, shape.numInnerCurves, shape.outerCurveWeight, shape.innerCurveWeight);
  }
//console.log(innerCurves);
  p.noFill();
  if (shape.innerCurveWeight) {
    p.strokeWeight(shape.innerCurveWeight);//水引の太さ（全部同じ）
  }
  let shapeInnerCurves = [];
  /*
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
  */

  // innerCurves が複数のカーブを含む配列を想定
  innerCurves.forEach((curveSet, curveSetIndex) => {
    curveSet.forEach((curve, curveIndex) => {
      //console.log(curveSet);
      let color;

      if (
        innerCurvesData[layerIndex] &&
        innerCurvesData[layerIndex][shapeIndex] &&
        innerCurvesData[layerIndex][shapeIndex][curveIndex]
      ) {
        // インナーカーブに色が設定されていれば
        color = innerCurvesData[layerIndex][shapeIndex][curveIndex].color;
      } else {
        // 設定されていなければ図形の色で
        color = shape.color;
      }

      // 色を適用
      if (typeof color === 'string') {
        p.stroke(color);
      } else {
        p.stroke(color.r, color.g, color.b);
      }

      // カーブを描画
      if (shape.type == 'connect') {
        //console.log(innerCurves, curveSet, curve);
        drawCurveFromPoints(p, curve, shape.shape[0].numInnerCurves, shape.shape[1].numInnerCurves, curveIndex);
      } else {
        drawCurveFromPoints(p, curve, shape.numInnerCurves, shape.numInnerCurves, curveIndex);
      }

      // 描画データを保存
      shapeInnerCurves.push({
        points: curve,
        color: color
      });
    });
  });
  
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
    { x: 30, y: 65, z: 8 , f: 1},
    { x: -30, y: 65, z: -8},
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
      z: point.z,
      ...(point.f !== undefined && { f: point.f }) // fが存在する場合のみ追加
    };
  });

  awajiRl_points = {
    process1: [
      { x: -45, y: -30, z: 5 },
      { x: 15, y: -75, z: -7 },
      { x: 70, y: -60, z: 5 },
      { x: 70, y: -5, z: -10 },
      { x: 10, y: 5, z: 5 },
      { x: -40, y: -20, z: -5 },
      { x: -60, y: -60, z: 5 },
      { x: -90, y: -120, z: 0 }
    ],
    process2: [
      { x: -45, y: -30, z: -5 },
      { x: 15, y: -75, z: 7 },
      { x: 70, y: -60, z: -5 },
      { x: 70, y: -5, z: 10 },
      { x: 10, y: 5, z: -5 },
      { x: -40, y: -20, z: 5 },
      { x: -60, y: -60, z: -5 },
      { x: -90, y: -120, z: 10 }
    ],
  }

  awajiRr_points = {
    process1: [
      { x: 90, y: -120, z: 0 },
      { x: 60, y: -60, z: -5 },
      { x: 40, y: -20, z: 5 },
      { x: -10, y: 5, z: -5 },
      { x: -70, y: -5, z: 10 },
      { x: -70, y: -60, z: -5 },
      { x: -15, y: -75, z: 7 },
      { x: 45, y: -30, z: -5 },
    ],
    process2: [
      { x: 90, y: -120, z: -10 },
      { x: 60, y: -60, z: 5 },
      { x: 40, y: -20, z: -5 },
      { x: -10, y: 5, z: 5 },
      { x: -70, y: -5, z: -10 },
      { x: -70, y: -60, z: 5 },
      { x: -15, y: -75, z: -7 },
      { x: 45, y: -30, z: 5 },
    ],
  }

  aioien_points = [
    { x: -50, y: 45, z: -5}, 
    { x: -95, y: -10, z: 5}, 
    { x: -75, y: -60, z: -5}, 
    { x: -20, y: -65, z: 5}, 
    { x: 45, y: -55, z: -5}, 
    { x: 90, y: -35, z: 5}, 
    { x: 95, y: 15, z: -5}, 
    { x: 60, y: 45, z: 5}, 
    { x: 0, y: 70, z: -5}, 
    { x: -60, y: 70, z: 5}, 
    { x: -90, y: 25, z: -5}, 
    { x: -65, y: -30, z: 5}, 
    { x: -20, y: -65, z: -5}, 
    { x: 35, y: -85, z: 5}, 
    { x: 80, y: -55, z: -5}, 
    { x: 73, y: -5, z: 5}, 
    { x: 60, y: 45, z: -5}, 
    { x: 30, y: 85, z: 5}, 
    { x: -25, y: 85, z: -5}, 
    { x: -50, y: 45, z: 5}, 
    { x: -65, y: -30, z: -5}, 
    { x: -45, y: -80, z: 5}, 
    { x: 5, y: -90, z: -5}, 
    { x: 45, y: -55, z: 5}, 
    { x: 75, y: -5, z: -5}, 
    { x: 85, y: 45, z: 5}, 
    { x: 55, y: 80, z: -5},  
    { x: 0, y: 70, z: 5}, 
    { x: -50, y: 45, z: -5}
  ];

  kame_points = [
    { x: 85, y: -145, z: -15 }, 
    { x: 40, y: -85, z: 3 }, 
    { x: 0, y: -75, z: -4 }, 
    { x: -20, y: -50, z: 4 }, 
    { x: -40, y: -30, z: -3 }, 
    { x: -70, y: -30, z: 4 }, 
    { x: -85, y: -80, z: -7 }, 
    { x: -30, y: -120, z: 5 }, 
    { x: 40, y: -90, z: -5 }, 
    { x: 60, y: -60, z: 4 }, 
    { x: 60, y: -20, z: -8 }, 
    { x: 40, y: 10, z: 3 }, 
    { x: -10, y: 45, z: 3 }, 
    { x: -70, y: 15, z: 8 }, 
    { x: -70, y: -45, z: -10 }, 
    { x: -15, y: -45, z: -2 }, 
    { x: 45, y: 10, z: -12 }, 
    { x: 30, y: 65, z: 9 }, 
    { x: -30, y: 65, z: -8 }, 
    { x: -45, y: 10, z: 4 }, 
    { x: 15, y: -40, z: -8 }, 
    { x: 70, y: -50, z: -3 }, 
    { x: 75, y: 15, z: -23 }, 
    { x: 15, y: 45, z: 8 }, 
    { x: -30, y: 10, z: -4 }, 
    { x: -45, y: -30, z: 6 }, 
    { x: -55, y: -60, z: -16 }, 
    { x: -40, y: -90, z: 3 }, 
    { x: 30, y: -120, z: -11 }, 
    { x: 85, y: -85, z: 12 }, 
    { x: 80, y: -30, z: -15 }, 
    { x: 50, y: -30, z: 4 }, 
    { x: 20, y: -50, z: -14 }, 
    { x: 0, y: -70, z: 4 }, 
    { x: -40, y: -85, z: -4 }, 
    { x: -85, y: -145, z: 22 }, 
  ]; 

  kame2_points = [
    { x: 58, y: -104, z: -7 }, 
    { x: 36, y: -90, z: 4 }, 
    { x: 8, y: -73, z: -3 }, 
    { x: -17, y: -51, z: 20 }, 
    { x: -48, y: -27, z: -17 }, 
    { x: -79, y: -30, z: -2 }, 
    { x: -76, y: -81, z: -3 }, 
    { x: -30, y: -115, z: -4 }, 
    { x: 25, y: -95, z: -3 }, 
    { x: 59, y: -61, z: -15 }, 
    { x: 42, y: -26, z: 6 }, 
    { x: 1, y: -8, z: -10 }, 
    { x: -20, y: 10, z: 4 }, 
    { x: -40, y: 30, z: -3 }, 
    { x: -85, y: 20, z: 4 }, 
    { x: -89, y: -37, z: -17 }, 
    { x: -41, y: -61, z: 16 }, 
    { x: 0, y: -50, z: 3 }, 
    { x: 33, y: -23, z: -11 }, 
    { x: 56, y: 7, z: 11 }, 
    { x: 60, y: 35, z: -17 }, 
    { x: 40, y: 70, z: 3 }, 
    { x: -10, y: 105, z: 3 }, 
    { x: -70, y: 75, z: 8 }, 
    { x: -70, y: 15, z: -10 }, 
    { x: -15, y: 15, z: -2 }, 
    { x: 45, y: 70, z: -12 }, 
    { x: 30, y: 125, z: 9 }, 
    { x: -30, y: 125, z: -8 }, 
    { x: -45, y: 70, z: 4 }, 
    { x: 15, y: 20, z: -8 }, 
    { x: 70, y: 10, z: 2 }, 
    { x: 75, y: 75, z: -23 }, 
    { x: 15, y: 105, z: 8 }, 
    { x: -30, y: 70, z: -4 }, 
    { x: -45, y: 30, z: 6 }, 
    { x: -46, y: 6, z: -16 }, 
    { x: -23, y: -20, z: 11 }, 
    { x: 7, y: -48, z: -9 }, 
    { x: 36, y: -62, z: 5 }, 
    { x: 83, y: -37, z: 18 }, 
    { x: 88, y: 20, z: -19 }, 
    { x: 50, y: 30, z: 7 }, 
    { x: 20, y: 10, z: -14 }, 
    { x: 0, y: -10, z: 8 }, 
    { x: -48, y: -28, z: 0 }, 
    { x: -56, y: -69, z: -17 }, 
    { x: -38, y: -90, z: 10 }, 
    { x: -8, y: -109, z: -16 }, 
    { x: 46, y: -113, z: 5 }, 
    { x: 76, y: -62, z: -3 }, 
    { x: 62, y: -36, z: 11 }, 
    { x: 28, y: -58, z: -8 }, 
    { x: 5, y: -70, z: 14 }, 
    { x: -37, y: -90, z: -6 }, 
    { x: -24, y: -136, z: 16 }, 
    { x: 27, y: -140, z: 2 }, 
    { x: 48, y: -103, z: -17 }, 
]; 
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

//それぞれの工程ごとの配列
const partsPoints = {
  awaji: {
    process1: [
      { x: -200, y: -90, z: -5 },
      { x: -120, y: -80, z: -5 }, 
      { x: -45, y: -60, z: -5 }, 
      { x: 18, y: -30, z: 5 }, 
      { x: 45, y: 15, z: -5 }, 
      { x: 30, y: 65, z: 8 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 15, z: 5 }, 
      { x: -18, y: -30, z: -5 }, 
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
  ume: {
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
      { x: 110, y: -125, z: 0 },
      { x: 80, y: -60, z: -5 },
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
      { x: -80, y: -60, z: 5 }, 
      { x: -110, y: -125, z: 0 }, 
    ],
    process4: [
      { x: 110, y: -125, z: 0 },
      { x: 80, y: -60, z: -5 },
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
      { x: -45, y: -75, z: 1 },
      { x: -5, y: -80, z: -5 },
    ],
    process5: [
      { x: 110, y: -125, z: 0 },
      { x: 80, y: -60, z: -5 },
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
      { x: -45, y: -75, z: 1 },
      { x: -5, y: -80, z: -5 },
      { x: 25, y: -40, z: 7 },
      { x: 10, y: 45, z: -10 }
    ],
    process6: [
      { x: 20, y: -90, z: 5 },
      { x: 50, y: -75, z: -1 },
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
      { x: -45, y: -75, z: 1 },
      { x: -5, y: -80, z: -5 },
      { x: 25, y: -40, z: 7 },
      { x: 10, y: 45, z: -10 }
    ],
    process7: [
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
    ],
  },
  aioien: {
    process1: [
      { x: -165, y: -85, z: 0 }, 
      { x: -93, y: -76, z: 0 }, 
      { x: -15, y: -36, z: 5 }, 
      { x: 53, y: 24, z: -5 }, 
      { x: 30, y: 85, z: 5 }, 
      { x: -25, y: 85, z: -5 }, 
      { x: -50, y: 25, z: 5 }, 
      { x: 20, y: -35, z: -5 }, 
      { x: 124, y: -80, z: 0 }, 
      { x: 190, y: -90, z: 0 }, 
    ],
    process2: [
      { x: 120, y: -155, z: 0 },
      { x: 90, y: -90, z: 0 },
      { x: 60, y: -30, z: -5 },
      { x: 40, y: 0, z: 5 },
      { x: -10, y: 45, z: -5 },
      { x: -70, y: 25, z: 10 },
      { x: -70, y: -30, z: -5 },
      { x: -15, y: -45, z: 7 },
    { x: 53, y: 24, z: -5 }, 
    { x: 30, y: 85, z: 5 }, 
    { x: -25, y: 85, z: -5 }, 
    { x: -50, y: 25, z: 3 }, 
    { x: 20, y: -35, z: -5 }, 
    { x: 124, y: -80, z: 0 }, 
    { x: 190, y: -90, z: 0 }, 
    ],
    process3: [
      { x: 120, y: -155, z: 0 },
      { x: 90, y: -90, z: 0 },
      { x: 60, y: -30, z: -5 },
      { x: 40, y: 0, z: 5 },
      { x: -10, y: 45, z: -5 },
      { x: -70, y: 25, z: 10 },
      { x: -70, y: -30, z: -5 },
      { x: -15, y: -45, z: 7 },
    { x: 53, y: 24, z: -5 }, 
    { x: 30, y: 85, z: 5 }, 
    { x: -25, y: 85, z: -5 }, 
    { x: -50, y: 25, z: 5 }, 
      { x: 15, y: -45, z: -7 },//
      { x: 70, y: -30, z: 5 },
      { x: 70, y: 25, z: -10 },
      { x: 10, y: 45, z: 5 },
      { x: -40, y: 0, z: -5 },
      { x: -60, y: -30, z: 5 },
      { x: -90, y: -90, z: 0 } 
    ],
    process4: [
      { x: 125, y: -155, z: 0 }, 
      { x: 104, y: -88, z: 0 }, 
      { x: 77, y: -31, z: -12 }, 
      { x: 57, y: 8, z: 5 }, 
      { x: -10, y: 72, z: -5 }, 
      { x: -70, y: 25, z: 10 }, 
      { x: -70, y: -30, z: -5 }, 
      { x: -3, y: -45, z: 7 }, 
      { x: 56, y: 24, z: -5 }, 
      { x: 30, y: 85, z: 5 }, 
      { x: -25, y: 85, z: -5 }, 
      { x: -57, y: 25, z: 5 }, 
      { x: 3, y: -45, z: -7 }, 
      { x: 70, y: -30, z: 5 }, 
      { x: 70, y: 25, z: -10 }, 
      { x: 10, y: 70, z: 5 }, 
      { x: -55, y: 19, z: -5 }, 
      { x: -75, y: -30, z: 12 }, 
      { x: -100, y: -90, z: 0 }, 
    ],
    process5: [
      { x: 148, y: -117, z: 5 }, 
      { x: 95, y: 8, z: -5 }, 
      { x: 60, y: 45, z: 5 }, 
      { x: 0, y: 70, z: -5 }, 
      { x: -60, y: 70, z: 5 }, 
      { x: -90, y: 25, z: -5 }, 
      { x: -65, y: -30, z: 5 }, 
      { x: -20, y: -65, z: -5 }, 
      { x: 35, y: -85, z: 5 }, 
      { x: 80, y: -55, z: -5 }, 
      { x: 73, y: -5, z: 5 }, 
      { x: 60, y: 45, z: -5 }, 
      { x: 30, y: 85, z: 5 }, 
      { x: -25, y: 85, z: -5 }, 
      { x: -50, y: 45, z: 5 }, 
      { x: -65, y: -30, z: -5 }, 
      { x: -45, y: -80, z: 5 }, 
      { x: 5, y: -90, z: -5 }, 
      { x: 45, y: -55, z: 5 }, 
      { x: 75, y: -5, z: -5 }, 
      { x: 85, y: 45, z: 5 }, 
      { x: 55, y: 80, z: -5 }, 
      { x: 0, y: 70, z: 5 }, 
      { x: -50, y: 45, z: -5 }, 
      { x: -95, y: -10, z: 5 }, 
      { x: -111, y: -42, z: 5 }, 
    ],
    process6: [
      { x: -50, y: 45, z: -5}, 
      { x: -95, y: -10, z: 5}, 
      { x: -75, y: -60, z: -5}, 
      { x: -20, y: -65, z: 5}, 
      { x: 45, y: -55, z: -5}, 
      { x: 90, y: -35, z: 5}, 
      { x: 95, y: 15, z: -5}, 
      { x: 60, y: 45, z: 5}, 
      { x: 0, y: 70, z: -5}, 
      { x: -60, y: 70, z: 5}, 
      { x: -90, y: 25, z: -5}, 
      { x: -65, y: -30, z: 5}, 
      { x: -20, y: -65, z: -5}, 
      { x: 35, y: -85, z: 5}, 
      { x: 80, y: -55, z: -5}, 
      { x: 73, y: -5, z: 5}, 
      { x: 60, y: 45, z: -5}, 
      { x: 30, y: 85, z: 5}, 
      { x: -25, y: 85, z: -5}, 
      { x: -50, y: 45, z: 5}, 
      { x: -65, y: -30, z: -5}, 
      { x: -45, y: -80, z: 5}, 
      { x: 5, y: -90, z: -5}, 
      { x: 45, y: -55, z: 5}, 
      { x: 75, y: -5, z: -5}, 
      { x: 85, y: 45, z: 5}, 
      { x: 55, y: 80, z: -5},  
      { x: 0, y: 70, z: 5}, 
      { x: -50, y: 45, z: -5}
    ],
  },
  kame: {
    process1: [
      { x: -200, y: -90, z: -5 },
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 200, y: -90, z: 5 },
    ],
    process2: [
      { x: 70, y: -120, z: 4 }, 
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 200, y: -90, z: 5 },
    ],
    process3: [
      { x: 70, y: -120, z: 4 }, 
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 75, y: 15, z: -23 }, 
      { x: 15, y: 45, z: 8 }, 
      { x: -30, y: 10, z: -4 }, 
      { x: -45, y: -30, z: 6 }, 
      { x: -65, y: -120, z: -16 }, 
    ],
    process4: [
      { x: -85, y: -80, z: -7 }, 
      { x: -30, y: -120, z: 5 }, 
      { x: 40, y: -90, z: -5 }, 
      { x: 60, y: -60, z: 4 },  
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 75, y: 15, z: -23 }, 
      { x: 15, y: 45, z: 8 }, 
      { x: -30, y: 10, z: -4 }, 
      { x: -45, y: -30, z: 6 }, 
      { x: -65, y: -120, z: -16 }, 
    ],
    process5: [
      { x: 85, y: -145, z: -15 }, 
      { x: 40, y: -85, z: 3 }, 
      { x: 0, y: -75, z: -4 }, 
      { x: -20, y: -50, z: 4 }, 
      { x: -40, y: -30, z: -3 }, 
      { x: -70, y: -30, z: 4 }, 
      { x: -85, y: -80, z: -7 }, 
      { x: -30, y: -120, z: 5 }, 
      { x: 40, y: -90, z: -5 }, 
      { x: 60, y: -60, z: 4 },  
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 75, y: 15, z: -23 }, 
      { x: 15, y: 45, z: 8 }, 
      { x: -30, y: 10, z: -4 }, 
      { x: -45, y: -30, z: 6 }, 
      { x: -65, y: -120, z: -16 }, 
    ],
    process6: [
      { x: 85, y: -145, z: -15 }, 
      { x: 40, y: -85, z: 3 }, 
      { x: 0, y: -75, z: -4 }, 
      { x: -20, y: -50, z: 4 }, 
      { x: -40, y: -30, z: -3 }, 
      { x: -70, y: -30, z: 4 }, 
      { x: -85, y: -80, z: -7 }, 
      { x: -30, y: -120, z: 5 }, 
      { x: 40, y: -90, z: -5 }, 
      { x: 60, y: -60, z: 4 },  
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 75, y: 15, z: -23 }, 
      { x: 15, y: 45, z: 8 }, 
      { x: -30, y: 10, z: -4 }, 
      { x: -45, y: -30, z: 6 }, 
      { x: -55, y: -60, z: -16 }, 
      { x: -40, y: -90, z: 3 }, 
      { x: 30, y: -120, z: -11 }, 
      { x: 85, y: -85, z: 12 }, 
      { x: 80, y: -30, z: -15 }, 
    ],
    process7: [
      { x: 85, y: -145, z: -15 }, 
      { x: 40, y: -85, z: 3 }, 
      { x: 0, y: -75, z: -4 }, 
      { x: -20, y: -50, z: 4 }, 
      { x: -40, y: -30, z: -3 }, 
      { x: -70, y: -30, z: 4 }, 
      { x: -85, y: -80, z: -7 }, 
      { x: -30, y: -120, z: 5 }, 
      { x: 40, y: -90, z: -5 }, 
      { x: 60, y: -60, z: 4 },  
      { x: 60, y: -20, z: -8 }, 
      { x: 40, y: 10, z: 3 }, 
      { x: -10, y: 45, z: 3 }, 
      { x: -70, y: 15, z: 8 }, 
      { x: -70, y: -45, z: -10 }, 
      { x: -15, y: -45, z: -2 }, 
      { x: 45, y: 10, z: -12 }, 
      { x: 30, y: 65, z: 9 }, 
      { x: -30, y: 65, z: -8 }, 
      { x: -45, y: 10, z: 4 }, 
      { x: 15, y: -40, z: -8 }, 
      { x: 70, y: -50, z: -3 }, 
      { x: 75, y: 15, z: -23 }, 
      { x: 15, y: 45, z: 8 }, 
      { x: -30, y: 10, z: -4 }, 
      { x: -45, y: -30, z: 6 }, 
      { x: -55, y: -60, z: -16 }, 
      { x: -40, y: -90, z: 3 }, 
      { x: 30, y: -120, z: -11 }, 
      { x: 85, y: -85, z: 12 }, 
      { x: 80, y: -30, z: -15 }, 
      { x: 50, y: -30, z: 4 }, 
      { x: 20, y: -50, z: -14 }, 
      { x: 0, y: -70, z: 4 }, 
      { x: -40, y: -85, z: -4 }, 
      { x: -85, y: -145, z: 22 }, 
    ],
  },
  renzoku: {},
  renzoku2: {},
  renzokuL: {
    process1: [
      { x: -45, y: -30, z: -5 },
      { x: 15, y: -75, z: 7 },
      { x: 70, y: -60, z: -5 },
    ],
    process2: [
      { x: 70, y: -5, z: 10 },
      { x: 10, y: 5, z: -5 },
      { x: -40, y: -20, z: 5 },
      { x: -60, y: -60, z: -5 },
      { x: -90, y: -120, z: 10 }
    ],
    process3: [
      { x: -45, y: -30, z: 5 },
      { x: 15, y: -75, z: -7 },
      { x: 70, y: -60, z: 5 },
    ],
    process4: [
      { x: 70, y: -5, z: -10 },
      { x: 10, y: 5, z: 5 },
      { x: -40, y: -20, z: -5 },
      { x: -60, y: -60, z: 5 },
      { x: -90, y: -120, z: 0 }
    ],
  },
  renzokuR: {
    process1: [
      { x: -70, y: -60, z: 5 },
      { x: -15, y: -75, z: -7 },
      { x: 45, y: -30, z: 5 },
    ],
    process2: [
      { x: 90, y: -120, z: -10 },
      { x: 60, y: -60, z: 5 },
      { x: 40, y: -20, z: -5 },
      { x: -10, y: 5, z: 5 },
      { x: -70, y: -5, z: -10 },
    ],
    process3: [
      { x: -70, y: -60, z: -5 },
      { x: -15, y: -75, z: 7 },
      { x: 45, y: -30, z: -5 },
    ],
    process4: [
      { x: 90, y: -120, z: 0 },
      { x: 60, y: -60, z: -5 },
      { x: 40, y: -20, z: 5 },
      { x: -10, y: 5, z: -5 },
      { x: -70, y: -5, z: 10 },
    ],
  }
};

//モデルの端が繋がってる場合（flag_end）（上部）の補助配列
const endPoints = {
  awaji: [
    { x: -30, y: -65, z: 8 },
    { x: 30, y: -65, z: -8 },
    { x: 60, y: -30, z: -5 },
  ], 
  
  kame: [
    { x: -30, y: -135, z: 8 }, 
    { x: 30, y: -135, z: -9 }, 
    { x: 40, y: -85, z: -10 }, 
  ]
}

//モデルの中間ポイント（下部）が切断されてる場合の補助配列
const middlePoints = {
  awaji: [
    { x: 90, y: 90, z: 0 },
    { x: -90, y: 90, z: 0 }
  ]
}

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
  let new_awajiRr = JSON.parse(JSON.stringify(awajiRr_points));  // ディープコピー
  let new_awajiRl = JSON.parse(JSON.stringify(awajiRl_points));  // ディープコピー
  let yDiff = Math.abs(new_awajiRr.process1[0].y - new_awajiRr.process1[6].y - 60);
  for (let i=0; i<n-1; i++){
    if (i % 2 === 1) {
      points = new_awajiRr.process1.concat(points.slice(1));
      points = points.slice(0, -1).concat(new_awajiRl.process1);
    } else {
      points = new_awajiRr.process2.concat(points.slice(1));
      points = points.slice(0, -1).concat(new_awajiRl.process2);
    }
    // 新しい配列を作成し、y 座標を差分だけ小さくする
    new_awajiRr.process1 = new_awajiRr.process1.map(point => {
      return { x: point.x, y: point.y - yDiff, z: point.z};
    });
    new_awajiRl.process1 = new_awajiRl.process1.map(point => {
      return { x: point.x, y: point.y - yDiff, z: point.z};
    });
    new_awajiRr.process2 = new_awajiRr.process2.map(point => {
      return { x: point.x, y: point.y - yDiff, z: point.z};
    });
    new_awajiRl.process2 = new_awajiRl.process2.map(point => {
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

function generateRenzokuPoints(n, type, reverseFlag, cut_f, total, end_f) {
  let points = []; // 基準となるポイントをコピー
  partsPoints[type] = [];
  if (cut_f == 1) {
    // f=1の最初の点のインデックスを取得
    /*const index = points.findIndex(point => point.f === 1);
    //console.log(points);
  
    // 配列を分割 (f=1の点は含めない)
    const before = points.slice(0, index); // f=1 より前
    const after = points.slice(index + 2); // f=1 より後
  
    points = [before, after];*/
    //console.log(points);
    points[1] = [];
    for (let i = 1; i <= 4; i++) {
      const processName = `process${i}`; // プロセス名を設定
      if (i === 1) {
        points[0] = partsPoints['renzokuR'].process3; // 1つ目の要素の先頭に追加
        //points[0] = points[0].concat([{ x: 90, y: 90, z: 0 }]);
      } else if (i === 2) {
        points[0] = partsPoints['renzokuR'].process4.concat(points[0]); // 1つ目の要素の先頭に追加
      } else if (i === 3) {
        points[1] = partsPoints['renzokuL'].process3; // 2つ目の要素の最後に追加
        //points[1] = [{ x: -90, y: 90, z: 0 }].concat(points[1]);
      } else if (i === 4) {
        points[1] = points[1].concat(partsPoints['renzokuL'].process4); // 2つ目の要素の最後に追加
      }
      // 現在のポイントを保存
      partsPoints[type][processName] = [points[0], points[1]]; // 現在のポイントを保存
    }
    points = points.map(segment => {
      return segment.map(point => {
        return {
          x: point.x,
          y: point.y - awajiRr_points.process1[0].y - awajiRr_points.process1[6].y - 90,  // y 値の変更
          z: point.z
        };
      });
    });
    
  }else {
    points = [...renzoku_points];
    //partsPoints[type]['process1'] = [[...points]]; // 初期のポイント
    partsPoints[type]['process1'] = [partsPoints['awaji']['process1']];
    partsPoints[type]['process2'] = [partsPoints['awaji']['process2']];
    partsPoints[type]['process3'] = [partsPoints['awaji']['process3']];
  }

  //console.log(end_f, cut_f);
// 特別な処理（points.length === 2 の場合）
if (cut_f == 1) {
  for (let round = 0; round < n / 2; round++) {
    for (let i = 1; i <= 8; i++) {
      const processName = `process${round * 8 + i +4}`; // プロセス名を設定

      if ((round * 8 + i + 3) == total) {
        if (end_f == 1) {
          points[0] = points[0].slice(1);
          partsPoints[type][`process${(n-1)*4+3 + 2}`] = [points[0], points[1]];
          points[1] = points[1].slice(0, -1).concat(endPoints['awaji'].map(point => ({ x: point.x, y: point.y + 60 , z: point.z }))); 
          partsPoints[type][`process${(n-1)*4+3 + 3}`] = [points[0], points[1]];
        }
        return;
      }
      //console.log(points);
      if (i === 1) {
        // process2: renzokuRのプロセス1
        points[0] = partsPoints['renzokuR'].process1.concat(points[0].slice(1)); // 1つ目の要素の先頭に追加
      } else if (i === 2) {
        // process3: renzokuRのプロセス2
        points[0] = partsPoints['renzokuR'].process2.concat(points[0]); // 1つ目の要素の先頭に追加
      } else if (i === 3) {
        // process4: renzokuLのプロセス1
        points[1] = points[1].slice(0, -1).concat(partsPoints['renzokuL'].process1); // 2つ目の要素の最後に追加
      } else if (i === 4) {
        // process5: renzokuLのプロセス2
        points[1] = points[1].concat(partsPoints['renzokuL'].process2); // 2つ目の要素の最後に追加
      } else if (i === 5) {
        points = points.map(segment => {
          return segment.map(point => {
            return {
              x: point.x,
              y: point.y - awajiRr_points.process1[0].y - awajiRr_points.process1[6].y - 90,  // y 値の変更
              z: point.z
            };
          });
        });
        points[0] = partsPoints['renzokuR'].process3.concat(points[0].slice(1)); // 1つ目の要素の先頭に追加
      } else if (i === 6) {
        points[0] = partsPoints['renzokuR'].process4.concat(points[0]); // 1つ目の要素の先頭に追加
      } else if (i === 7) {
        points[1] = points[1].slice(0, -1).concat(partsPoints['renzokuL'].process3); // 2つ目の要素の最後に追加
      } else if (i === 8) {
        points[1] = points[1].concat(partsPoints['renzokuL'].process4); // 2つ目の要素の最後に追加
      }

      // 現在のポイントを保存
      partsPoints[type][processName] = [points[0], points[1]]; // 現在のポイントを保存
      //console.log(round, i, partsPoints[type]);

    }

    // y座標の調整を行う
    points = points.map(segment => {
      return segment.map(point => {
        return {
          x: point.x,
          y: point.y - awajiRr_points.process1[0].y - awajiRr_points.process1[6].y - 90,  // y 値の変更
          z: point.z
        };
      });
    });
  }
} else {
  // 各プロセスを生成
  for (let round = 0; round < n/2; round++) {
    for (let i = 1; i <= 8; i++) {
      const processName = `process${round * 8 + i + 3}`; // プロセス名を設定

      if (i === 1) {
        // process2: renzokuRのプロセス1
        points = points.slice(1); // 最初の要素を削除
        points = partsPoints['renzokuR'].process1.concat(points);
      } else if (i === 2) {
        // process3: renzokuRのプロセス2
        //points = points.slice(4); // 最初の要素を削除
        points = partsPoints['renzokuR'].process2.concat(points); 
      } else if (i === 3) {
        // process4: renzokuLのプロセス1
        points = points.slice(0, -1).concat(partsPoints['renzokuL'].process1); 
      } else if (i === 4) {
        // process5: renzokuLのプロセス2
        points = points.concat(partsPoints['renzokuL'].process2); 
      } else if (i === 5) {
        points = points.map(point => ({ x: point.x, y: point.y - awajiRr_points.process1[0].y - awajiRr_points.process1[6].y - 100, z: point.z })); 
        // process3: renzokuRのプロセス2
        points = points.slice(1); // 最初の要素を削除
        points = partsPoints['renzokuR'].process3.concat(points); 
      } else if (i === 6) {
        // process3: renzokuRのプロセス2
        points = partsPoints['renzokuR'].process4.concat(points); 
      } else if (i === 7) {
        // process4: renzokuLのプロセス1
        points = points.slice(0, -1).concat(partsPoints['renzokuL'].process3); 
      } else if (i === 8) {
        // process5: renzokuLのプロセス2
        points = points.concat(partsPoints['renzokuL'].process4); 
      }
      //console.log(points);
      // 現在のポイントを保存
      partsPoints[type][processName] = [[...points]]; // 現在のポイントを保存
      if ((round * 8 + i + 3) == total) {
        if (end_f == 1) {
          points = partsPoints[type][`process${(n-1)*4+3 + 1}`] = points.slice(1);
          partsPoints[type][`process${(n-1)*4+3 + 1}`] = [[...points]];
          points = points.slice(0, -1).concat(endPoints['awaji'].map(point => ({ x: point.x, y: point.y - 40 , z: point.z }))); 
          partsPoints[type][`process${(n-1)*4+3 + 2}`] = [[...points]];
        }
        return;
      }
    }
    // y座標の調整を行う
    //console.log(round);
    points = points.map(point => ({ x: point.x, y: point.y - awajiRr_points.process1[0].y - awajiRr_points.process1[6].y - 100, z: point.z })); // y座標をずらす例
  }

  // reverseFlag が 1 の場合、最終的な配列を逆順にする
  if (reverseFlag === 1) {
    Object.keys(partsPoints[type]).forEach(processName => {
      partsPoints[type][processName] = partsPoints[type][processName].reverse();
    });
  }
}
//console.log(partsPoints[type]);
}

//function drawCurveFromPoints(p, pts) {
function drawCurveFromPoints(p, curves, shapeNum1, shapeNum2, index) {
  /*
  p.beginShape();
  p.curveVertex(pts[0].x, pts[0].y, pts[0].z);
  for (let pt of pts) {
    p.curveVertex(pt.x, pt.y, pt.z);
  }
  p.curveVertex(pts[pts.length-1].x, pts[pts.length-1].y, pts[pts.length-1].z);
  p.endShape();
  */
  if (Array.isArray(curves[0])) {
    // これないんじゃないのか？全部elseに入る
    // 複数のカーブ（curves は配列の配列）
    curves.forEach((curve) => {
      p.beginShape();
      p.curveVertex(curve[0].x, curve[0].y, curve[0].z || 0);
      curve.forEach((pt) => {
        console.log(pt,shape);
        if (
          (index >= shapeNum1 && pt.shape === "shape1") || 
          (index >= shapeNum2 && pt.shape === "shape2")
        ) {
          return; // 条件を満たす場合は描画をスキップ
        }
      });
      p.curveVertex(curve[curve.length - 1].x, curve[curve.length - 1].y, curve[curve.length - 1].z || 0);
      p.endShape();
    });
  } else {
    // 単一のカーブ（curves は点群の配列）
    let drawing = true; // 描画状態を管理するフラグ
    p.beginShape();
    p.curveVertex(curves[0].x, curves[0].y, curves[0].z || 0);
    for (let i = 0; i < curves.length; i++) {
      const pt = curves[i];
      // 描画をスキップする条件
      // 2つのモデルでインナーカーブの本数が違う場合、必要ないところはスキップして描画しないようにする
      if ((index >= shapeNum1 && pt.shape === "shape1") || (index >= shapeNum2 && pt.shape === "shape2")) {
        if (drawing && i != 0) {
          // 描画中ならシェイプを終了
          p.curveVertex(curves[i - 1].x, curves[i - 1].y, curves[i - 1].z || 0);
          p.endShape();
          drawing = false; // 描画を停止
        }
        continue; // この点をスキップ
      } else {
        if (!drawing) {
          // 描画を再開する場合、新しいシェイプを開始
          p.beginShape();
          drawing = true;
          // 前の点とスムーズに接続したい場合、前回の点を追加
          if (i > 0) {
            const prev = curves[i - 1];
            p.curveVertex(prev.x, prev.y, prev.z || 0);
          }
        }
        // 現在の点を描画
        p.curveVertex(pt.x, pt.y, pt.z || 0);
      }
    }
    if (drawing) {
      p.curveVertex(curves[curves.length - 1].x, curves[curves.length - 1].y, curves[curves.length - 1].z || 0);
      p.endShape(); // 最後のシェイプを閉じる
    }
  }
}

//接続されてないモデル用
function createInnerCurves(p, points, numInnerCurves, outerCurveWeight, innerCurveWeight) {
  let innerCurves = [];
  /*
  let curveWidth = outerCurveWeight;

  if (numInnerCurves == 1) {
    innerCurves.push(createOffsetCurve(p, points, 0));
  } else {
    for (let i = 0; i < numInnerCurves; i++) {
      let offset = p.map(i, 0, numInnerCurves - 1, -curveWidth/2 + innerCurveWeight/2, curveWidth/2 - innerCurveWeight/2);
      innerCurves.push(createOffsetCurve(p, points, offset));
    }
  }
  */

  points.forEach((curve) => {
    let curveSet = []; // 各カーブセットを保持する配列

    // numInnerCurves によってインナーカーブの数を決定
    if (numInnerCurves === 1) {
      // インナーカーブが1本の場合
      curveSet.push(createOffsetCurve(p, curve, 0)); // オフセット無し
    } else {
      // 複数のインナーカーブがある場合
      for (let i = 0; i < numInnerCurves; i++) {
        // インナーカーブごとにオフセットを設定
        let offset = p.map(
          i,
          0,
          numInnerCurves - 1,
          -outerCurveWeight / 2 + innerCurveWeight / 2,
          outerCurveWeight / 2 - innerCurveWeight / 2
        );
        //console.log(curve);
        curveSet.push(createOffsetCurve(p, curve, offset)); // オフセットを使ってカーブを生成
      }
    }

    // 各カーブセットを innerCurves に追加
    innerCurves.push(curveSet);
  });

  //console.log(innerCurves);
  return innerCurves; // [[innerCurves1], [innerCurves2]] の形で返す
}

//接続モデル用
function createInnerCurvesConnect(p, points, numInnerCurves, outerCurveWeight, innerCurveWeight) {
  let innerCurves = [];

  points.forEach((curve) => {// ex)  points=[Array(44), Array(44)]
    let curveSet = []; // 各カーブセットを保持する配列
    //console.log(points, curve);
    // numInnerCurves によってインナーカーブの数を決定
    if (numInnerCurves === 1) {
      // インナーカーブが1本の場合
      let offsetCurve = createOffsetCurve(p, curve, 0); // オフセット無し
      let augmentedCurve = offsetCurve.map((pt, index) => ({
        ...pt,
        shape: curve[index].shape // 各点に shape を追加
      }));
      curveSet.push(augmentedCurve);
    } else {
      // 複数のインナーカーブがある場合
      for (let i = 0; i < numInnerCurves; i++) {
        // インナーカーブごとにオフセットを設定
        let offset = p.map(
          i,
          0,
          numInnerCurves - 1,
          -outerCurveWeight / 2 + innerCurveWeight / 2,
          outerCurveWeight / 2 - innerCurveWeight / 2
        );
        //console.log(curvePoints);
        let offsetCurve = createOffsetCurve(p, curve, offset);
        let augmentedCurve = offsetCurve.map((pt, index) => ({
          ...pt,
          shape: curve[index].shape // 各点に shape を追加
        }));
        curveSet.push(augmentedCurve);
      }
    }
    // 各カーブセットを innerCurves に追加
    innerCurves.push(curveSet);
  });

  return innerCurves;
}

//指定されたオフセットに基づいて元の曲線を変形
function createOffsetCurve(p, originalCurve, offset) {
  //console.log(originalCurve);
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
  if (type === 'kame') {
    cmSize = shapeWidth / 50;
  } else if (type === 'kame2') {
    cmSize = shapeWidth / 50;
  }
  // デフォルトのパラメータ
  let defaultParams = {
    numInnerCurves: 4,
    outerCurveWeight: 30,
    innerCurveWeight: 6.5
  };

  // モデルの種類ごとにパラメータを定義
  let params = {
    ume: {//実寸大のcm：{インナーカーブの本数、外側の太さ、水引の太さ、必要素材}
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
    renzoku: {//連続あわじが何段かの数
      2: {//横１cm、縦1.5cm（1-1.5）
        '1-1.5': { numInnerCurves: 1, outerCurveWeight: 8, innerCurveWeight: 5, materialCm: 23 },
        '1.5-2': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 23 },
        '2-3': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5, materialCm: 30 },
        '2.5-3.5': { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 45 },
        '3-4.5': { numInnerCurves: 5, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 60 },
      },
      3: {
        '1-2': { numInnerCurves: 1, outerCurveWeight: 8, innerCurveWeight: 5, materialCm: 23 },
        '1.5-3.3': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 45 },
        '2-4': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5, materialCm: 45 },
        '2.5-5.5': { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 60 },
        '3-5.6': { numInnerCurves: 5, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 60 },
      },
      4: {
        '1-2.8': { numInnerCurves: 1, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 30 },
        '1.5-4': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 45 },
        '2-5.5': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5, materialCm: 67 },
        '2.5-7.3': { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 67 },
        '3.0-9.5': { numInnerCurves: 5, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 90 },
      },
      5: {
        '1-3.5': { numInnerCurves: 1, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 45 },
        '1.5-5': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 67 },
        '2-6.5': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5, materialCm: 67 },
        '2.5-8.5': { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5, materialCm: 90 },
      },
      6: {
        '1-4.2': { numInnerCurves: 1, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 67 },
        '1.5-6.2': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 67 },
        '2-7.5': { numInnerCurves: 3, outerCurveWeight: 22, innerCurveWeight: 5, materialCm: 90 },
      },
      7: {
        '1-5': { numInnerCurves: 1, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 90 },
        '1.5-7': { numInnerCurves: 2, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 90 },
      },
      8: {
        '1-5.8': { numInnerCurves: 1, outerCurveWeight: 16, innerCurveWeight: 5, materialCm: 90 },
      },
    },
    aioien: {
      2.0: { numInnerCurves: 1, outerCurveWeight: 15, innerCurveWeight: 5 , materialCm: 23},
      3.0: { numInnerCurves: 2, outerCurveWeight: 18, innerCurveWeight: 5 , materialCm: 30 },
      3.4: { numInnerCurves: 3, outerCurveWeight: 29, innerCurveWeight: 5 , materialCm: 30 }
    },
    kame: {
      1.5: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 , materialCm: 23},
      2.3: { numInnerCurves: 2, outerCurveWeight: 15, innerCurveWeight: 5 , materialCm: 30 },
      3.0: { numInnerCurves: 3, outerCurveWeight: 20, innerCurveWeight: 5 , materialCm: 45 },
      3.8: { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 45},
      4.3: { numInnerCurves: 5, outerCurveWeight: 30, innerCurveWeight: 5 , materialCm: 67 },
      5.0: { numInnerCurves: 6, outerCurveWeight: 35, innerCurveWeight: 5 , materialCm: 67 },
    },
    kame2: {
      1.5: { numInnerCurves: 1, outerCurveWeight: 10, innerCurveWeight: 5 , materialCm: 30},
      2.3: { numInnerCurves: 2, outerCurveWeight: 15, innerCurveWeight: 5 , materialCm: 45 },
      3.0: { numInnerCurves: 3, outerCurveWeight: 20, innerCurveWeight: 5 , materialCm: 60 },
      3.8: { numInnerCurves: 4, outerCurveWeight: 25, innerCurveWeight: 5 , materialCm: 60},
      4.3: { numInnerCurves: 5, outerCurveWeight: 30, innerCurveWeight: 5 , materialCm: 67 },
      5.0: { numInnerCurves: 6, outerCurveWeight: 35, innerCurveWeight: 5 , materialCm: 90 },
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

  let renzokuNum;
  let closestParams, closestSize;
  if (type === 'renzoku') {
    let sizeDifference = Math.abs(shapeWidth - shapeLength);
    if (shapeWidth <= 50) {
      renzokuNum = Math.max(2, Math.min(8, Math.floor(sizeDifference / 20)));
      shape.renzokuNum = renzokuNum;
      closestParams = Object.values(params.renzoku[renzokuNum])[0];
      shape.scale = 0.3;
    }
  }
  if(type === 'renzoku') {
    let sizeDifference = Math.abs(shapeWidth - shapeLength);
    if (shapeWidth > 50) {
      if (sizeDifference >= 330) {
        renzokuNum = 8;
      } else if (sizeDifference >= 310) {
        renzokuNum = 7;
      } else if (sizeDifference >= 280) {
        renzokuNum = 6;
      } else if (sizeDifference >= 230) {
        renzokuNum = 5;
      } else if (sizeDifference >= 180) {
        renzokuNum = 4;
      } else if (sizeDifference >= 130) {
        renzokuNum = 3;
      } else {
        renzokuNum = 2;
      }
      shape.renzokuNum = renzokuNum;
      // 使用可能なサイズキーを取得して、幅と高さに分解し、数値に変換
      let availableKeys = Object.keys(params.renzoku[renzokuNum]);
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
        //console.log(widthDifference, lengthDifference, totalDifference);
      
        // 最も小さい誤差のキーを探す
        if (totalDifference < minDifference) {
          minDifference = totalDifference;
          closestKey = currentKey;
        }
        closestParams = params.renzoku[renzokuNum][closestKey];
      }
    }
  } else {
    if (cmSize) {
      console.log(cmSize);
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
      console.log(closestSize);
      //console.log(closestParams);
    }
  }

  shape.numInnerCurves = closestParams.numInnerCurves;
  //shape.outerCurveWeight = closestParams.outerCurveWeight;
  shape.innerCurveWeight = closestParams.innerCurveWeight;
  if(type === 'aioien'){
    shape.outerCurveWeight = cmSize * 4.8;  // shapeSize に基づいてスケール
    // ↑図形によって難しいようなら各パラメータのouterCurveWeightの場所に調整値を入れる
  } else if(type === 'kame'){
    shape.outerCurveWeight = closestParams.outerCurveWeight;  // shapeSize に基づいてスケール
  } else if(type === 'kame2'){
    shape.outerCurveWeight = closestParams.outerCurveWeight;  // shapeSize に基づいてスケール
  } else if(cmSize){
    shape.outerCurveWeight = cmSize * 8;  // shapeSize に基づいてスケール
    // ↑図形によって難しいようなら各パラメータのouterCurveWeightの場所に調整値を入れる
  } else if (type === 'renzoku') {
    let difference = (1/(renzokuNum*1.2)-shape.numInnerCurves*4 +8) * 0.2;
    let calculatedValue = (shape.numInnerCurves*9+difference)*0.75;
    //console.log(difference, calculatedValue);
    shape.outerCurveWeight = calculatedValue; 
  } else {
    shape.outerCurveWeight = (cmWidth + cmLength) / 2 * 6; 
  }
  if (type === 'renzoku') {
    shape.materialCm = closestParams.materialCm;
  } else {
    shape.materialCm = closestParams.materialCm;
  }
  //console.log(shape.outerCurveWeight);
}

function getMaterialColor (){
  let material = []
  let j = 0;
  const renderedGroups = new Set(); // 描画済みの図形IDを記録
  layers.forEach((layer, layerIndex) => {
    layer.shapes.forEach((shape, shapeIndex) => {
      let connected = false;
  
      // connectors 内の isConnected フラグを確認
      if (shape.connectors) {
        for (let connectorSet of shape.connectors) {
          if (connectorSet.isConnected !== null) {
            connected = true;
            break;
          }
        }
      }
      if (connected) {
        // 接続されている場合、接続グループを描画
        shape.connectors.forEach((connectorSet) => {
          if (connectorSet.isConnected?.shape) {
            const shape2 = connectorSet.isConnected.shape;

            // 接続ペアを一意に識別するためのキーを生成
            const connectionKey = `${Math.min(shape.id, shape2.id)}-${Math.max(shape.id, shape2.id)}`;

            if (!renderedGroups.has(connectionKey)) {
              // shape と shape2 の曲線本数と cm を取得
              const numCurves1 = shape.numInnerCurves;
              const numCurves2 = shape2.numInnerCurves;
              const maxCurves = Math.max(numCurves1, numCurves2);
              const cm1 = shape.materialCm;
              const cm2 = shape2.materialCm;
        
              // 合計本数に基づく cm の分配を計算
              for (let i = 0; i < maxCurves; i++) {
                let color;
        
                if (innerCurvesData[layerIndex] && innerCurvesData[layerIndex][shapeIndex] && innerCurvesData[layerIndex][shapeIndex][i]) {
                  color = innerCurvesData[layerIndex][shapeIndex][i].color;
                } else {
                  color = shape.color;
                }
        
                let cm;
                if (i < Math.min(numCurves1, numCurves2)) {
                  cm = cm1 + cm2; // 両方の本数が対応する部分は合計 cm
                } else if (numCurves1 > numCurves2) {
                  cm = cm1;
                } else {
                  cm = cm2;
                }
        
                // material 情報を追加
                material[j] = {
                  color: color, // color情報
                  cm: cm 
                };
                j++;
              }
              // 接続ペアを記録
              renderedGroups.add(connectionKey);  
            }
          }
        });

        //4分の１と3分の１の長さになるように無理矢理変換
        material.forEach(item => {
          if (item.cm === 53) {
            item.cm = 60;
          } else if (item.cm === 68) {
            item.cm = 67;
          } else if (item.cm === 75 || item.cm === 83) {
            item.cm = 90;
          }
        });
      } else {
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

  // 「買い物リスト」の見出しを作成
  const shoppingListHeading = document.createElement('h1');
  shoppingListHeading.textContent = '買い物リスト';
  shoppingListHeading.style.marginTop = '10em';
  shoppingListHeading.style.fontSize = '24px';
  materialsList.appendChild(shoppingListHeading);

  // 買い物リストの内容を表示
  const shoppingList = document.createElement('ul');
  shoppingList.style.marginTop = '10px';

  // 買い物リストの内容を90cm単位で計算
  const shoppingMaterials = {};

  for (let color in material) {
    for (let cm in material[color]) {
      const num = material[color][cm].num;
      const needed90cm = Math.ceil((cm * num) / 90); // 必要な90cm本数を計算

      if (!shoppingMaterials[color]) {
        shoppingMaterials[color] = 0;
      }
      shoppingMaterials[color] += needed90cm;
    }
  }

  for (let color in shoppingMaterials) {
    const needed90cm = shoppingMaterials[color];

    // <li> 要素を作成
    const shoppingListItem = document.createElement('li');
    const colorBox = document.createElement('span');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = color;
    const textSpan = document.createElement('span');
    textSpan.textContent = `90cm, ${needed90cm}本`;

    // <ul> に <li> を追加
    shoppingListItem.appendChild(colorBox);
    shoppingListItem.appendChild(textSpan);
    shoppingList.appendChild(shoppingListItem);
  }


  // 見出しの下に買い物リストを追加
  materialsList.appendChild(shoppingList);

}

/*function drawConnect (p, shape1, layerIndex, index, adjustedPoints){
  // 接続先の図形を取得
  let shape2;
  shape1.connectors.forEach((connectorSet) => {
    if (connectorSet.isConnected !== null) {
      shape2 = connectorSet.isConnected.shape;  // 接続先の図形を取得
    }
  });
  console.log(shape2);

    // shape1 をディープコピー
    const newShape = deepCopyWithoutConnection(shape1);

    // 新しい形状のプロパティを上書き
    newShape.type = 'connect';
    newShape.x = (shape1.x + shape2.x) / 2;
    newShape.y = (shape1.y + shape2.y) / 2;
    newShape.rotation = 0; // 必要に応じて回転を設定
    newShape.connectors = []; // 接続情報をリセット

    // 初期化
    let points1 = [];
    let points2 = [];
    let combinedPoints = [];
    let scaleValue = shape1.scale;

    // shape1 の制御点を取得
    if (shape1.type === 'awaji') {
        points1 = awaji_points;
    } else if (shape1.type === 'ume') {
        points1 = ume_points;
    } else if (shape1.type === 'renzoku') {
        const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55];
        scaleValue = shape1.scale * scaleFactors[shape1.renzokuNum];
        points1 = renzokuAwaji(shape1.renzokuNum);
    } else if (shape1.type === 'aioien') {
        scaleValue = shape1.scale * 1.3;
        points1 = aioien_points;
    }

    // shape2 の制御点を取得
    if (shape2.type === 'awaji') {
        points2 = awaji_points;
    } else if (shape2.type === 'ume') {
        points2 = ume_points;
    } else if (shape2.type === 'renzoku') {
        const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55];
        scaleValue = shape2.scale * scaleFactors[shape2.renzokuNum];
        points2 = renzokuAwaji(shape2.renzokuNum);
    } else if (shape2.type === 'aioien') {
        scaleValue = shape2.scale * 1.3;
        points2 = aioien_points;
    }

    //サイズ調整
    points1 = points1.map(p => ({
      x: p.x * shape1.scale * 1.62, 
      y: p.y * shape1.scale * 1.62, 
      z: p.z * shape1.scale * 1.62
    }));
    points2 = points2.map(p => ({
      x: p.x * shape2.scale * 1.62, 
      y: p.y * shape2.scale * 1.62, 
      z: p.z * shape2.scale * 1.62
    }));

    // 回転を考慮して、shape1 の回転角を各制御点に適用
    const rotateShape1 = (points) => {
      return points.map(point => {
        // 形状の回転を適用
        const angle = p.radians(shape1.rotation);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const xNew = cosAngle * point.x - sinAngle * point.y;
        const yNew = sinAngle * point.x + cosAngle * point.y;
        return { x: xNew, y: yNew, z: point.z }; // z軸の値はそのまま
      });
    };

    // shape2 の制御点を shape1 基準に調整
    const adjustedPoints2 = points2.map(point => ({
      x: point.x + (shape2.x - shape1.x),
      y: point.y + (shape2.y - shape1.y),
      z: point.z // z座標はそのまま保持
    }));
    console.log(shape1.x);

    // shape2 の回転も考慮
    const rotateShape2 = (points) => {
      return points.map(point => {
        // shape2 の回転角を適用
        const angle = p.radians(shape2.rotation);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const xNew = cosAngle * point.x - sinAngle * point.y;
        const yNew = sinAngle * point.x + cosAngle * point.y;
        return { x: xNew, y: yNew, z: point.z }; // z軸の値はそのまま
      });
    };

    // 回転後の制御点を取得
    const rotatedPoints1 = rotateShape1(points1);
    const rotatedPoints2 = rotateShape2(adjustedPoints2);

    // 制御点を結合
    combinedPoints = [[...rotatedPoints1, ...rotatedPoints2]];
    newShape.points = combinedPoints;

    // 新しい図形の作成
    

    // 新しい図形をレイヤーに追加
    //layers[layerIndex].shapes.push(newShape);
  console.log(newShape);
  drawShape(p, newShape, layerIndex, index, 0, -1, combinedPoints);
}*/

//切断を踏まえて図形同士の接続関数
function drawConnect (p, shape1, layerIndex, index, adjustedPoints1, parts_f, processNo){
  // 接続先の図形を取得
  let shape2, shape1ConnectSet, shape2ConnectSet;
  shape1.connectors.forEach((connectorSet, index) => {
    if (connectorSet.isConnected !== null) {
      shape2 = connectorSet.isConnected.shape;  // 接続先の図形を取得
      shape1ConnectSet = index;
    }
  });
  shape2.connectors.forEach((connectorSet, index) => {
    if (connectorSet.isConnected !== null && connectorSet.isConnected.shape === shape1) {
      shape2ConnectSet = index; // shape2 の接続セットインデックスを取得
    }
  });
  //let adjustedPoints2 = adjustControlPoints(shape);

  // shape1が結合点を向いていて反対側が接続している場合、adjustControlPointsで中央を擬似接続にする
  //ここを擬似接続にしないとループになるので
  if (shape1ConnectSet == 0 && !shape1.flags.middle) {
    //shape1.flags.middle = shape1.flags.end;
    shape1.flags.end = true;
    adjustedPoints1 = adjustControlPoints(shape1);
    //console.log(adjustedPoints1);
    if (adjustedPoints1.length == 1) {
      const array = adjustedPoints1[0];
      // 配列の中央インデックスを計算
      const midIndex = Math.ceil(adjustedPoints1[0].length / 2);
      // 前半と後半に分割
      const array1 = array.slice(0, midIndex+2);
      const array2 = array.slice(midIndex+1);

      // 新しい構造に変換して返す
      adjustedPoints1 =  [[...array1], [...array2]];
    }
    //console.log(adjustedPoints1);
    //console.log('ok');
  }
  //console.log(shape1.flags.end, shape1.flags.middle, shape2.flags.end, shape2.flags.middle);

  if (selectedcustomizeShape) {
    let endCuttingButton = document.getElementById("end-cutting-button");
    let middleCuttingButton = document.getElementById("middle-cutting-button");
    if (selectedcustomizeShape === shape1) { 
      if (shape1ConnectSet == 0) {
        endCuttingButton.disabled = true; // ボタン無効化
        middleCuttingButton.disabled = false; // ボタン有効化
      } else {
        endCuttingButton.disabled = false; // ボタン有効化
        middleCuttingButton.disabled = true; // ボタン無効化
      }
    } else if (selectedcustomizeShape === shape2) {
      if (shape2ConnectSet == 0) {
        endCuttingButton.disabled = true; // ボタン無効化
        middleCuttingButton.disabled = false; // ボタン有効化
      } else {
        endCuttingButton.disabled = false; // ボタン有効化
        middleCuttingButton.disabled = true; // ボタン無効化
      } 
    }
  }
  // shape1 をディープコピー
  const newShape = deepCopyWithoutConnection(shape1);

  // 新しい形状のプロパティを上書き
  newShape.type = 'connect';
  newShape.x = shape1.x;
  newShape.y = shape1.y;
  newShape.rotation = 0; // 必要に応じて回転を設定
  newShape.connectors = []; // 接続情報をリセット

  // 初期化
  let points1 = adjustedPoints1;
  let points2 = adjustControlPoints(shape2);
  let combinedPoints = [];
  //let scaleValue = shape1.scale;

  // shape1 の制御点を取得
  /*
  if (shape1.type === 'awaji') {
      points1 = awaji_points;
  } else if (shape1.type === 'ume') {
      points1 = ume_points;
  } else if (shape1.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55];
      scaleValue = shape1.scale * scaleFactors[shape1.renzokuNum];
      points1 = renzokuAwaji(shape1.renzokuNum);
  } else if (shape1.type === 'aioien') {
      scaleValue = shape1.scale * 1.3;
      points1 = aioien_points;
  }

  // shape2 の制御点を取得
  if (shape2.type === 'awaji') {
      points2 = awaji_points;
  } else if (shape2.type === 'ume') {
      points2 = ume_points;
  } else if (shape2.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55];
      scaleValue = shape2.scale * scaleFactors[shape2.renzokuNum];
      points2 = renzokuAwaji(shape2.renzokuNum);
  } else if (shape2.type === 'aioien') {
      scaleValue = shape2.scale * 1.3;
      points2 = aioien_points;
  }
*/

//console.log(shape1.flags.middle, points1, points2);
  // サイズ調整関数（多次元配列対応）
  const scalePoints = (points, shape) => {
    // scaleValue を shape に基づいて計算
    let scaleValue;
    if (shape.type === 'awaji') {
      scaleValue = shape.scale * 1.62; // awaji の場合
    } else if (shape.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55]; // インデックス0は使用しない
      scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
    } else if (shape.type === 'kame') {
      scaleValue = shape.scale  * 1.2;
    } else if (shape.type === 'kame2') {
      scaleValue = shape.scale  * 1.4;
    } else {
      scaleValue = shape.scale * 1.62; // デフォルト値
    }

    return points.map(segment => 
      segment.map(point => ({
        x: point.x * scaleValue,
        y: point.y * scaleValue,
        z: point.z * scaleValue,
      }))
    );
  };

  // 回転を考慮
  const rotatePoints = (points, angle) => {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return points.map(segment =>
      segment.map(point => ({
        x: cosAngle * point.x - sinAngle * point.y,
        y: sinAngle * point.x + cosAngle * point.y,
        z: point.z, // z軸の値はそのまま
      }))
    );
  };

  // スケール適用
  points1 = scalePoints(points1, shape1);
  points2 = scalePoints(points2, shape2);

  // 回転適用
  const angle1 = p.radians(shape1.rotation);
  const angle2 = p.radians(shape2.rotation);
  points1 = rotatePoints(points1, angle1);
  points2 = rotatePoints(points2, angle2);

  // shape2 の制御点を shape1 基準に調整
  points2 = points2.map(segment =>
    segment.map(point => ({
      x: point.x + (shape2.x - shape1.x),
      y: point.y + (shape2.y - shape1.y),
      z: point.z // z座標はそのまま保持
    }))
  );

//console.log(shape1.flags.middle, points1, points2);
  // 制御点を結合
  //console.log(shape1.flags.middle, points1[1]);
  if (shape1ConnectSet == 0 && shape2ConnectSet == 0) {
    if (points2[1]) {
      // points2[1] が存在する場合
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1" // points1[1] のポイントに対応する shape
            })) : []),  // points1[1]の最後から一つ前の要素まで
        ...(Array.isArray(points1[1]) ? [{
              x: (points1[1][points1[1].length - 1].x + points2[0][0].x) / 2,
              y: (points1[1][points1[1].length - 1].y + points2[0][0].y) / 2,
              z: (points1[1][points1[1].length - 1].z + points2[0][0].z) / 2,
              shape: "shapeM" // 中間点に対応する shape
            }] : []),  // 中間点を追加
        ...points2[0].slice(1).map(point => ({
              ...point,
              shape: "shape2" // points2[0] のポイントに対応する shape
            }))  // points2[0]の最初から2番目から最後まで
      ], [
        ...(Array.isArray(points2[1]) ? points2[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape2" // points2[1] のポイントに対応する shape
            })) : []),  // points2[1]の最後から一つ前の要素まで
        ...(Array.isArray(points2[1]) ? [{
              x: (points2[1][points2[1].length - 1].x + points1[0][0].x) / 2,
              y: (points2[1][points2[1].length - 1].y + points1[0][0].y) / 2,
              z: (points2[1][points2[1].length - 1].z + points1[0][0].z) / 2,
              shape: "shapeM" // 中間点に対応する shape
            }] : []),  // 中間点を追加
        ...points1[0].slice(1).map(point => ({
              ...point,
              shape: "shape1" // points1[0] のポイントに対応する shape
            }))  // points1[0]の展開
      ]];      
    } else {
      // points2[1] が存在しない場合
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1) : []),  // points1[1]の最後から一つ前の要素まで
        ...(Array.isArray(points1[1]) ? [{
              x: (points1[1][points1[1].length - 1].x + points2[0][0].x) / 2,
              y: (points1[1][points1[1].length - 1].y + points2[0][0].y) / 2,
              z: (points1[1][points1[1].length - 1].z + points2[0][0].z) / 2
            }]
          : []),  // 中間点を追加
        ...points2[0].slice(1, -1), // points2[0]の最初から2番目から最後まで
        {
          x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2
        },  // 中間点を追加
        ...points1[0].slice(1) // points1[1]の展開
      ]];
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1" // points1[1] のポイントに対応する shape
            })) : []),  // points1[1]の最後から一つ前の要素まで
        ...(Array.isArray(points1[1]) ? [{
              x: (points1[1][points1[1].length - 1].x + points2[0][0].x) / 2,
              y: (points1[1][points1[1].length - 1].y + points2[0][0].y) / 2,
              z: (points1[1][points1[1].length - 1].z + points2[0][0].z) / 2,
              shape: "shapeM" // 中間点に対応する shape
            }] : []),  // 中間点を追加
        ...points2[0].slice(1, -1).map(point => ({
              ...point,
              shape: "shape2" // points2[0] のポイントに対応する shape
            })),  // points2[0]の最初から2番目から最後まで
        ...(Array.isArray(points2[0]) ? [{
              x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
              y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
              z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2,
              shape: "shapeM" // 中間点に対応する shape
            }] : []),  // 中間点を追加
        ...points1[0].slice(1).map(point => ({
              ...point,
              shape: "shape1" // points1[0] のポイントに対応する shape
            }))  // points1[0]の展開
      ]];

    }
  } else if (shape1ConnectSet == 0 && shape2ConnectSet == 1) {
    if (shape2.flags.end) {
      // points2の端が切れている
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1) : []),  // points1[0]の展開
        ...(Array.isArray(points1[1]) ? [{
          x: (points1[1][points1[1].length - 1].x + points2[1][0].x) / 2,
          y: (points1[1][points1[1].length - 1].y + points2[1][0].y) / 2,
          z: (points1[1][points1[1].length - 1].z + points2[1][0].z) / 2
        }] : []),  // 中間点を追加
        ...points2[1].slice(1)
      ],[
        ...points2[0].slice(0, -1),  // points2[1]が存在するので展開
        {
          x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2
        },  // 中間点を追加
        ...points1[0].slice(1)   // points1[1]の展開
      ]];
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1" // points1[1] のポイントに対応する shape
            })) : []),  // points1[1]の最後から一つ前の要素まで
        ...(Array.isArray(points1[1]) ? [{
          x: (points1[1][points1[1].length - 1].x + points2[1][0].x) / 2,
          y: (points1[1][points1[1].length - 1].y + points2[1][0].y) / 2,
          z: (points1[1][points1[1].length - 1].z + points2[1][0].z) / 2,
          shape: "shapeM" // 中間点に対応する shape
        }] : []),  // 中間点を追加
        ...points2[1].slice(1).map(point => ({
              ...point,
              shape: "shape2" // points2[1] のポイントに対応する shape
            }))  // points2[1]の最初から2番目から最後まで
      ], [
        ...points2[0].slice(0, -1).map(point => ({
              ...point,
              shape: "shape2" // points2[0] のポイントに対応する shape
            })),  // points2[0] の最後から一つ前の要素まで
        {
          x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2,
          shape: "shapeM" // 中間点に対応する shape
        },  // 中間点を追加
        ...points1[0].slice(1).map(point => ({
              ...point,
              shape: "shape1" // points1[0] のポイントに対応する shape
            }))  // points1[0]の最初から2番目以降を展開
      ]];

    } else {
      // points2の端がつながっている（擬似）
      combinedPoints = [[
        ...(Array.isArray(points1[1]) ? points1[1].slice(0, -1) : []),  // points1[0]の展開
        ...(Array.isArray(points1[1]) ? [{
          x: (points1[1][points1[1].length - 1].x + points2[1][0].x) / 2,
          y: (points1[1][points1[1].length - 1].y + points2[1][0].y) / 2,
          z: (points1[1][points1[1].length - 1].z + points2[1][0].z) / 2
        }] : []),  // 中間点を追加
        ...points2[1].slice(1),
        ...points2[0].slice(0, -1),  // points2[1]が存在するので展開
        {
          x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2
        },  // 中間点を追加
        ...points1[0].slice(1)   // points1[1]の展開
      ]];
      combinedPoints = [[
        ...(Array.isArray(points1[1]) 
          ? points1[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1", // points1[1] のポイントに対応する shape
            }))
          : []),  // points1[1] の最後から一つ前まで
        ...(Array.isArray(points1[1]) 
          ? [{
              x: (points1[1][points1[1].length - 1].x + points2[1][0].x) / 2,
              y: (points1[1][points1[1].length - 1].y + points2[1][0].y) / 2,
              z: (points1[1][points1[1].length - 1].z + points2[1][0].z) / 2,
              shape: "shapeM", // 中間点に対応する shape
            }]
          : []),  // 中間点を追加
        ...points2[1].slice(1).map(point => ({
          ...point,
          shape: "shape2", // points2[1] のポイントに対応する shape
        })),  // points2[1] の最初から2番目以降
        ...points2[0].slice(0, -1).map(point => ({
          ...point,
          shape: "shape2", // points2[0] のポイントに対応する shape
        })),  // points2[0] の最後から一つ前まで
        {
          x: (points2[0][points2[0].length - 1].x + points1[0][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[0][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[0][0].z) / 2,
          shape: "shapeM", // 中間点に対応する shape
        },  // 中間点を追加
        ...points1[0].slice(1).map(point => ({
          ...point,
          shape: "shape1", // points1[0] のポイントに対応する shape
        })),  // points1[0] の最初から2番目以降
      ]];
      
    }
  } else if (shape1ConnectSet == 1 && shape2ConnectSet == 0) {
    if (points2[1]) {
      // points2[1] が存在する場合
      combinedPoints = [[
        ...points1[0].slice(0, -1),  // points1[0]の展開
        {
          x: (points1[0][points1[0].length - 1].x + points2[0][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[0][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[0][0].z) / 2
        },  // 中間点を追加
        ...points2[0].slice(1)
      ], [
        ...points2[1].slice(0, -1),  // points2[1]が存在するので展開
        ...(Array.isArray(points2[1]) ? [{
              x: (points2[1][points2[1].length - 1].x + points1[1][0].x) / 2,
              y: (points2[1][points2[1].length - 1].y + points1[1][0].y) / 2,
              z: (points2[1][points2[1].length - 1].z + points1[1][0].z) / 2
            }]
          : []),  // 中間点を追加
        ...points1[1].slice(1)   // points1[1]の展開
      ]];
      combinedPoints = [[
        ...points1[0].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1" // points1[0] のポイントに対応する shape
            })),  // points1[0]の最後から一つ前の要素まで
        {
          x: (points1[0][points1[0].length - 1].x + points2[0][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[0][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[0][0].z) / 2,
          shape: "shapeM" // 中間点に対応する shape
        },  // 中間点を追加
        ...points2[0].slice(1).map(point => ({
              ...point,
              shape: "shape2" // points2[0] のポイントに対応する shape
            }))  // points2[0]の最初から2番目以降
      ], [
        ...points2[1].slice(0, -1).map(point => ({
              ...point,
              shape: "shape2" // points2[1] のポイントに対応する shape
            })),  // points2[1]の最後から一つ前の要素まで
        ...(Array.isArray(points2[1]) ? [{
              x: (points2[1][points2[1].length - 1].x + points1[1][0].x) / 2,
              y: (points2[1][points2[1].length - 1].y + points1[1][0].y) / 2,
              z: (points2[1][points2[1].length - 1].z + points1[1][0].z) / 2,
              shape: "shapeM" // 中間点に対応する shape
            }] : []),  // 中間点を追加
        ...points1[1].slice(1).map(point => ({
              ...point,
              shape: "shape1" // points1[1] のポイントに対応する shape
            }))  // points1[1]の最初から2番目以降
      ]];
    } else {
      // points2[1] が存在しない場合
      combinedPoints = [[
        ...points1[0].slice(0, -1),  // points1[0]の展開
        {
          x: (points1[0][points1[0].length - 1].x + points2[0][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[0][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[0][0].z) / 2
        },  // 中間点を追加
        ...points2[0].slice(1, -1),  // points2[0]の展開
        ...(Array.isArray(points1[1]) ? [{
              x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
              y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
              z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2
            }]
          : []),  // 中間点を追加
        ...(Array.isArray(points1[1]) ? points1[1].slice(1) : [])   // points1[1]の展開
      ]];
      combinedPoints = [[
        ...points1[0].slice(0, -1).map(point => ({
          ...point,
          shape: "shape1", // points1[0] のポイントに対応する shape
        })),  // points1[0]の最後から一つ前まで
        {
          x: (points1[0][points1[0].length - 1].x + points2[0][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[0][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[0][0].z) / 2,
          shape: "shapeM", // 中間点に対応する shape
        },  // 中間点を追加
        ...points2[0].slice(1, -1).map(point => ({
          ...point,
          shape: "shape2", // points2[0] のポイントに対応する shape
        })),  // points2[0] の最初から2番目から最後の一つ前まで
        ...(Array.isArray(points1[1]) 
          ? [{
              x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
              y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
              z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2,
              shape: "shapeM", // 中間点に対応する shape
            }]
          : []),  // 中間点を追加
        ...(Array.isArray(points1[1]) 
          ? points1[1].slice(1).map(point => ({
              ...point,
              shape: "shape1", // points1[1] のポイントに対応する shape
            }))
          : []),  // points1[1] の最初から2番目以降
      ]];
    }
  } else if (shape1ConnectSet == 1 && shape2ConnectSet == 1) {
    if (shape2.flags.end) {
      combinedPoints = [[
        ...points1[0].slice(0, -1),
        {
          x: (points1[0][points1[0].length - 1].x + points2[1][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[1][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[1][0].z) / 2
        },  // 中間点を追加
        ...points2[1].slice(1)
      ],[
        ...points2[0].slice(0, -1),
        {
          x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2
        },  // 中間点を追加
        ...points1[1].slice(1)
      ]];
      combinedPoints = [[
        ...points1[0].slice(0, -1).map(point => ({
              ...point,
              shape: "shape1" // points1[0] のポイントに対応する shape
            })),  // points1[0] の最後から一つ前まで
        {
          x: (points1[0][points1[0].length - 1].x + points2[1][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[1][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[1][0].z) / 2,
          shape: "shapeM" // 中間点に対応する shape
        },  // 中間点を追加
        ...points2[1].slice(1).map(point => ({
              ...point,
              shape: "shape2" // points2[1] のポイントに対応する shape
            }))  // points2[1] の最初から2番目以降
      ], [
        ...points2[0].slice(0, -1).map(point => ({
              ...point,
              shape: "shape2" // points2[0] のポイントに対応する shape
            })),  // points2[0] の最後から一つ前まで
        {
          x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2,
          shape: "shapeM" // 中間点に対応する shape
        },  // 中間点を追加
        ...points1[1].slice(1).map(point => ({
              ...point,
              shape: "shape1" // points1[1] のポイントに対応する shape
            }))  // points1[1] の最初から2番目以降
      ]];

    } else {
      combinedPoints = [[
        ...points1[0].slice(0, -1),
        {
          x: (points1[0][points1[0].length - 1].x + points2[1][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[1][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[1][0].z) / 2
        },  // 中間点を追加
        ...points2[1].slice(1),
        ...points2[0].slice(0, -1),
        {
          x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2
        },  // 中間点を追加
        ...points1[1].slice(1)
      ]];
      combinedPoints = [[
        ...points1[0].slice(0, -1).map(point => ({
          ...point,
          shape: "shape1", // points1[0] のポイントに対応する shape
        })),
        {
          x: (points1[0][points1[0].length - 1].x + points2[1][0].x) / 2,
          y: (points1[0][points1[0].length - 1].y + points2[1][0].y) / 2,
          z: (points1[0][points1[0].length - 1].z + points2[1][0].z) / 2,
          shape: "shapeM", // 中間点に対応する shape
        },
        ...points2[1].slice(1).map(point => ({
          ...point,
          shape: "shape2", // points2[1] のポイントに対応する shape
        })),
        ...points2[0].slice(0, -1).map(point => ({
          ...point,
          shape: "shape2", // points2[0] のポイントに対応する shape
        })),
        {
          x: (points2[0][points2[0].length - 1].x + points1[1][0].x) / 2,
          y: (points2[0][points2[0].length - 1].y + points1[1][0].y) / 2,
          z: (points2[0][points2[0].length - 1].z + points1[1][0].z) / 2,
          shape: "shapeM", // 中間点に対応する shape
        },
        ...points1[1].slice(1).map(point => ({
          ...point,
          shape: "shape1", // points1[1] のポイントに対応する shape
        }))
      ]];
    }
    
  }
  newShape.points = combinedPoints;
  newShape.shape = [shape1, shape2];

  // 新しい図形をレイヤーに追加
  //layers[layerIndex].shapes.push(newShape);
  //console.log(newShape.points);
  drawShape(p, newShape, layerIndex, index, parts_f, processNo, combinedPoints);
}
// 通常のディープコピーだとisConnectedで無限ループに陥るためこれをスキップ
function deepCopyWithoutConnection(obj) {
  const copy = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
      if (key === 'isConnected') continue; // isConnected をスキップ
      const value = obj[key];
      copy[key] = typeof value === 'object' && value !== null ? deepCopyWithoutConnection(value) : value;
  }
  return copy;
}

// フラグに基づいて制御点を調整する関数(shapeを入力することで切断処理後のポイントを返す関数)
function adjustControlPoints(shape) {
  
  if (shape.type === 'awaji') {
    points = awaji_points;
  } else if (shape.type === 'ume') {
    points = ume_points;
  } else if (shape.type === 'renzoku') {
    const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55];
    scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
    points = renzokuAwaji(shape.renzokuNum);
  } else if (shape.type === 'aioien') {
    scaleValue = shape.scale * 1.3;
    points = aioien_points;
  } else if (shape.type === 'kame') {
    scaleValue = shape.scale  * 1.2;
    points = kame_points;
  } else if (shape.type === 'kame2') {
    scaleValue = shape.scale  * 1.4;
    points = kame2_points;
  }
  //let adjusted = points;
  let adjusted = JSON.parse(JSON.stringify(points));  // ディープコピー
  //shape.flags.end = false;
  //shape.flags.middle = true;
  //console.log(shape.flags.end, shape.flags.middle);

  let type = shape.type;//reuzokuでawajiを使いたいため
  if (shape.type === 'renzoku') {
    type = 'awaji';
  }
  // 中央の切断
  if (shape.flags.middle && adjusted.length > 2) {
    let midIndex = Math.floor(adjusted.length / 2);

    // 中央の挿入ポイントを取得
    let middlePoint = middlePoints[type];

    if (middlePoint) {
      // 各要素を展開して中央に挿入
      if (shape.type === 'renzoku') {
        let addY = shape.renzokuNum * 60 - 80;//連続数に合わせて補助配列をy軸方向にずらしてから挿入
        adjusted.splice(midIndex, 0, ...middlePoint.map(point => ({ 
          ...point, 
          y: point.y + addY 
        })));
      } else{
        adjusted.splice(midIndex, 0, ...middlePoint);
      }
    }
    //console.log(adjusted, points);

    // カーブを中央で分割
    midIndex = Math.floor(adjusted.length / 2);
    const firstCurve = adjusted.slice(0, midIndex );
    const secondCurve = adjusted.slice(midIndex);
    //console.log([firstCurve, secondCurve]);
    // firstCurve の後ろから2番目のポイントを削除
    firstCurve.splice(firstCurve.length - 2, 1);

    // secondCurve の最初から2番目のポイントを削除
    secondCurve.splice(1, 1);
    //console.log('2', [firstCurve, secondCurve]);
    //return [firstCurve, secondCurve];
    adjusted[0] = firstCurve;
    adjusted[1] = secondCurve;
  }

  //端（上部）の擬似接続
  if (!shape.flags.end) {
    if (Array.isArray(adjusted[0])) {//切断された場合
      adjusted[0].shift();// adjusted配列の最初の要素を削除
      adjusted[1].pop();// adjusted配列の最後の要素を削除
      if (shape.type === 'renzoku') {
        let addY = shape.renzokuNum * 60 - 80;
        adjusted[1] = adjusted[1].concat(
          endPoints[type].map(point => ({ 
            ...point, 
            y: point.y - addY 
          }))
        );
      } else {
        adjusted[1] = adjusted[1].concat(endPoints[type]);// endPoints[shape.type] 配列を後ろに結合
      }
    } else {
      //adjusted.push(points[0]); // 最初の点を最後に追加
      adjusted.shift();// adjusted配列の最初の要素を削除
      adjusted.pop();// adjusted配列の最後の要素を削除
      if (shape.type === 'renzoku') {
        let addY = shape.renzokuNum * 60 - 80;
        adjusted = adjusted.concat(
          endPoints[type].map(point => ({ 
            ...point, 
            y: point.y - addY 
          }))
        );// endPoints[shape.type] 配列を後ろに結合
      } else {
        adjusted = adjusted.concat(endPoints[type]);// endPoints[shape.type] 配列を後ろに結合
      }
    }
  }
  //console.log(type, shape.type);
  //console.log(adjusted, points, endPoints[type]);
  //console.log('1');
  if (Array.isArray(adjusted[0])) {//切断された場合
    return [adjusted[0], adjusted[1]];
  } else {
    return [adjusted];
  }
  //return [adjusted];
}

function getConnectShapeProcess (p, shape1, layerIndex, shapeIndex, processNo) {
  // 接続先の図形を取得
  let shape2, shape1ConnectSet, shape2ConnectSet;
  shape1.connectors.forEach((connectorSet, index) => {
    if (connectorSet.isConnected !== null) {
      shape2 = connectorSet.isConnected.shape;  // 接続先の図形を取得
      shape1ConnectSet = index;
    }
  });
  shape2.connectors.forEach((connectorSet, index) => {
    if (connectorSet.isConnected !== null && connectorSet.isConnected.shape === shape1) {
      shape2ConnectSet = index; // shape2 の接続セットインデックスを取得
    }
  });


  // shape1 をディープコピー
  const newShape = deepCopyWithoutConnection(shape1);

  // 新しい形状のプロパティを上書き
  newShape.type = 'connect';
  newShape.x = shape1.x;
  newShape.y = shape1.y;
  newShape.rotation = 0; // 必要に応じて回転を設定
  newShape.connectors = []; // 接続情報をリセット
  newShape.shape = [shape1, shape2];


  let total1, total2;
  if (shape1.type === 'renzoku') {
    total1 = (shape1.renzokuNum-1)*4+4;
  } else {
    total1 = getTotalProcesses(shape1.type);
  }
  if (shape2.type === 'renzoku') {
    total2 = (shape2.renzokuNum-1)*4+3;
  } else {
    total2 = getTotalProcesses(shape2.type);
  }
  let totalProcesses = total1 + total2;
  let processPoints;

  const scalePoints = (points, shape) => {
    // scaleValue を shape に基づいて計算
    let scaleValue;
    if (shape.type === 'awaji') {
      scaleValue = shape.scale * 1.62; // awaji の場合
    } else if (shape.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55]; // インデックス0は使用しない
      scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
    } else if (shape.type === 'kame') {
      scaleValue = shape.scale  * 1.1;
    } else {
      scaleValue = shape.scale * 1.62; // デフォルト値
    }
    //console.log(points);
    return points.map(segment => 
      segment.map(point => ({
        x: point.x * scaleValue,
        y: point.y * scaleValue,
        z: point.z * scaleValue,
      }))
    );
  };

  // 回転を考慮
  const rotatePoints = (points, angle) => {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return points.map(segment =>
      segment.map(point => ({
        x: cosAngle * point.x - sinAngle * point.y,
        y: sinAngle * point.x + cosAngle * point.y,
        z: point.z, // z軸の値はそのまま
      }))
    );
  };

  const connectPoints = (arrays) => {
    const result = [];
  
    for (let i = 0; i < arrays.length; i++) {
      const currentArray = arrays[i];
      // 現在の配列を追加
      result.push(...currentArray);
  
      // 次の配列が存在する場合
      if (i < arrays.length - 1 && arrays[i + 1].length != 0) {
        const nextArray = arrays[i + 1];
        // 現在の配列の最後のポイント
        const lastPoint = currentArray[currentArray.length - 1];
  
        // 次の配列の最初のポイント
        const firstPoint = nextArray[0];
        // 中間ポイントを計算
        const midPoint = {
          x: (lastPoint.x + firstPoint.x) / 2,
          y: (lastPoint.y + firstPoint.y) / 2,
          z: (lastPoint.z + firstPoint.z) / 2,
          shape: 'shape1'
        };
  
        // 中間ポイントを結果に追加
        result.push(midPoint);
      }
    }
  
    return result;
  }

//console.log(processNo, total1, total2);
  if (processNo <= total2) {
    if (shape2.type === 'renzoku'){
      processPoints = partsPoints['renzoku2'][`process${processNo}`];
      //console.log(processPoints);
    } else {processPoints = [getProcessPoints(shape2.type, processNo)]};
    //console.log(processPoints);
    processPoints = scalePoints(processPoints, shape2);
    //console.log(processPoints);
    const angle2 = p.radians(shape2.rotation);
    processPoints = rotatePoints(processPoints, angle2);
    //console.log(processPoints);
    //console.log(processPoints);
    processPoints = processPoints.map(segment =>
      segment.map(point => ({
        x: point.x,
        y: point.y,
        z: point.z, // z座標はそのまま保持
        shape: "shape2",
      }))
    );
  } else {
    if (shape1.type === 'renzoku'){
      //console.log('ren');
      if (shape2.flags.middle){// 中央切断がある場合
        if (shape1.flags.end && processNo == total1+total2+1) {
          //console.log('1');
          processPoints = partsPoints['renzoku'][`process${processNo-total2-1}`];
        } else if (!shape1.flags.end && processNo >= total1+total2+1+2) {
          //console.log('2');
          processPoints = partsPoints['renzoku'][`process${processNo-total2-1}`];
        } else {
          processPoints = partsPoints['renzoku'][`process${processNo-total2}`];
          //console.log(partsPoints['renzoku'],processNo-total2-1,processNo,total1, total2);
        }
      } else {
        processPoints = partsPoints['renzoku'][`process${processNo-total2}`];
      }
      //processPoints = [processPoints[0].slice(1), processPoints[1].slice(0, -1)];
      //console.log(processPoints);

      //ここで位置を調整。連続回数によってポイントを-して使う
      if (shape2.type === 'renzoku'){
        let t = 105;
        //console.log(Math.floor(processNo/4));
        t = Math.floor(processNo/4) * t;
        let s = shape1.renzokuNum - shape2.renzokuNum;
        processPoints = processPoints.map(segment =>
          segment.map(point => ({
            x: point.x,
            y: point.y + 550 - t - s* 140,
            z: point.z // z座標はそのまま保持
          }))
        );
      } else {
        let t = (105);
        t = Math.floor(processNo/4) * t;
        let s = shape2.scale*10;
        processPoints = processPoints.map(segment =>
          segment.map(point => ({
            x: point.x,
            y: point.y + 300 - t + s* 50,
            z: point.z // z座標はそのまま保持
          }))
        );
      }

    } else {
      if (processNo == total1+total2+1){// 中央切断がある場合
        processPoints = [getProcessPoints(shape1.type, processNo-total2-1)];
      } else {
        processPoints = [getProcessPoints(shape1.type, processNo-total2)];
      }
    };
    //processPoints = [getProcessPoints(shape1.type, processNo-total2)];
    //console.log(processPoints);
    processPoints = scalePoints(processPoints, shape1);
    //console.log(processPoints);
    const angle1 = p.radians(shape1.rotation);
    processPoints = rotatePoints(processPoints, angle1);
    processPoints = processPoints.map(segment =>
      segment.map(point => ({
        x: point.x,
        y: point.y,
        z: point.z, // z座標はそのまま保持
        shape: "shape1",
      }))
    );
    //console.log(processPoints);

    if (shape2.type === 'renzoku'){
      if (shape2.flags.middle){// 中央切断がある場合
        if (shape1.flags.end && processNo == total1+total2+1) {
          shape2Points = partsPoints['renzoku2'][`process${total2+1}`];
        } else if (!shape1.flags.end && processNo == total1+total2+1+2) {
          shape2Points = partsPoints['renzoku2'][`process${total2+1}`];
        } else {
          shape2Points = partsPoints['renzoku2'][`process${total2}`];
        }
      } else {
        shape2Points = partsPoints['renzoku2'][`process${total2}`];
      } 
    } else {shape2Points = [getProcessPoints(shape2.type, total2)]};
    //console.log(partsPoints['renzoku2'], total2+1);
    //shape2Points = partsPoints['renzoku2'][`process${total2}`];
    shape2Points = scalePoints(shape2Points, shape2);
    const angle2 = p.radians(shape2.rotation);
    shape2Points = rotatePoints(shape2Points, angle2);
    // shape2 の制御点を shape1 基準に調整
    shape2Points = shape2Points.map(segment =>
      segment.map(point => ({
        x: point.x + (shape2.x - shape1.x),
        y: point.y + (shape2.y - shape1.y),
        z: point.z // z座標はそのまま保持
      }))
    );
    shape2Points = shape2Points.map(segment =>
      segment.map(point => ({
        x: point.x,
        y: point.y,
        z: point.z, // z座標はそのまま保持
        shape: "shape2",
      }))
    );

    if (shape2.flags.middle && (shape1.flags.end && processNo == total1+total2+1)){
      //processPoints = [processPoints[0], shape2Points[0], shape2Points[1], processPoints[1]];//この辺？
      processPoints = processPoints.map(segment =>
        segment.map(point => ({
          x: point.x,
          y: point.y + 68,
          z: point.z // z座標はそのまま保持
        }))
      );
      processPoints = [connectPoints([processPoints[0], shape2Points[0]]), connectPoints([shape2Points[1], processPoints[1]])];
    } else if (shape2.flags.middle && (!shape1.flags.end && processNo == total1+total2+3)) {
      processPoints = processPoints.map(segment =>
        segment.map(point => ({
          x: point.x,
          y: point.y,
          z: point.z // z座標はそのまま保持
        }))
      );
      processPoints = [connectPoints([processPoints[0], shape2Points[0]]), connectPoints([shape2Points[1], processPoints[1]])];
    } else {
      processPoints = [processPoints[0], ...shape2Points, processPoints[1]];//この辺？
      //console.log(processPoints);
      processPoints = [connectPoints(processPoints)];//これの代わりに、shapeをつけてそのまま渡す
      //console.log(processPoints);
    }
    //console.log(processPoints);
    //console.log(processPoints);
    /*if (processNo == total2+1){
      processPoints = [connectPoints(processPoints)];
      console.log(processPoints);
    }*/
  }

  /*
  const getPoints = (shape) => {//今のところ使わない
    let points;
    let scaleValue=1.62;
    if (shape.type === 'awaji') {
      points = [awaji_points];
    } else if (shape.type === 'ume') {
      points = [ume_points];
    } else if (shape.type === 'renzoku') {
      const scaleFactors = [0, 1.4, 1.7, 1.3, 1.1, 0.9, 0.8, 0.65, 0.55]; // インデックス0は使用しない
      scaleValue = shape.scale * scaleFactors[shape.renzokuNum];
      points = [renzokuAwaji(shape.renzokuNum)];//何連続か
    } else if (shape.type === 'aioien') {
      scaleValue = shape.scale * 1.3;
      points = [aioien_points];
    }

    return points.map(segment => 
      segment.map(point => ({
        x: point.x * scaleValue,
        y: point.y * scaleValue,
        z: point.z * scaleValue,
      }))
    );
  };
  */

  drawShape(p, newShape, layerIndex, shapeIndex, 1, processNo, processPoints);
}