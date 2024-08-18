/** gets current forkstate, assumedMaster and the trueMaster states
 *  compares the assumed master and true master to resolve the conflict
 * 
 *  @return the resolved forkstate such that the trueMaster is the new base of the fork state
 * 
 *  by default the fork state is overwritten by the trueMasterState.
 * 
 *  if doc is merged: Adjust the property "touched" accordingly!
 */
export function defaultConflictHandler(
    forkState: any,
    assumendMasterState: any,
    trueMasterState: any,
): any {
    if (assumendMasterState.updatedAt === trueMasterState.updatedAt) {
        return forkState;
    } else {
        return trueMasterState;
    }
}