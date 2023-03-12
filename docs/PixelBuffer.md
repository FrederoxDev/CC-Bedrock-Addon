# Pixel Buffer

## Constructors

### New
Returns an instance of a pixel buffer
- Parameters: `width: Number, height: Number`
- Throws: `Width and Height must be greater than 0`
- Throws: `Width and Height must be divisible by 16`
- Returns: `PixelBuffer`

## Methods

### DrawPixel
Sets a single pixel on screen
- Parameters: `x: Number, y: Number, color: Number`
- Throws: `Will throw if point is not in screen bounds`
- Returns: `void`

### DrawLine
Draws a line between two points
- Parameters: `x1: Number, y1: Number, x2: Number, y2: Number, color: Number`
- Throws: `Will throw if points are not in screen bounds`
- Returns: `void`

### DrawCircle
Draws a circle at a point
- Parameters: `x: Number, y: Number, radius: Number, fill: Boolean, color: Number`
- Returns: `void`

### DrawText
Draws text from the top left corner of the screen, will wrap around lines
- Parameters: `text: String`
- Returns: `void`