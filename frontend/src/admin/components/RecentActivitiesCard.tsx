import React from 'react';
export default function RecentActivitiesCard() {
  const activities = [
    { name: 'Apple Music', date: '2 dias atrás', value: '-$39.40' },
    { name: 'Google Cloud', date: '3 dias atrás', value: '-$39.40' },
    { name: 'Amazon', date: '5 dias atrás', value: '-$39.40' },
  ];
  return (
    <div style={{background:'#fff',padding:20,borderRadius:8,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      <h4 style={{marginTop:0}}>Recent Activities</h4>
      <ul style={{listStyle:'none',padding:0,margin:0}}>
        {activities.map((a,i)=>(
          <li key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<activities.length-1?'1px solid #eee':'none'}}>
            <span>{a.name}</span>
            <span style={{opacity:0.7}}>{a.date}</span>
            <span style={{fontWeight:600}}>{a.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}