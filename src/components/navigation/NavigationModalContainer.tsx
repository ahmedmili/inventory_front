'use client';

import { useNavigationModal } from '@/contexts/NavigationModalContext';
import SuppliersModal from '@/components/suppliers/SuppliersModal';

export default function NavigationModalContainer() {
  const { currentModal, closeModal } = useNavigationModal();

  return (
    <>
      <SuppliersModal isOpen={currentModal === 'suppliers'} onClose={closeModal} />
    </>
  );
}
