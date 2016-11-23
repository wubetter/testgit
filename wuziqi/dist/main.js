(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var S = require("./score.js");
var R = require("./role.js");
var W = require("./win.js");

var Board = function (container,status){
    this.container = container;
    this.status = status;
    this.started = false;//是否已经开始
    this.steps = [];//存储

    var self = this;
    this.container.onclick = function(e){
        //如果棋盘正在执行电脑思考 或者 游戏没有开始 则不允许 用户执行
        if(self.lock || !self.started) return;
        var y = e.offsetX,x = e.offsetY;
        x = Math.floor( x / 30);
        y = Math.floor( y / 30);

        self.set(x,y,1);
    }
    // this.worker = new Worker("./dist/bridge.js?r="+(+new Date()));
    this.worker = new Worker("./dist/bridge.js");
    this.worker.postMessage({
        type:'START'
    })
    this.worker.onmessage = function(e) {
        self.setStatus("电脑下子("+e.data[0]+","+e.data[1]+"), 用时"+((new Date() - self.time)/1000)+"秒");
        self._set(e.data[0], e.data[1], R.com);
        self.lock = false;
        
    }
}
//画棋子
Board.prototype.draw = function(){
    var container = this.container;
    var board = this.board;
    if(this.steps.length>0){
        var lastStep = this.steps[this.steps.length-1];
        var x = lastStep[0],
            y = lastStep[1],
            type = this.board[x][y];

        context.beginPath();
        context.arc(15 + y * 30, 15 + x * 30, 13, 0, 2 * Math.PI);
        context.closePath();
        var gradient = context.createRadialGradient(15 + y * 30 + 2, 15 + x * 30 - 2, 13, 15 + y * 30 + 2, 15 + x * 30 - 2, 0);
        if (type == 1) {
            gradient.addColorStop('0', '#0a0a0a');
            gradient.addColorStop('1', '#636766');
        } else if(type == 2) {
            gradient.addColorStop('0', '#d1d1d1');
            gradient.addColorStop('1', '#f9f9f9');
        }
        context.fillStyle = gradient;
        context.fill();
    }
    

}
Board.prototype.stop = function() {
  if(!this.started) return;
  this.setStatus("游戏结束！请刷新从新开始");
  this.started = false;
}
Board.prototype._set = function(x, y, role) {
  this.board[x][y] = role;
  this.steps.push([x,y]);
  this.draw();
  var winner = W(this.board);
  var self = this;
  if(winner == R.com) {
    self.stop();
    setTimeout(function(){
        alert('愚蠢的人类，你输了！');
    },50)
  } else if (winner == R.hum) {
      self.stop();
    setTimeout(function(){
        alert('牛逼了，world 哥，你赢了！');     
    },50)
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this._set(x, y, role);
  if(!this.started) return;
  this.com(x, y, role); 
}

Board.prototype.com = function(x, y, role) {
  this.lock = true;
  this.time = new Date();
  this.worker.postMessage({
    type: "GO",
    x: x,
    y: y
  });
  
  this.setStatus("电脑正在思考...");
}
// Board.prototype.stop = function() {
//   if(!this.started) return;
//   this.setStatus("请点击开始按钮");
//   this.started = false;
// }
Board.prototype.setStatus = function(s) {
  this.status.innerHTML = s;
}
Board.prototype.initBoard = function(){
    this._drawBoard();
    this.board = [];
    this.lock = false;
    this.started = true;
    for(var i=0;i<15;i++) {
        var row = [];
        for(var j=0;j<15;j++) {
          row.push(0);
        }
        this.board.push(row);
      }
      this.steps = [];

}
//棋盘画线条
Board.prototype._drawBoard = function(){
    context.beginPath();
    context.fillStyle = '#fdd186';
    context.fillRect(2, 2, canvasWidth - 2, canvasHeight - 2);
    context.closePath();

    for (var i = 0; i < rowAndCol; i++) {
        context.moveTo(15 + i * 30, 15);
        context.lineTo(15 + i * 30, canvasHeight - 15);
        context.stroke();
        context.moveTo(15, 15 + i * 30);
        context.lineTo(canvasHeight - 15, 15 + i * 30);
        context.stroke();
    }
}

var container = document.getElementById('chess');
var rowAndCol = 15;
var canvasWidth = canvasHeight = 30 * rowAndCol;
container.width = canvasWidth;
container.height = canvasHeight;
var context = container.getContext('2d');
var status = document.getElementById('status');
var b = new Board(container,status);
b.initBoard();
},{"./role.js":2,"./score.js":3,"./win.js":4}],2:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}
},{}],3:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 100000,
  FIVE: 1000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 10000
}
},{}],4:[function(require,module,exports){
var R = require("./role.js");
var isFive = function(board, p, role) {
  var len = board.length;
  var count = 1;

  var reset = function() {
    count = 1;
  }

  for(var i=p[1]+1;true;i++) {
    if(i>=len) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }


  for(var i=p[1]-1;true;i--) {
    if(i<0) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }


  if(count >= 5) return true;
  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
      
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  return false;

}


var w = function(board) {
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var t = board[i][j];
      if(t !== R.empty) {
        var r = isFive(board, [i, j], t);
        if(r) return t;
      }
    }
  }
  return false;
}

module.exports = w;
},{"./role.js":2}]},{},[1]);
