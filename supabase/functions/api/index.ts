import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.104.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generatePlan,proteinOptions,rebalanceDay } from '../_shared/engine.ts';
import type { AppData,Profile,Plan,PantryItem,FoodLog,Macros } from '../_shared/domain.ts';
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
function userClient(req:Request){const jwt=req.headers.get('Authorization')?.replace('Bearer ','');if(!jwt)throw new Error('Sign in to use cloud features.');return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${jwt}`}}});}
async function openai(input:string,schema:Record<string,unknown>){const key=Deno.env.get('OPENAI_API_KEY');if(!key)throw new Error('AI interpretation is not configured.');const client=new OpenAI({apiKey:key});const response=await client.responses.create({model:Deno.env.get('OPENAI_MODEL')||'gpt-4.1-mini',input,temperature:.2,text:{format:{type:'json_schema',name:'portion_result',strict:true,schema}} as any});return JSON.parse(response.output_text);}
serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{const {operation,payload={}}=await req.json();const client=userClient(req);const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Your session expired. Sign in again.');
  if(operation==='load'){const {data,error}=await admin.from('user_states').select('state,version').eq('user_id',user.id).maybeSingle();if(error)throw error;return json({state:data?.state??null,version:data?.version??0});}
  if(operation==='save'){const expected=Number(payload.expectedVersion??0);const {data:current}=await admin.from('user_states').select('version').eq('user_id',user.id).maybeSingle();if((current?.version??0)!==expected)return json({error:'This account changed elsewhere. Reload before saving.'},409);const next=(current?.version??0)+1;const {error}=await admin.from('user_states').upsert({user_id:user.id,state:payload.state,version:next,updated_at:new Date().toISOString()});if(error)throw error;return json({version:next});}
  if(operation==='generate'){const plan=generatePlan(payload.profile as Profile,payload.pantry as PantryItem[]|undefined,payload.weekStart,payload.seed);return json({plan});}
  if(operation==='protein'){return json({options:proteinOptions(payload.plan,payload.logs,payload.day,payload.grams,payload.profile,payload.pantry)});}
  if(operation==='rebalance'){return json({plan:rebalanceDay(payload.plan,payload.logs,payload.day,payload.profile,payload.pantry)});}
  if(operation==='interpret'){return json(await openai(`Interpret this restaurant or outside meal for a nutrition tracker. Return an estimate only; if portions or ingredients are missing, ask one concise clarification question. Food entry: ${String(payload.text).slice(0,500)}`,{type:'object',properties:{name:{type:'string'},macros:{anyOf:[{type:'object',properties:{calories:{type:'number'},protein:{type:'number'},carbs:{type:'number'},fat:{type:'number'}},required:['calories','protein','carbs','fat'],additionalProperties:false},{type:'null'}]},question:{type:'string'}},required:['name','macros','question'],additionalProperties:false}));}
  throw new Error('Unknown operation.');
}catch(e){console.error(e);return json({error:(e as Error).message||'Something went wrong.'},400);}});
