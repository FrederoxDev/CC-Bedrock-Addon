# Display

## Static Methods

### Connect
Returns an instance of a display at a specific position
- Parameters: [`x: Number`](Number) [`y: Number`](Number) [`width: Number`](Number) [`height: Number`](Number)
- Returns: [`Display`](Display.md)

## Instance Methods

### DrawBuffer
Draws the pixel buffer to the screen
- Parameters: [`buffer: PixelBuffer`](PixelBuffer.md)
- Throws: `Will throw an error if pixelBuffer is the wrong size`
- Returns: `void`