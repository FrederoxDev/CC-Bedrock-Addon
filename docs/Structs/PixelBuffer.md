# Pixel Buffer

## Static Methods

### New
Returns an instance of a pixel buffer
- Parameters: [`width: Number`](Number) [`height: Number`](Number)
- Throws: `Width and Height must be greater than 0`
- Throws: `Width and Height must be divisible by 16`
- Returns: [`PixelBuffer`](PixelBuffer.md)

## Instance Methods

### DrawPixel
Sets a single pixel on screen
- Parameters: [`x: Number`](Number) [`y: Number`](Number) [`color: Color`](./../Enums/Color.md)
- Throws: `Will throw if point is not in screen bounds`
- Returns: `void`

### DrawLine
Draws a line between two points
- Parameters: [`x1: Number`](Number) [`y1: Number`](Number) [`x2: Number`](Number) [`y2: Number`](Number) [`color: Color`](../Enums/Color.md)
- Throws: `Will throw if points are not in screen bounds`
- Returns: `void`

### DrawCircle
Draws a circle at a point
- Parameters: [`x: Number`](Number) [`y: Number`](Number) [`radius: Number`](Number) [`fill: Boolean`](Number) [`color: Color`](../Enums/Color.md)
- Returns: `void`

### DrawText
Draws text from the top left corner of the screen, will wrap around lines
- Parameters: [`text: String`](String)
- Returns: `void`