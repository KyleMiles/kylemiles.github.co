'use strict';

// requestanimation polyfill
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
            callback(currTime + timeToCall);
        },
        timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
}());

// setup stuff.
var canvas = document.getElementById("circuitCanvas"),
    ctx = canvas.getContext("2d"),
    width = window.innerWidth-(window.innerWidth*0.05),
    height = window.innerHeight-(window.innerHeight*0.02),
    settings = {
        background: "#0D4D2B",
        traceColor: "#ffe99b",
        traceFill: "#000000",
        startTraces : 50,
        totalTraces : 0,
        standard: {
            background: "#0D4D2B",
            traceColor: "#ffe99b",
            traceFill: "#000000"
        },
        colorScheme: 0
    }

canvas.width = width;
canvas.height = height;

function Trace(settings) {
    this.x = settings.x || Math.ceil((Math.random() * width) / 4) * 4;
    this.y = settings.y || Math.ceil((Math.random() * height) / 4) * 4;

    this.points = [];
    this.points.push({
        x: this.x,
        y: this.y,
        arc: 0
    });

    this.trapCount = 0;
    this.live = true;

    this.lastPoint = this.points[0];

    this.angle = settings.angle || (Math.ceil((Math.random() * 360) / 45) * 45) * (Math.PI / 180);
    this.speed = 4;
}

Trace.prototype.update = function () {
    var x = this.lastPoint.x,
        y = this.lastPoint.y,
        dx = this.x - x,
        dy = this.y - y;

    var velX = Math.cos(this.angle) * this.speed,
        velY = Math.sin(this.angle) * this.speed,
        checkPointX = this.x + (Math.cos(this.angle) * 8),
        checkPointY = this.y + (Math.sin(this.angle) * 8),
        imageData = ctx.getImageData(checkPointX, checkPointY, 3, 3),
        pxlData = imageData.data,
        collision = false;

    // check if its in bounds.
    if (checkPointX > 0 && checkPointX < width && checkPointY > 0 && checkPointY < height) {
        //check if the point in front is clear or not.
        for (var i = 0, n = pxlData.length; i < n; i += 4) {
            var alpha = imageData.data[i + 3];
            if (alpha !== 0) {
                collision = true;
                break;
            }
        }
    } else {
        collision = true;
    }

    // no collision keep moving
    if (!collision) {
        this.trapCount = 0;
        this.x += velX;
        this.y += velY;
    } else {
        // collision, assume its not the end
        this.trapCount++;
        this.angle -= 45 * (Math.PI / 180);
        // line is fully trapped make sure to draw an arc and start a new trace.
        if (this.trapCount >= 7) {
            this.live = false;

            if (traces.length < settings.totalTraces) {
                traces.push(new Trace({
                    cX: 0,
                    cY: 0
                }));
            }
        }
        if (Math.sqrt(dx * dx + dy * dy) > 4) {
            this.points.push({
                x: this.x,
                y: this.y
            });
            this.lastPoint = this.points[this.points.length - 1];
        } else {
            this.trapCount++;
            this.x = this.lastPoint.x;
            this.y = this.lastPoint.y;
        }
    }
};

Trace.prototype.render = function () {
  if (this.live) {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (var p = 1, plen = this.points.length; p < plen; p++) {
        ctx.lineTo(this.points[p].x, this.points[p].y);
    }
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.points[0].x, this.points[0].y, 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!this.live) {
        ctx.beginPath();
        ctx.arc(this.points[plen - 1].x, this.points[plen - 1].y, 4, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
  }
};

// init
var traces = [],
    traceNum = settings.startTraces,
    reqAnimFrameInstance = null;

for (var b = 0; b < traceNum; b++) {
    traces.push(new Trace({
        cX: 0,
        cY: 0
    }));
}

ctx.strokeStyle = "#ffe99b";
ctx.fillStyle = "#000";
ctx.lineWidth = 4;

function doTrace() {
    ctx.clearRect(0, 0, width, height);

    for (var b = 0; b < traces.length; b++) {
        traces[b].render();
        if (traces[b].live) {
            traces[b].update();
        }
    }

    reqAnimFrameInstance = requestAnimationFrame(doTrace);
}

window.onload = doTrace();
