import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminOrders(){
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  useEffect(()=>{(async ()=>{
    if(!token) return;
    const res = await fetch(`/api/admin/orders?page=${page}&perPage=20`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders || []);
  })()},[token,page]);

  return <div>
    <h1>Pedidos</h1>
    <table style={{width:'100%'}}>
      <thead><tr><th>Code</th><th>Email</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>
        {orders.map(o=> <tr key={o.id}><td>{o.code}</td><td>{o.purchaserEmail}</td><td>{o.totalAmount}</td><td>{o.paymentStatus}</td><td>{new Date(o.createdAt).toLocaleString()}</td></tr>)}
      </tbody>
    </table>
  </div>;
}
