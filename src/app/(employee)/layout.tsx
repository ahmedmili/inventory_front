'use client';

import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeeLayout>{children}</EmployeeLayout>;
}

