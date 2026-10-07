import 'server-only';
import Stripe from 'stripe';
import {stripeConfig} from './config';
export function getStripe(){const config=stripeConfig();return config?new Stripe(config.secret,{maxNetworkRetries:2,timeout:20000}):null;}
