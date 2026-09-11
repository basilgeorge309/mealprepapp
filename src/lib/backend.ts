import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configured=Boolean(url&&key);
const storage={getItem:(key:string)=>Platform.OS==='web'?AsyncStorage.getItem(key):SecureStore.getItemAsync(key),setItem:(key:string,value:string)=>Platform.OS==='web'?AsyncStorage.setItem(key,value):SecureStore.setItemAsync(key,value),removeItem:(key:string)=>Platform.OS==='web'?AsyncStorage.removeItem(key):SecureStore.deleteItemAsync(key)};
export const supabase=configured?createClient(url!,key!,{auth:{storage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}}):null;
export async function api<T>(operation:string,payload:unknown={}):Promise<T> {
  if(!supabase)throw new Error('Cloud services are not configured. You can explore everything in sample mode.');
  const {data,error}=await supabase.functions.invoke('api',{body:{operation,payload}});
  if(error) {
    const body=await error.context?.json?.().catch(()=>null);
    throw new Error(body?.error??error.message??'Could not connect. Your changes are saved on this device.');
  }
  if(data.error)throw new Error(data.error);return data as T;
}
