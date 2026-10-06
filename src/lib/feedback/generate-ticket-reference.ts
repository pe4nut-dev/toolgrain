import {feedbackConfig} from '../../config/feedback';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateTicketReference(now=new Date(),bytes:Uint8Array=crypto.getRandomValues(new Uint8Array(4))):string {
 if(bytes.length!==4)throw new Error('Four random bytes are required.');
 const date=now.toISOString().slice(0,10).replaceAll('-','');
 return feedbackConfig.ticketPrefix+'-'+date+'-'+Array.from(bytes,byte=>alphabet[byte%alphabet.length]).join('');
}
