'use client'

const DB_NAME='mugla-senin-butcen-files'
const STORE='project-files'

function openDatabase(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}

export async function saveProjectFiles(projectId:string,files:File[]){
  if(!files.length)return
  const db=await openDatabase()
  await new Promise<void>((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite');const store=transaction.objectStore(STORE);files.forEach((file,index)=>store.put({id:`${projectId}:${index}`,projectId,name:file.name,type:file.type,size:file.size,blob:file}));transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error)})
  db.close()
}
