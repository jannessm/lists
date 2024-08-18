import { GraphQLSchema, MyPushBuilder, MyQueryBuilder, MyStreamBuilder } from "./types/graphql-types";
import { JsonItem, JsonSchema } from "./types/schema";
import { MyPushRow } from "./types/common";

export function pullQueryBuilderFromSchema(
    collectionName: string,
    schema: GraphQLSchema
): MyQueryBuilder {
    const ucCollectionName = collectionName[0].toUpperCase() + collectionName.slice(1);
    const checkpointInput = ucCollectionName + 'InputCheckpoint';
    const outputFields = generateGQLOutputFields(schema.schema);
    const checkpointFields = schema.checkpointFields.join(' ');

    const builder = (checkpoint: any, limit: number) => {
        const query = `query Pull${ucCollectionName}($checkpoint: ${checkpointInput}, $limit: Int!) {
            pull${ucCollectionName}(checkpoint: $checkpoint, limit: $limit) {
                documents {
${outputFields}
                }
                checkpoint {
                    ${checkpointFields}
                }
            }
        }`;
        
        return {
            query,
            variables: {
                checkpoint,
                limit
            }
        };
    };

    return builder;
}

export function pullStreamBuilderFromSchema(
    collectionName: string,
    schema: GraphQLSchema
): MyStreamBuilder {
    const ucCollectionName = collectionName[0].toUpperCase() + collectionName.slice(1);
    const outputFields = generateGQLOutputFields(schema.schema);
    const checkpointFields = schema.checkpointFields.join(' ');

    const query = `subscription onStream($headers: ${ucCollectionName}InputHeaders) {
        stream${ucCollectionName}(headers: $headers) {
            documents {
${outputFields}
            }
            checkpoint {
                ${checkpointFields}
            }
        }
    }`;

    return (headers: any) => {
        return {
            query,
            variables: {
                headers
            }
        };
    };
}

export function pushQueryBuilderFromSchema(
    collectionName: string,
    schema: GraphQLSchema
): MyPushBuilder {
    const ucCollectionName = collectionName[0].toUpperCase() + collectionName.slice(1);
    const returnFields = generateGQLOutputFields(schema.schema);

    const builder = (rows: MyPushRow[]) => {
        const query = `mutation Push${ucCollectionName}($rows: [${ucCollectionName}InputPushRow!]) {
            push${ucCollectionName}(${collectionName}PushRow: $rows) {
${returnFields}
            }
        }`;

        const sendRows: MyPushRow[] = rows.map(row => {
            return {
                newDocumentState: filterObjectBySchemaFields(row.newDocumentState, schema.schema),
                assumedMasterState: row.assumedMasterState ? filterObjectBySchemaFields(row.assumedMasterState, schema.schema) : undefined
            };
        });
        
        return {
            query,
            variables: {
                $rows: sendRows
            }
        };
    };

    return builder;
}

function generateGQLOutputFields(schema: JsonItem, intent = 4): string {
    const SPACING = ' '.repeat(4 * intent);
    
    if (schema.type === 'object' && schema.properties) {
        return Object.entries(schema.properties).map(val => {
            const key = val[0];
            const item = val[1];

            if (item.type === 'object' || item.type === 'array') {
                const outputFields = generateGQLOutputFields(item, intent + 1);
                return `${SPACING}${key} {\n${outputFields}${SPACING}}\n`;
            } else {
                return SPACING + key + '\n';
            }
        }).join('');
    } else if (schema.type === 'array' && schema.items) {
        return generateGQLOutputFields(schema.items, intent);
    }

    return '';
}

function filterObjectBySchemaFields(object: any, schema: JsonSchema): any {
    const newObject: any = {};
    Object.keys(schema.properties).forEach(key => {
        newObject[key] = object[key];
    });
    return newObject;
}