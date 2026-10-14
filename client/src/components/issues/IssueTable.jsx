import React from 'react';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/Button';
import { Bug, ArrowUpRight } from 'lucide-react';

export const IssueTable = ({ issues, onSelectIssue, onOpenNewIssue }) => {
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={Bug}
        title="No issues found"
        description="Try adjusting your filters or search keywords, or create a new issue for this project."
        actionText="Create Issue"
        onAction={onOpenNewIssue}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Key</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Reporter</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <tr
                key={issue._id}
                onClick={() => onSelectIssue(issue)}
                className="hover:bg-indigo-50/40 cursor-pointer transition group"
              >
                {/* Key */}
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                  {issue.issueKey}
                </td>

                {/* Title & Tags */}
                <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                    {issue.title}
                  </div>
                  {issue.tags && issue.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {issue.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={issue.status} size="xs" />
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4">
                  <PriorityBadge priority={issue.priority} size="xs" />
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4">
                  {issue.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar user={issue.assignee} size="xs" />
                      <span className="text-slate-700 truncate max-w-[100px]">
                        {issue.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>

                {/* Reporter */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <Avatar user={issue.reporter} size="xs" />
                    <span className="text-slate-700 truncate max-w-[100px]">
                      {issue.reporter?.name || 'User'}
                    </span>
                  </div>
                </td>

                {/* Created */}
                <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                  {new Date(issue.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                {/* Action arrow */}
                <td className="py-3.5 px-4 text-right">
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 inline-block transition" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
