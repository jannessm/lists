export function packRef(doc: any, keys: string[]) {
    keys.forEach(key => {
        if (key in doc && doc[key] instanceof Array) {
            doc[key] = doc[key].map((d: any) => d['id']);
        } else if (key in doc) {
            doc[key] = doc[key]['id'];
        }
    });
}

export function unpackRef(doc: any, keys: string[]) {
    keys.forEach(key => {
        if (key in doc && typeof(doc[key]) === 'string') {
            doc[key] = {id: doc[key]};
        } else if (key in doc) {
            doc[key] = doc[key].map((d: any) => {id: d});
        }
    });
}

export function removeItems(doc: any, keys: string[]) {
    keys.forEach(key => {
        delete doc[key];
    });
}

export function fixQuery(query: string): string {

    query = query.replace('lists', 'lists { id }')
        .replace('createdBy', 'createdBy { id }')
        .replace('sharedWith {\n                }', 'sharedWith { id }');
  
    return query;
  }