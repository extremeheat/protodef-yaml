// Represents a ProtoDef data type.
// This is a recursive type.
// See https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#recursive-type-aliases
// Basic types are strings (e.g., "i32", "string", "bool").
// Complex types are arrays representing structures like containers, arrays, mappers, and switches.
export type ProtoDefType = string | ProtoDefArray;

export interface ProtoDefNamedType {
  name?: string;
  anon?: boolean;
  type: ProtoDefType;
}

// Represents a ProtoDef container.
export interface ProtoDefContainer {
  type: ['container', ProtoDefNamedType[]];
}

// Represents a ProtoDef array.
export interface ProtoDefArrayDetails {
  countType?: string;
  count?: string | number;
  type: ProtoDefType;
}
export type ProtoDefArray = ['array', ProtoDefArrayDetails];

// Represents a ProtoDef mapper.
export interface ProtoDefMapper {
  type: ['mapper', {
    type: string;
    mappings: { [key: string]: string | ProtoDefType };
  }];
}

// Represents a ProtoDef switch.
export interface ProtoDefSwitch {
  type: ['switch', {
    compareTo: string;
    fields: { [key: string]: ProtoDefType };
    default?: ProtoDefType;
  }];
}

// Represents a full ProtoDef schema.
// It's a dictionary where keys are schema entry names and values are ProtoDef types.
export interface ProtoDefSchema {
  [key: string]: ProtoDefType;
}

// Options for the parse function.
export interface ParseOptions {
  includeComments?: boolean;
  followImports?: boolean;
}

// Options for the genHTML function.
export interface GenHTMLOptions {
  includeHeader?: boolean;
  schemaSegmented?: boolean;
}

module "protodef-yaml" {
    // Convert protodef-yaml encoded string to JSON object (ProtoDefSchema)
    export function compile(inputFile: string, outputFile?: string): ProtoDefSchema
    // Returns intermediate representation for protodef-yaml (ProtoDefSchema)
    // The structure before final transformation, may include special parsing keys.
    export function parse(inputFile: string, options?: ParseOptions): ProtoDefSchema
    export function genHTML(parsedObject: ProtoDefSchema, options?: GenHTMLOptions): string
    export function genYAML(json: object): string
}