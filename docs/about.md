
protodef-yaml is a human friendly, easy to read and easy to write schema with support for inline documentation that compiles to ProtoDef schema JSON or HTML. The schema is YAML-like, but with some design changes for the purpose of readability.

### Structure

In protodef-yaml, you  declare data structures much like you would in TypeScript or C. The top level objects represent data structures (ProtoDef containers).

### Fields
Each of the keys are order dependent much like in C. The left side contains the name of the variable, and after the colon you have the type of the variable like in TypeScript.
```coffee
Vec3i:                   struct Vec3i {
  x: li32                   int x;
  y: li32                   int y;
  z: li32                   int z;
                         }
```
Per the ProtoDef schema, you can also create top level type aliases:
```coffee
Int: li32                 using Int = int;
Vec3i:                    struct Vec3i {
  x: Int                    Int x;
                          }
```
### Control Flow

Control structures like switches can be declared by putting a question mark at the end of a type. What's before the "?" is the variable that will be compared against switch cases.

Underneath are an +1 indented list of "if ..."'s that are switch cases.

```coffee
haveVec3: bool              bool haveVec3 = readBool()
vec3: haveVec3 ?            vec3 = switch (haveVec3) {
	if true: Vec3               case true: return readVec3()
                            }
```																			

This begins a switch statement, with the 
