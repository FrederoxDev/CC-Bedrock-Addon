# Display

## Constructors

### Connect
Returns an instance of a display at a specific position
- Parameters: `x: Number, y: Number, z: Number, width: Number, height: Number`
- Returns: `Display`

## Methods

### DrawBuffer
Draws a [PixelBuffer](PixelBuffer.md) to the screen
- Parameters: `buffer: PixelBuffer`
- Throws: `Will throw an error if pixelBuffer is the wrong size`
- Returns: `void`