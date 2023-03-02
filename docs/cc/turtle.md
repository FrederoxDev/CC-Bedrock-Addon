# Turtle Struct

## Example Usage:
```rs:line-numbers
// If the block below the turtle is grass
if (Turtle::InspectDown() == "minecraft:grass") {
    // Move the turtle forwards
    Turtle::Forward();
}
else {
    // If it is not grass turn right and go forward
    Turtle::TurnRight();
    Turtle::Forward();
}
```

## Implements

### `Forward`
Moves the turtle forward one block in the direction it is facing. 
If the block in front of the turtle is not air, the turtle will not move.
- Parameters - `None`
- Returns - `void`

### `TurnLeft`
The turtle will turn left, the turtle remains on the same block.
- Parameters - `None`
- Returns - `void`

### `TurnRight`
The turtle will turn right, the turtle remains on the same block.
- Parameters - `None`
- Returns - `void`

### `Inspect`
The turtle will get the ID of the block in the direction it is facing
- Parameters - `None`
- Returns - `String`

### `InspectDown`
The turtle will get the ID of the block below it
- Parameters - `None`
- Returns - `String`

### `InspectUp`
The turtle will get the ID of the block above it
- Parameters - `None`
- Returns - `String`

### `Dig`
The turtle will mine the block in the direction it is facing.
It will not mine unbreakable blocks.
- Parameters - `None`
- Returns `void`

### `DigUp`
The turtle will mine the block above.
It will not mine unbreakable blocks.
- Parameters - `None`
- Returns `void`

### `DigUp`
The turtle will mine the block below.
It will not mine unbreakable blocks.
- Parameters - `None`
- Returns `void`