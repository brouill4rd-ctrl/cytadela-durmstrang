import React, { useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { AuthModal } from '../components/AuthModal';

export const CharacterCreationModal = ({ isOpen, onClose }) => {
  const { openAuthModal } = useSchool();

  useEffect(() => {
    if (isOpen) {
      if (openAuthModal) {
        openAuthModal('register');
      }
      if (onClose) {
        onClose();
      }
    }
  }, [isOpen, openAuthModal, onClose]);

  return null;
};
