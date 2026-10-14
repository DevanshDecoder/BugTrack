import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Avatar } from '../common/Avatar';
import { Clock, History } from 'lucide-react';

export const ActivityTimeline = ({ issueId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/issues/${issueId}/activities`);
      setActivities(res.data.data || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchActivities();
    }
  }, [issueId]);

  if (loading) {
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        Loading activity trail...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center gap-1">
        <History className="w-5 h-5 text-slate-300" />
        No audit activity recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((act) => (
        <div key={act._id} className="relative flex items-start gap-3">
          <div className="absolute -left-6 mt-1">
            <Avatar user={act.actor} size="xs" />
          </div>

          <div className="flex-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">
                {act.actor?.name || 'Someone'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(act.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-slate-600 mt-1 capitalize text-[11px]">
              {act.details || `Performed ${act.action.replace('_', ' ')}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
