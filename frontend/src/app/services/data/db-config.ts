import { DATA_TYPE } from "../../mydb/types/graphql-types";
import { ITEM_SCHEMA, itemsConflictHandler } from "../../mydb/types/list-item";
import { LISTS_SCHEMA, listsConflictHandler } from "../../mydb/types/lists";
import { ME_SCHEMA } from "../../mydb/types/me";
import { USERS_SCHEMA } from "../../mydb/types/users";
import { isValidUrl } from "../../pipes/linkify.pipe";

export const DB_CONFIG = {
        [DATA_TYPE.ME]: {
            schema: ME_SCHEMA,
            methods: {
                hasLists: function(listId: string) {
                    return !!((this as any).lists.find((l: string) => l === listId));
                }
            }
        },
        [DATA_TYPE.USERS]: {
            schema: USERS_SCHEMA,
        },
        [DATA_TYPE.LISTS]: {
            schema: LISTS_SCHEMA,
            methods: {
                users: function() {
                    return [(this as any).createdBy, ...(this as any).sharedWith];
                },
                isCreated: function() {
                    return !!(this as any).updatedAt;
                }
            },
            conflictHandler: listsConflictHandler
        },
        [DATA_TYPE.LIST_ITEM]: {
            schema: ITEM_SCHEMA,
            methods: {
                links: function() {
                    const links: string[] = [];
                    const description = (this as any).description as string | null | undefined || '';

                    description.split('\n').forEach(line => {
                        line.split(' ').forEach(word => {
                            if (isValidUrl(word)) {
                                links.push(word);
                            }
                        })
                    });

                    return links;
                }
            },
            conflictHandler: itemsConflictHandler
        }
    }