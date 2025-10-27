const u = 'http://127.0.0.1:4000/api/organization/9110ff78-d453-4461-aa72-eb987374658a/collections';
(async ()=>{
  for (let i=0;i<12;i++){
    try{
      const r = await fetch(u);
      if (r.ok){
        const j = await r.json();
        console.log('---SUCCESS---');
        console.log(JSON.stringify(j, null, 2));
        process.exit(0);
      } else {
        console.log('http status', r.status);
      }
    } catch(e){
      console.log('attempt', i, 'failed', e.message);
    }
    await new Promise(r=>setTimeout(r,1000));
  }
  console.log('---FAILED---');
  process.exit(1);
})();
