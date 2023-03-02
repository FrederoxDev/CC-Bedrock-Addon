# Number Struct

## Example Usage:
```rs:line-numbers
let x = 12;
let y = 24;

log(x + y); // 36
log(Number::Add(x, y)); // 36
```

## Implements

### `Add`
- Parameters - `Number, Number`
- Returns - `Number`
```rs
log(Number::Add(12, 13)); // 25
log(12 + 13); // 25
```

### `Minus`
- Parameters - `Number, Number`
- Returns - `Number`
```rs
log(Number::Minus(10, 5)); // 5
log(10 - 5); // 5
```

### `Mul`
- Parameters - `Number, Number`
- Returns - `Number`
```rs
log(Number::Mul(10, 5)); // 50
log(10 * 5); // 50
```

### `Div`
- Parameters - `Number, Number`
- Returns - `Number`
```rs
log(Number::Div(10, 5)); // 2
log(10 / 5); // 2
```

### `LT`
- Parameters - `Number, Number`
- Returns - `Boolean`
```rs
log(Number::LT(25, 100)); // true
log(10 < 5); // false
```

### `LTE`
- Parameters - `Number, Number`
- Returns - `Boolean`
```rs
log(Number::LTE(25, 25)); // true
log(10 <= 5); // false
```

### `GT`
- Parameters - `Number, Number`
- Returns - `Boolean`
```rs
log(Number::GT(25, 100)); // false
log(10 > 5); // true
```

### `GTE`
- Parameters - `Number, Number`
- Returns - `Boolean`
```rs
log(Number::GTE(25, 25)); // true
log(5 >= 50); // false
```

### `EE`
- Parameters - `Number, Number`
- Returns - `Boolean`
```rs
log(Number::EE(25, 25)); // true
log(10 == 50); // false
```