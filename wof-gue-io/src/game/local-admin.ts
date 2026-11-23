/** Browser-local convenience only. This is not security, an account role, or
 * permission on a multiplayer server; users can alter browser storage. */
type State={verified:boolean;enabled:boolean};
const key=(pid:string)=>`wof.local-admin.v1.${encodeURIComponent(pid)}`;
const store=():Storage|null=>{try{return globalThis.localStorage??null;}catch{return null;}};
export function localAdminState(pid:string):State|null {
 try {const raw=store()?.getItem(key(pid));if(!raw)return null;const v=JSON.parse(raw);return typeof v.verified==='boolean'&&typeof v.enabled==='boolean'?{verified:v.verified,enabled:v.enabled}:null;}catch{return null;}
}
function save(pid:string,state:State):boolean {
 try {const s=store();if(!s)return false;s.setItem(key(pid),JSON.stringify(state));return true;}catch{return false;}
}
export function verifyLocalAdmin(pid:string,id:string):boolean {
 return id==='1123581321345589' && save(pid,{verified:true,enabled:true});
}
export function setLocalAdmin(pid:string,enabled:boolean):boolean {
 const current=localAdminState(pid);if(enabled&&!current?.verified)return false;
 return save(pid,{verified:!!current?.verified,enabled});
}
