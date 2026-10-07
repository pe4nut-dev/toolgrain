import {afterEach,describe,expect,it,vi} from 'vitest';
import {sendTransactionalEmail} from '../src/lib/email/server';
vi.mock('server-only',()=>({}));
afterEach(()=>vi.unstubAllEnvs());
describe('real Nodemailer SMTP failure boundary',()=>{
 it('a real SMTP connection failure returns a safe result, without sending mail',async()=>{
  // Reserved .invalid domain cannot deliver mail; no real account credentials or recipient.
  for(const [key,value] of Object.entries({SMTP_HOST:'toolgrain-smtp-test.invalid',SMTP_PORT:'465',SMTP_USER:'fixture@example.invalid',SMTP_PASSWORD:'fixture-only',SMTP_FROM_EMAIL:'fixture@example.invalid',SMTP_FROM_NAME:'Toolgrain'}))vi.stubEnv(key,value);
  const result=await sendTransactionalEmail({to:'recipient@example.invalid',subject:'Offline SMTP regression',html:'<p>Fixture</p>',text:'Fixture'});
  expect(result.status).toBe('failed');expect(result.code).toMatch(/^(EDNS|ECONNECTION|ESOCKET|ETIMEDOUT|EMAIL_FAILURE)$/);
  expect(JSON.stringify(result)).not.toMatch(/fixture-only|fixture@|recipient@/);
 },15000);
});
