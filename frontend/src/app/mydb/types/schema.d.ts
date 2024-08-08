export interface JsonSchema extends JsonItem {
    version: readonly number;
    primaryKey: readonly string;
    required: readonly string[];
    type: readonly 'object';
    properties: readonly {
        [key: string]: readonly JsonItem;
    }
}

/**
 * @link https://github.com/types/lib-json-schema/blob/master/v4/index.d.ts
 */
export type JsonSchemaTypes = 'array' | 'boolean' | 'integer' | 'number' | 'null' | 'object' | 'string' | (string & {});

export type JsonItem = {
    type: readonly JsonSchemaTypes | readonly JsonSchemaTypes[];
    properties?: readonly {
        [key: string]: readonly JsonItem;
    };
    items?: readonly JsonItem;
}

export type DexieSchema = {
    [tableName: string]: string;
};