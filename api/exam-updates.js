const endpoint = 'https://script.google.com/macros/s/AKfycbwo55lsCSoRC2N8bRR64qayvOSbT-trVBHqp3TYfdyBEWV90MprV7z858LU7Y39vLaK/exec?format=json';
export default async function handler(req,res){
 if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
 try {const r=await fetch(endpoint,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Upstream HTTP '+r.status);const data=await r.json();if(!Array.isArray(data.records))throw Error('Invalid upstream response');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');return res.status(200).json({records:data.records.map(({id,university,title,courses,semester,type,published,examPeriod,sortDate,url,source})=>({id,university,title,courses,semester,type,published,examPeriod,sortDate,url,source}))});}catch{res.setHeader('Cache-Control','no-store');return res.status(502).json({error:'Exam updates temporarily unavailable'});}
}
