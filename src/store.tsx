import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { DEFAULT_PROFILE, dayDate, localDate, uid, weekStart } from '../supabase/functions/_shared/domain';
import type { AppData, Profile, Plan, PlannedMeal } from '../supabase/functions/_shared/domain';
import { generatePlan, mealNutrition } from '../supabase/functions/_shared/engine';
import { recipeById } from '../supabase/functions/_shared/catalog';
import { api, supabase } from './lib/backend';
export function sampleData():AppData {
  const profile=structuredClone(DEFAULT_PROFILE);
  const plan=generatePlan(profile,[{ingredientId:'oil',amount:'enough'},{ingredientId:'rice',amount:400}]);
  const today=(new Date().getDay()+6)%7;
  // A stable editorial example for the opening dashboard, backed by actual recipes.
  const ids=['yogurt-oats','chicken-bowl','salmon','yogurt-snack'];
  plan.meals=plan.meals.map(m=>m.day===today?{...m,recipeId:ids[['Breakfast','Lunch','Dinner','Snack'].indexOf(m.type)],portion:m.type==='Dinner'?1.25:1}:m);
  const logs=plan.meals.filter(m=>m.day===today&&['Breakfast','Lunch'].includes(m.type)).map(m=>({id:uid(),date:localDate(),mealId:m.id,name:recipeById[m.recipeId].name,macros:mealNutrition(m),estimated:false}));
  return {profile,plan,logs,pantry:[{ingredientId:'oil',amount:'enough'},{ingredientId:'rice',amount:400}],purchased:{},manual:[],favorites:[],completedDays:[],weights:[],actualSpend:null,personalized:false};
}
type Store={ data:AppData; ready:boolean; session:Session|null; sync:string; cloudVersion:number; toast:string; notify:(s:string)=>void; commit:(fn:(d:AppData)=>AppData,undo?:boolean)=>void; undo:()=>void; canUndo:boolean; retry:()=>Promise<void>; generate:(profile:Profile)=>Promise<void>; logMeal:(m:PlannedMeal)=>void; setPlan:(plan:Plan)=>void; reset:()=>Promise<void>; };
const Context=createContext<Store|null>(null);
export function Provider({children}:{children:React.ReactNode}) {
  const [data,setData]=useState<AppData>(sampleData),[ready,setReady]=useState(false),[session,setSession]=useState<Session|null>(null),[sync,setSync]=useState(''),[toast,setToast]=useState(''),[canUndo,setCanUndo]=useState(false);
  const current=useRef(data),previous=useRef<AppData|null>(null),version=useRef(0),queue=useRef(Promise.resolve()),sessionRef=useRef<Session|null>(null),cloudLoaded=useRef(false),pending=useRef(false),generation=useRef(0);
  const notify=(s:string)=>setToast(s);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t);},[toast]);
  const persist=(next:AppData)=>{ current.current=next;setData(next); const key=sessionRef.current?`portion:user:${sessionRef.current.user.id}`:'portion:sample';void AsyncStorage.setItem(key,JSON.stringify(next)).catch(()=>setSync('Device storage unavailable')); };
  useEffect(()=>{let active=true;AsyncStorage.getItem('portion:sample').then(raw=>{if(raw&&active){try{const parsed=JSON.parse(raw);if(parsed.plan?.weekStart===weekStart())persist(parsed);}catch{}}}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
  useEffect(()=>{
    if(!supabase)return;
    const load=async(s:Session|null)=>{
      const id=++generation.current;sessionRef.current=s;setSession(s);cloudLoaded.current=false;pending.current=false;version.current=0;
      if(!s){setSync('');return;}
      setSync('Connecting…');
      const cached=await AsyncStorage.getItem(`portion:user:${s.user.id}`);if(id!==generation.current)return;
      if(cached){try{persist(JSON.parse(cached));}catch{}}
      try { const result=await api<{state:AppData|null;version:number}>('load');if(id!==generation.current)return;version.current=result.version;cloudLoaded.current=true;if(result.state)persist(result.state);setSync('Saved to your account'); }
      catch(e){if(id===generation.current)setSync('Offline · cloud changes paused');}
    };
    void supabase.auth.getSession().then(({data})=>load(data.session));
    const {data:subscription}=supabase.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(()=>void load(s),0);});
    return()=>subscription.subscription.unsubscribe();
  },[]);
  const save=async(next:AppData)=>{
    if(!sessionRef.current||!next.personalized)return;
    if(!cloudLoaded.current)throw new Error('Reconnect before saving cloud changes.');
    setSync('Saving…');
    const result=await api<{version:number}>('save',{state:next,expectedVersion:version.current,requestId:uid()});version.current=result.version;setSync('Saved to your account');
  };
  const commit=(fn:(d:AppData)=>AppData,keepUndo=true)=>{
    const old=current.current, next=fn(old);
    if(keepUndo){previous.current=old;setCanUndo(true);}persist(next);
    if(sessionRef.current&&next.personalized){queue.current=queue.current.then(async()=>{if(pending.current)return;try{await save(next);}catch(e){pending.current=true;setSync('Unsaved changes · tap to retry');notify((e as Error).message);}});}
  };
  const retry=async()=>{
    if(!sessionRef.current)return;
    if(!cloudLoaded.current){const remote=await api<{state:AppData|null;version:number}>('load');version.current=remote.version;cloudLoaded.current=true;}
    try{await save(current.current);pending.current=false;}catch(e){notify((e as Error).message);setSync('Sync conflict · reopen your account to reload');}
  };
  const generate=async(profile:Profile)=>{
    await queue.current;
    let plan:Plan;
    if(sessionRef.current){const result=await api<{plan:Plan}>('generate',{profile,pantry:current.current.pantry,weekStart:weekStart(),seed:Date.now()%100});plan=result.plan;}
    else {await new Promise(resolve=>setTimeout(resolve,650));plan=generatePlan(profile,current.current.pantry,weekStart(),Date.now()%100);}
    commit(d=>({...d,profile,plan,logs:d.personalized?d.logs:[],purchased:{},manual:[],completedDays:d.personalized?d.completedDays:[],personalized:true}));
  };
  const undo=()=>{if(!previous.current)return;const old=previous.current;previous.current=null;setCanUndo(false);commit(()=>old,false);notify('Change undone');};
  const logMeal=(m:PlannedMeal)=>commit(d=>{
    const existing=d.logs.find(l=>l.mealId===m.id);return {...d,logs:existing?d.logs.filter(l=>l.id!==existing.id):[...d.logs,{id:uid(),date:dayDate(d.plan.weekStart,m.day),mealId:m.id,name:recipeById[m.recipeId].name,macros:mealNutrition(m),estimated:false}]};
  });
  const reset=async()=>{await supabase?.auth.signOut();sessionRef.current=null;previous.current=null;setCanUndo(false);persist(sampleData());};
  return <Context.Provider value={{data,ready,session,sync,cloudVersion:version.current,toast,notify,commit,undo,canUndo,retry,generate,logMeal,setPlan:plan=>commit(d=>({...d,plan})),reset}}>{children}</Context.Provider>;
}
export function useStore(){const c=useContext(Context);if(!c)throw new Error('Missing app provider');return c;}
