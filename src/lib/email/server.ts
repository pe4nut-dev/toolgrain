import 'server-only';
import nodemailer from 'nodemailer';
export type TransactionalEmail={to:string;subject:string;html:string;text:string;messageId?:string};
export type EmailResult={status:'sent'|'failed'|'unavailable';code:string};
export function smtpConfig(){
 const {SMTP_HOST:host,SMTP_PORT:portText,SMTP_USER:user,SMTP_PASSWORD:pass,SMTP_FROM_EMAIL:email,SMTP_FROM_NAME:name}=process.env;
 const port=Number(portText);if(!host||!user||!pass||!email||!name||!Number.isInteger(port)||port<1||port>65535||/[\r\n]/.test(host+email+name)||!/^\S+@\S+\.\S+$/.test(email))return null;
 return {host,port,user,pass,email,name};
}
const safeCodes=new Set(['EAUTH','ECONNECTION','ETIMEDOUT','ESOCKET','ETLS','EENVELOPE','EMESSAGE','EDNS']);
export function emailErrorCode(error:unknown){const code=error&&typeof error==='object'&&'code' in error?error.code:null;return typeof code==='string'&&safeCodes.has(code)?code:'EMAIL_FAILURE';}
export async function sendTransactionalEmail(message:TransactionalEmail):Promise<EmailResult>{
 const config=smtpConfig();if(!config)return {status:'unavailable',code:'SMTP_UNAVAILABLE'};
 if(/[\r\n]/.test(message.to+message.subject)||!/^\S+@\S+\.\S+$/.test(message.to))return {status:'failed',code:'EENVELOPE'};
 let transport:ReturnType<typeof nodemailer.createTransport>|undefined;
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  transport=nodemailer.createTransport({host:config.host,port:config.port,secure:config.port===465,requireTLS:config.port!==465,auth:{user:config.user,pass:config.pass},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:10000,logger:false,debug:false});
  const response=await Promise.race([
   transport.sendMail({...message,from:{name:config.name,address:config.email}}),
   new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('SMTP timeout'),{code:'ETIMEDOUT'})),10000);}),
  ]);
  if(!response.accepted?.length)return {status:'failed',code:'EENVELOPE'};
  return {status:'sent',code:'OK'};
 }catch(error){return {status:'failed',code:emailErrorCode(error)};}
 finally{if(timer)clearTimeout(timer);try{transport?.close();}catch{/* Closing a failed SMTP connection must not escape. */}}
}
