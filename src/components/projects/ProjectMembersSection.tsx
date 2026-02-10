'use client';

import { PlusIcon, TrashIcon } from '@/components/icons';

export interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: { code: string };
  };
}

interface ProjectMembersSectionProps {
  members: ProjectMember[];
  canUpdate: boolean;
  onAddMember: () => void;
  onRemoveMember: (member: ProjectMember) => void;
}

export default function ProjectMembersSection({
  members,
  canUpdate,
  onAddMember,
  onRemoveMember,
}: ProjectMembersSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          <span>Membres ({members?.length || 0})</span>
        </h2>
        {canUpdate && (
          <button
            onClick={onAddMember}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        )}
      </div>
      {members && members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {member.user.firstName} {member.user.lastName}
                </div>
                <div className="text-sm text-gray-500">{member.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-lg text-xs font-bold border border-blue-300 shadow-sm">
                  {member.role}
                </span>
                {canUpdate && (
                  <button
                    onClick={() => onRemoveMember(member)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Aucun membre assigné</p>
          <p className="text-sm text-gray-500 mt-1">Ajoutez des membres pour collaborer sur ce projet</p>
        </div>
      )}
    </div>
  );
}
