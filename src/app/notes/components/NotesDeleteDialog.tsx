"use client";

import React from 'react';
import ConfirmModal from '@/components/ui/confirm-modal';

interface NotesDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
}

export default function NotesDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
}: NotesDeleteDialogProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      variant="danger"
    />
  );
}
