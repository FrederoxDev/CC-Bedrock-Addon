# Structs

Structs are a powerful feature of Cosmic that allow you to define custom data types. A struct is a collection of fields that can be used to store related data together. This makes code more concise and easier to read.

## Defining a Struct

To define a stuct, we use the `struct` keyword followed by the name of the Struct. In this example we will create a struct which can
store the name and age of a person
```rs:line-numbers
// Create a struct called 'Person'
struct Person {}
```

To define fields on the struct, we give the name of the field followed by its type. 
```rs:line-numbers
struct Person {
    // Create a field called 'name' of type 'String'
    name: String,
    // Create a field called 'age' of type 'Number'
    age: Number
}
```

## Creating an instance of a struct

To create an instance of a struct in Cosmic, you can use the struct's name followed by a set of braces that contain the values for each field. We will continue using the struct we defined in the last section.

```rs:line-numbers
// Create an instance of the Person struct with the name "John" 
// and an age of "24" and assign it to the variable `person`
let person = Person {name: "John", age: 24};

// To access the fields inside of the struct you can use the '.' operator
log(john.name); // "John"
log(john.age); // 24
```