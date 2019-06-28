/**
 * use instagram filter to display n images
 * use brain.js to learn from pixel to pixel mapping for each pair of images
 * then use this model to filter a new image
 */

var IMAGE_WIDTH = 500
var IMAGE_HEIGHT = 500
var CANVAS_WIDTH = IMAGE_WIDTH
var CANVAS_HEIGHT = IMAGE_HEIGHT

var trainingData = []

var canvas = {
  origin: createCanvas(),
  filtered: createCanvas()
}
var ctx = {
  origin: canvas.origin.getContext('2d'),
  filtered: canvas.filtered.getContext('2d')
}

function createCanvas () {
  var canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  return canvas
}

function getFilter (className) {
  var rules = document.styleSheets[0].cssRules
  className = className || document.getElementById('filtered').classList[0]
  for (var i = 0; i < rules.length; i ++) {
    var rule = rules[i]
    if (rule.selectorText === '.' + className) {
      return rule.style.filter
    }
  }
}

function getPixelData (imageData, x, y) {
  var offset = x * 4 + y * imageData.width * 4
  var pixelData = []
  for (var i = offset; i < offset + 4; i++) {
    pixelData.push(imageData.data[i])
  }
  return pixelData
}

function setPixelData (imageData, x, y, pixelData) {
  var offset = x * 4 + y * imageData.width * 4
  for (var i = offset; i < offset + 4; i++) {
    imageData.data[i] = pixelData[i - offset]
  }
}

function getImage (type) {
  return document.getElementById(type).querySelector('img')
}

function getImageData (ctx, image, filter) {
  ctx.filter = filter || 'none'
  ctx.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  return ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}

function collectTrainData () {
  // var trainingData = []
  var originImageData = getImageData(ctx.origin, getImage('origin'))
  var filteredImageData = getImageData(ctx.filtered, getImage('filtered'), getFilter())

  for (var x = 0; x < CANVAS_WIDTH; x++) {
    for (var y = 0; y < CANVAS_HEIGHT; y++) {
      var originPixelData = getPixelData(originImageData, x, y)
      var filteredPixelData = getPixelData(filteredImageData, x, y)
      trainingData.push({
        input: originPixelData,
        output: filteredPixelData
      })
    }
  }

  // return trainingData
}

var count = 0
function nextImage () {
  count += 1
  var countStr = count + ''
  if (countStr.length === 2) {
    countStr = '0' + countStr
  } else if (countStr.length === 1) {
    countStr = '00' + countStr
  }
  getImage('filtered').src = 'assets/img/image-' + countStr + '.jpg'
  getImage('origin').src = 'assets/img/image-' + countStr + '.jpg'

  setTimeout(() => {
    collectTrainData()
  }, 500)
}

function output (targetCanvas, inputImage, pixelMapper) {
  targetCanvas = targetCanvas || createCanvas()
  var sCanvas = createCanvas()
  var sCtx = sCanvas.getContext('2d')
  var tCtx = targetCanvas.getContext('2d')

  sCtx.drawImage(inputImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  var sImageData = sCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  for (var x = 0; x < sImageData.width; x++) {
    for (var y = 0; y < sImageData.height; y++) {
      var pixelData = getPixelData(sImageData, x, y)
      var newPixelData = pixelMapper(pixelData)
      setPixelData(sImageData, x, y, newPixelData)
    }
  }
  tCtx.putImageData(sImageData, 0, 0)

  return targetCanvas
}

function train (data) {
  var net = new brain.NeuralNetwork({
    binaryThresh: 0.5,
    hiddenLayers: [3],
    activation: 'sigmoid',
    leakyReluAlpha: 0.01
  })
  net.train(data.map(d => {
    return {
      input: d.input.map(v => v / 255),
      output: d.output.map(v => v / 255)
    }
  }))
  return function pixelMapper (pixelData) {
    return net.run(pixelData).map(v => Math.round(v * 255))
  }
}

function start () {
  collectTrainData()
  console.log(trainingData)
  var mapper = train(trainingData)
  console.log(mapper)
  var canvas = output(null, getImage('origin'), mapper)
  document.body.appendChild(canvas)
}