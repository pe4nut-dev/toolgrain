export type AuthState={error?:string;message?:string};
export function authErrorMessage(code:unknown,operation:'login'|'signup'|'magic'|'signout'):string{
 if(code==='invalid_credentials')return 'Email or password is incorrect. Please try again.';
 if(code==='email_not_confirmed')return 'Please confirm your email before signing in.';
 if(code==='user_already_exists'||code==='email_exists')return 'An account may already exist for this email. Try signing in.';
 if(code==='weak_password')return 'Use a stronger password with at least 8 characters.';
 if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit')return 'Too many attempts. Please wait before trying again.';
 if(code==='otp_expired')return 'This sign-in link is invalid or has expired. Request a new link.';
 return operation==='signup'?'Your account could not be created. Please try again.':operation==='signout'?'Sign out failed. Please try again.':operation==='magic'?'The sign-in email could not be sent. Please try again.':'Sign in failed. Please try again.';
}
