'use client';

import { useModal } from '@/contexts/ModalContext';
import ModalItem from './ModalItem';

export default function ModalContainer() {
  const { modals, closeModal } = useModal();

  return (
    <>
      {modals.map((modal) => (
        <ModalItem key={modal.id} modal={modal} onClose={() => closeModal(modal.id)} />
      ))}
    </>
  );
}

