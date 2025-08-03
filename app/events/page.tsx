'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  image_url: string;
  tier: 'free' | 'silver' | 'gold' | 'platinum';
};

const tierOrder = ['free', 'silver', 'gold', 'platinum'];

export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const userTier = (user?.publicMetadata?.tier as string) || 'free';
  const allowedTiers = tierOrder.slice(0, tierOrder.indexOf(userTier) + 1);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('tier', allowedTiers);

      if (!error) setEvents(data as Event[]);
      setLoading(false);
    };

    if (user) fetchEvents();
  }, [user]);

  if (loading) return <p className="p-4">Loading events...</p>;

  return (
    <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <div key={event.id} className="bg-white p-4 rounded shadow">
          <img src={event.image_url} alt="" className="w-full h-40 object-cover rounded" />
          <h2 className="text-xl font-bold mt-2">{event.title}</h2>
          <p>{event.description}</p>
          <p className="text-sm text-gray-600">{new Date(event.event_date).toDateString()}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded 
            ${event.tier === 'gold' ? 'bg-yellow-400' :
              event.tier === 'silver' ? 'bg-gray-400' :
              event.tier === 'platinum' ? 'bg-purple-400' :
              'bg-green-400'}
          `}>
            {event.tier.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}
