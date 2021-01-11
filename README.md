# Array-Script
A joke programming language using JSON arrays. Written in nodejs.

Example:
```json
[
  ["function", "check_age", ["age"], [
    ["if", ["<", ["var", "age"], ["number", 18]], [
      ["log", ["string", "You are too joung to be driving. You need to be at least 18 years old."]]
    ], "else", [
      ["log", ["string", "You are old enough to drive."]]
    ]]
  ]],
  
  ["decl", "my_age", ["number", 17]],
  ["set", "my_age", ["+", ["var", "my_age"], ["number", 1]]],
  
  ["call", "check_age", [["var", "my_age"]]]
]
```

Comparable in Javascript to:
```js
function check_age(age) {
  if (age < 18) {
    console.log("You are too joung to be driving. You need to be at least 18 years old.");
  } else {
    console.log("You are old enough to drive.");
  }
  
  let my_age = 17;
  my_age = my_age + 1;
  
  check_age(my_age);
}```
