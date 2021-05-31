# protodef-yaml
Transforms YAML-like syntax to ProtoDef JSON schema and HTML documentation.

### Usage

```sh
npm install -g protodef-yaml
protodef-yaml <input yaml file> <output json file> # generate json
protodef-yaml <input yaml file> <output html file> # generate docs
```

or through npx,
```
npx protodef-yaml input.yml
```

### API

See [API.md](docs/API.md)

### Syntax
TODO, see test/ for example files

Example input:

```yaml
ScoreEntries:
   type: u8 =>
      0: change
      1: remove
   entries: []varint
      scoreboard_id: zigzag64
      objective_name: string
      score: li32
      _: type?
         if remove:
            entry_type: i8 =>
               1: player
               2: entity
               3: fake_player
            _: entry_type?
               if player or entity:
                  entity_unique_id: zigzag64
               if fake_player:
                  custom_name: string
```

**Output**
<details>
<summary>Click to see JSON</summary>

```json
{
  "ScoreEntries": [
    "container",
    [
      {
        "name": "type",
        "type": [
          "mapper",
          {
            "type": "u8",
            "mappings": {
              "0": "change",
              "1": "remove"
            }
          }
        ]
      },
      {
        "name": "entries",
        "type": [
          "array",
          {
            "countType": "varint",
            "type": [
              "container",
              [
                {
                  "name": "scoreboard_id",
                  "type": "zigzag64"
                },
                {
                  "name": "objective_name",
                  "type": "string"
                },
                {
                  "name": "score",
                  "type": "li32"
                },
                {
                  "anon": true,
                  "type": [
                    "switch",
                    {
                      "compareTo": "../type",
                      "fields": {
                        "remove": [
                          "container",
                          [
                            {
                              "name": "entry_type",
                              "type": [
                                "mapper",
                                {
                                  "type": "i8",
                                  "mappings": {
                                    "1": "player",
                                    "2": "entity",
                                    "3": "fake_player"
                                  }
                                }
                              ]
                            },
                            {
                              "anon": true,
                              "type": [
                                "switch",
                                {
                                  "compareTo": "entry_type",
                                  "fields": {
                                    "player": [
                                      "container",
                                      [
                                        {
                                          "name": "entity_unique_id",
                                          "type": "zigzag64"
                                        }
                                      ]
                                    ],
                                    "entity": [
                                      "container",
                                      [
                                        {
                                          "name": "entity_unique_id",
                                          "type": "zigzag64"
                                        }
                                      ]
                                    ],
                                    "fake_player": [
                                      "container",
                                      [
                                        {
                                          "name": "custom_name",
                                          "type": "string"
                                        }
                                      ]
                                    ]
                                  },
                                  "default": "void"
                                }
                              ]
                            }
                          ]
                        ]
                      },
                      "default": "void"
                    }
                  ]
                }
              ]
            ]
          }
        ]
      }
    ]
  ]
}
```
</details>

### Info

The differences to YAML:
* parent nodes with children can have a value
* keys starting with '!' are ignored in the final output

You can also embed JSON for custom ProtoDef types as usual, for example:

```yaml
string: ["pstring", {"countType": "i32"}]
```

*Note:* the parser only supports this at a root level -- nested json inside yaml will not work)
