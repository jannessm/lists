import { GraphQLSchema } from "./types/graphql-types";
import { JsonItem, JsonSchema } from "./types/schema";
import { MyPushRow } from "./types/common";

export function pullQueryBuilderFromSchema(
    collectionName: string,
    schema: GraphQLSchema
) {
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
) {

}

export function pushQueryBuilderFromSchema(
    collectionName: string,
    schema: GraphQLSchema
) {
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
                assumedMasterState: filterObjectBySchemaFields(row.assumedMasterState, schema.schema)
            };
        });
        
        return {
            query,
            variables: {
                '$rows': sendRows
            }
        };
    };

    return builder;
}

function generateGQLOutputFields(schema: JsonItem, intend = 1): string {
    const outputFields = getOutputFields(schema);

    return outputFields.map((val: string | []) => {
        outputFieldToString(val)
    }).join('');
}

function getOutputFields(schema: JsonItem): any {
    if (schema.type === 'object' && schema.properties) {
        return Object.entries(schema.properties).map(val => {
            const key = val[0];
            const item = val[1];

            if (item.type === 'object' || item.type === 'array') {
                return getOutputFields(item);
            } else {
                return key;
            }
        });
    } else if (schema.type === 'array' && schema.items) {
        return getOutputFields(schema.items);
    }

    return [];
}

function outputFieldToString(field: string | [], intent = 1): string {
    const SPACING = 4 * intent;

    if (typeof field === 'string') {
        return ' '.repeat(SPACING) + field + '\n';
    } else {
        return (field as []).map(f => outputFieldToString(f, intent + 1)).join('');
    }
}

function filterObjectBySchemaFields(object: any, schema: JsonSchema): any {
    const newObject: any = {};
    Object.keys(schema.properties).forEach(key => {
        newObject[key] = object[key];
    });
    return newObject;
}