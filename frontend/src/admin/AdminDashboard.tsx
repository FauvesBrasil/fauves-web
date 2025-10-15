import React from 'react';
import OverviewCard from '@/admin/components/OverviewCard';
import RecentActivitiesCard from '@/admin/components/RecentActivitiesCard';
import ProgressCard from '@/admin/components/ProgressCard';
import AnalyticsCard from '@/admin/components/AnalyticsCard';
import ReferralCard from '@/admin/components/ReferralCard';

export default function AdminDashboard() {
  return (
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24,maxWidth:1200,margin:'0 auto',padding:24}}>
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <OverviewCard />
        <RecentActivitiesCard />
        <ProgressCard />
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <AnalyticsCard />
        <ReferralCard />
      </div>
    </div>
  );
}
