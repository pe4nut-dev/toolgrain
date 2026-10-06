import type { CleaningSession, DuplicateDecision } from './types';
import { rebuildSession } from './apply-fixes';
export function decideDuplicate(session:CleaningSession,groupId:string,decision:DuplicateDecision):CleaningSession{
 const group=session.analysis.duplicateGroups.find(group=>group.id===groupId);
 if(!group)throw new Error('Unknown duplicate group.');
 if(decision.kind==='keep_row'&&!group.rows.includes(decision.row))throw new Error('Selected row is outside this group.');
 return rebuildSession({...session,duplicateDecisions:{...session.duplicateDecisions,[groupId]:decision}});
}
export function unreviewDuplicate(session:CleaningSession,groupId:string):CleaningSession{
 const decisions={...session.duplicateDecisions};delete decisions[groupId];return rebuildSession({...session,duplicateDecisions:decisions});
}
