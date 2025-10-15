import React from 'react';
export default function OverviewCard() {
  return (
    <div style={{background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      <h3 style={{marginTop:0}}>Overview</h3>
      <div style={{display:'flex',gap:16,marginBottom:16}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>18 Front-end Dev</div>
          <div style={{height:8,background:'#fde68a',borderRadius:4,marginTop:4}} />
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>23 Growth Teams</div>
          <div style={{height:8,background:'#fca5a5',borderRadius:4,marginTop:4}} />
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>12 Backend & Database</div>
          <div style={{height:8,background:'#c4b5fd',borderRadius:4,marginTop:4}} />
        </div>
      </div>
    </div>
  );
}