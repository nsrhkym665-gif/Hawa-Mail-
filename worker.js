const BLAZE="https://api.blazeapi.org/paid/v1";
const MODEL="tok/deepseek-r1";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json; charset=utf-8"};

function json(x,s=200){return new Response(JSON.stringify(x),{status:s,headers:CORS});}

export default {
 async fetch(request,env){
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:CORS});
  const u=new URL(request.url);
  if(request.method==="GET") return json({ok:true,service:"Hawa AI",status:"online",model:MODEL});
  if(u.pathname!=="/chat"||request.method!=="POST") return json({error:"Not found"},404);
  if(!env.BLAZE_KEY) return json({error:"BLAZE_KEY is not configured"},500);
  try{
   const body=await request.json();
   const messages=Array.isArray(body.messages)?body.messages.slice(-12):[];
   if(!messages.length) return json({error:"messages is required"},400);
   const clean=messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.content||"").slice(0,6000)}));
   const r=await fetch(BLAZE+"/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+env.BLAZE_KEY,"Content-Type":"application/json"},body:JSON.stringify({
    model:MODEL,
    messages:[{role:"system",content:"You are Hawa AI. Answer naturally and helpfully. The user may speak Arabic or English; reply in the user's language."},...clean],
    max_tokens:700
   })});
   const data=await r.json();
   if(!r.ok) return json({error:data?.error?.message||data?.message||"BlazeAPI request failed",details:data?.error||null},r.status);
   return json({answer:data?.choices?.[0]?.message?.content||"No answer returned.", reply:data?.choices?.[0]?.message?.content||"No answer returned."});
  }catch(e){return json({error:e.message||"Server error"},500);}
 }
};
