import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Avatar } from './Avatar';
import { RoleBadge } from './Badge';
import {
  Bug,
  Plus,
  ChevronDown,
  LogOut,
  FolderPlus,
  Check,
  Shield,
} from 'lucide-react';

export const Navbar = ({ onOpenNewIssue, onOpenNewProject }) => {
  const { user, logout } = useAuth();
  const {
    projects,
    currentProject,
    selectProject,
    currentRole,
    switchRole,
  } = useProject();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Project Selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-150">
                <Bug className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 hidden sm:inline-block">
                Bug<span className="text-indigo-600">Track</span>
              </span>
            </div>

            {/* Project Switcher */}
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-left transition text-xs font-medium text-slate-800"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-semibold text-slate-900 max-w-[130px] truncate">
                  {currentProject ? currentProject.name : 'Select Project'}
                </span>
                {currentProject && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] font-mono text-slate-700">
                    {currentProject.key}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Project Dropdown Menu */}
              {projectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProjectDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Your Projects
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {projects.map((proj) => {
                        const isSelected = currentProject?._id === proj._id;
                        return (
                          <button
                            key={proj._id}
                            onClick={() => {
                              selectProject(proj);
                              setProjectDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition text-left ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700">
                                {proj.key}
                              </span>
                              <span className="truncate">{proj.name}</span>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setProjectDropdownOpen(false);
                          if (onOpenNewProject) onOpenNewProject();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-medium transition"
                      >
                        <FolderPlus className="w-4 h-4" />
                        Create New Project
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions, Role Selector & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Active Role Selector in Navbar */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => switchRole(e.target.value)}
                className="text-xs font-bold text-indigo-950 bg-transparent border-none focus:outline-none cursor-pointer"
                title="Active Role Permission"
              >
                <option value="Admin">Admin</option>
                <option value="Developer">Developer</option>
                <option value="Reporter">Reporter</option>
              </select>
            </div>

            {/* New Issue Button */}
            {currentProject && (
              <button
                onClick={onOpenNewIssue}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm shadow-indigo-200 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Issue</span>
              </button>
            )}

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <Avatar user={user} size="sm" />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {user?.email}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Active Role:</span>
                        <select
                          value={currentRole}
                          onChange={(e) => switchRole(e.target.value)}
                          className="text-xs font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-indigo-700"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Developer">Developer</option>
                          <option value="Reporter">Reporter</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
