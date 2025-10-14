import React from 'react';
export default function AnalyticsCard() {
  return (
    <div style={{background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      <h4 style={{marginTop:0}}>Earnings Report</h4>
      <div style={{fontSize:32,fontWeight:700,margin:'8px 0'}}>$821.04</div>
      <div style={{height:80,background:'#f1f5f9',borderRadius:6,marginTop:8}} />
      <div style={{fontSize:12,marginTop:8}}>Increase your earnings by adding more referrals <a href="#">here</a>.</div>
    </div>
  );
}