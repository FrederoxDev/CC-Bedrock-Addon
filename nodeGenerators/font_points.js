var getPixels = require("get-pixels")

getPixels("nodeGenerators/char.png", function(err, pixels) {
  if(err) {
    console.log(err)
    console.log("Bad image path")
    return
  }

  var points = [];

  for (var x = 0; x < 5; x++) {
    for (var y = 0; y < 7; y++) {
        const red = pixels.get(x, y, 0);
        const green = pixels.get(x, y, 1);
        const blue = pixels.get(x, y, 2);
        const alpha = pixels.get(x, y, 3);

        var isBlack = (red === 0 && green === 0 && blue === 0 && alpha === 255)
        if (isBlack) points.push([x, 6 - y])
    }
  }

  console.log(JSON.stringify(points))
})