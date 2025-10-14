import React from 'react';
export default function ReferralCard() {
  const referrals = [
    { name: 'Robert Fox', date: '23 May', status: 'Pending', value: '$109.03' },
    { name: 'Anna Peterson', date: '18 May', status: 'Completed', value: '$109.03' },
    { name: 'Anna Peterson', date: '14 May', status: 'Pending', value: '$109.03' },
    { name: 'Anna Peterson', date: '3 May', status: 'Completed', value: '$109.03' },
  ];
  return (
    <div style={{background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      <h4 style={{marginTop:0}}>Earnings by Referral</h4>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <input style={{flex:1,padding:8}} defaultValue={'https://example.com/ref/1044'} />
        <button>Copy</button>
      </div>
      <div style={{marginBottom:8}}>
        <span style={{fontSize:12,marginRight:8}}>SaaS</span>
        <span style={{fontSize:12,marginRight:8}}>Ecommerce</span>
        <span style={{fontSize:12,marginRight:8}}>Pharmacy</span>
        <span style={{fontSize:12}}>AI</span>
      </div>
      <ul style={{listStyle:'none',padding:0,margin:0}}>
        {referrals.map((r,i)=>(
          <li key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<referrals.length-1?'1px solid #eee':'none'}}>
            <span>{r.name}</span>
            <span style={{opacity:0.7}}>{r.date}</span>
            <span style={{fontSize:12,padding:'2px 8px',borderRadius:4,background:r.status==='Completed'?'#d1fae5':'#fee2e2',color:r.status==='Completed'?'#065f46':'#991b1b'}}>{r.status}</span>
            <span style={{fontWeight:600}}>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}