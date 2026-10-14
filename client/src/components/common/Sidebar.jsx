import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Settings,
  FolderPlus,
  ShieldAlert,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RoleBadge } from './Badge';

export const Sidebar = ({ onOpenNewProject }) => {
  const { currentProject, currentRole, switchRole } = useProject();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/kanban',
      label: 'Kanban Board',
      icon: KanbanSquare,
    },
    {
      to: '/issues',
      label: 'All Issues',
      icon: ListTodo,
    },
    {
      to: '/settings',
      label: 'Team & Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4 flex-shrink-0 overflow-y-auto">
      {/* Active Project Card */}
      {currentProject ? (
        <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Project
            </span>
            <RoleBadge role={currentRole} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 truncate" title={currentProject.name}>
            {currentProject.name}
          </h2>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Key: {currentProject.key}
            </span>
          </div>

          {/* Quick Create Project Button */}
          <button
            onClick={onOpenNewProject}
            className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition shadow-2xs"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            + New Project
          </button>
        </div>
      ) : (
        <div className="mb-5 p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
          <p className="text-xs text-slate-500 mb-2">No active project</p>
          <button
            onClick={onOpenNewProject}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="space-y-1 flex-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Role Switcher */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1 text-indigo-700">
              <ShieldAlert className="w-3.5 h-3.5" />
              Active Role
            </span>
            <RoleBadge role={currentRole} />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-indigo-800 font-medium whitespace-nowrap">Switch to:</span>
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value)}
              className="w-full text-xs font-bold px-2 py-1 rounded-lg border border-indigo-200 bg-white text-indigo-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Admin">Admin</option>
              <option value="Developer">Developer</option>
              <option value="Reporter">Reporter</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
};
