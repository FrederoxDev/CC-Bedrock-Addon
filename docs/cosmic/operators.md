# Operators

Operator overloading is a powerful feature in Cosmic that allows structs to implement functionality for operators used in the language. This can make code more concise and easier to read.

## Example
In this example, we will show how to overload the '+' operator for a custom struct called Vec2. The Vec2 struct contains an X and a Y position. We will implement the Add function to overload the '+' operator and add two Vec2 objects together.
```rs
// Define a struct containing an X and a Y position
struct Vec2 {x: Number, y: Number}

// Implement the `Add` function to overload the '+' operator
impl Vec2 {
    fn Add(self: Vec2, other: Vec2) {
        // Return a new Vec2 with the two X and Y's added together
        return Vec2 {
            x: self.x + other.x, 
            y: self.y + other.y
        };
    }
}

// Using the operator
let vec = Vec2 {x: 1, y: 3} + Vec2 {x: 4, y: 2}; // {x: 5, y: 5}
```

## Operators
### Arithmetic Operators
- `Add (+)` 
- `Minus (-)` 
- `Mul (*)` 
- `Pow (**)` 
- `Div (/)` 

### Comparison Operators
- `EE (==)` 
- `NE (!=)` 
- `GT (>)` 
- `GTE (>=)` 
- `LT (<)` 
- `LTE (<=)` 

### Logical Operators
- `And (&&)`
- `Or (||)`