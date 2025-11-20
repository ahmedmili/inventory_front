'use client';

// Layout is handled by (admin)/layout.tsx
import Link from 'next/link';

const links = [
  { href: '/users/admins', label: 'Administrateurs' },
  { href: '/users/employees', label: 'Employés' },
];

export default function UsersPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-600 mt-2">
          Choisissez un segment pour afficher les profils correspondants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-gray-200 rounded-xl p-6 hover:border-primary-200 hover:shadow transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900">{link.label}</h2>
            <p className="text-sm text-gray-500 mt-2">Voir les détails</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

