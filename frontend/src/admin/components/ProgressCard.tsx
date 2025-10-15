import React from 'react';
export default function ProgressCard() {
  return (
    <div style={{background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      <h4 style={{marginTop:0}}>Promo Marketing</h4>
      <div style={{fontSize:12,marginBottom:8}}>STARTED ON 28 SEP</div>
      <div style={{height:60,background:'#fee2e2',borderRadius:6,marginBottom:12}} />
      <div style={{fontSize:14,marginBottom:4}}>Current Progress</div>
      <div style={{height:8,background:'#0ea5e9',borderRadius:4,marginBottom:4,width:'44%'}} />
      <div style={{fontSize:12,opacity:0.7}}>44%</div>
    </div>
  );
}