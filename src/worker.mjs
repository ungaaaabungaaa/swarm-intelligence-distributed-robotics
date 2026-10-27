import {simulate} from './core.mjs';
self.addEventListener('message',event=>{
 try{self.postMessage({ok:true,report:simulate(event.data)});}
 catch(error){self.postMessage({ok:false,error:error.message});}
});
