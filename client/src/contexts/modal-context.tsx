import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Modal state interface for centralized management
interface ModalState {
  [modalId: string]: {
    isOpen: boolean;
    data?: any;
    props?: any;
  };
}

interface ModalContextType {
  // Modal state management
  modalState: ModalState;
  openModal: (modalId: string, data?: any, props?: any) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;
  getModalData: (modalId: string) => any;
  getModalProps: (modalId: string) => any;
  
  // Helper methods for common modal patterns
  openWithData: (modalId: string, data: any) => void;
  updateModalData: (modalId: string, data: any) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalState, setModalState] = useState<ModalState>({});

  const openModal = useCallback((modalId: string, data?: any, props?: any) => {
    setModalState(prev => ({
      ...prev,
      [modalId]: {
        isOpen: true,
        data,
        props
      }
    }));
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setModalState(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        isOpen: false
      }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(modalId => {
        newState[modalId] = {
          ...newState[modalId],
          isOpen: false
        };
      });
      return newState;
    });
  }, []);

  const isModalOpen = useCallback((modalId: string) => {
    return modalState[modalId]?.isOpen || false;
  }, [modalState]);

  const getModalData = useCallback((modalId: string) => {
    return modalState[modalId]?.data;
  }, [modalState]);

  const getModalProps = useCallback((modalId: string) => {
    return modalState[modalId]?.props;
  }, [modalState]);

  const openWithData = useCallback((modalId: string, data: any) => {
    openModal(modalId, data);
  }, [openModal]);

  const updateModalData = useCallback((modalId: string, data: any) => {
    setModalState(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        data: { ...prev[modalId]?.data, ...data }
      }
    }));
  }, []);

  const contextValue: ModalContextType = {
    modalState,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
    getModalProps,
    openWithData,
    updateModalData
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

// Custom hook for using modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Modal IDs for type safety and consistency
export const MODAL_IDS = {
  // Authentication modals
  OTP_VERIFICATION: 'otp-verification',
  NAME_COLLECTION: 'name-collection',
  
  // Admin modals
  SHOP_VIEW: 'shop-view',
  SHOP_EDIT: 'shop-edit',
  SHOP_MANAGEMENT: 'shop-management',
  IMAGE_UPLOAD: 'image-upload',
  USER_EDIT: 'user-edit',
  APPLICATION_EDIT: 'application-edit',
  
  // Shop owner modals
  SHOP_QR: 'shop-qr',
  SHOP_SETTINGS: 'shop-settings',
  
  // Order modals
  ORDER_DETAILS: 'order-details',
  UPLOAD_ORDER: 'upload-order',
  WALKIN_ORDER: 'walkin-order',
  
  // Communication modals
  UNIFIED_CHAT: 'unified-chat',
  SHOP_CONTACT: 'shop-contact',
  
  // Utility modals
  QR_SCANNER: 'qr-scanner',
  NOTIFICATION: 'notification'
} as const;

// Helper hook for specific modal types
export function useAdminModals() {
  const modal = useModal();
  
  return {
    // Shop management modals
    openShopView: (shop: any) => modal.openWithData(MODAL_IDS.SHOP_VIEW, shop),
    openShopEdit: (shop: any) => modal.openWithData(MODAL_IDS.SHOP_EDIT, shop),
    openShopManagement: (shop: any) => modal.openWithData(MODAL_IDS.SHOP_MANAGEMENT, shop),
    openImageUpload: (shop: any) => modal.openWithData(MODAL_IDS.IMAGE_UPLOAD, shop),
    
    // User management modals
    openUserEdit: (user: any) => modal.openWithData(MODAL_IDS.USER_EDIT, user),
    
    // Application management
    openApplicationEdit: (application: any) => modal.openWithData(MODAL_IDS.APPLICATION_EDIT, application),
    
    // Close all admin modals
    closeAll: modal.closeAllModals
  };
}

export function useOrderModals() {
  const modal = useModal();
  
  return {
    openOrderDetails: (order: any) => modal.openWithData(MODAL_IDS.ORDER_DETAILS, order),
    openUploadOrder: (shops?: any[]) => modal.openWithData(MODAL_IDS.UPLOAD_ORDER, { shops }),
    openWalkinOrder: (shops?: any[]) => modal.openWithData(MODAL_IDS.WALKIN_ORDER, { shops }),
    openChat: (orderId: number) => modal.openWithData(MODAL_IDS.UNIFIED_CHAT, { orderId }),
    
    closeAll: modal.closeAllModals
  };
}

export function useAuthModals() {
  const modal = useModal();
  
  return {
    openOTPVerification: (phoneNumber: string, callbacks: any) => 
      modal.openWithData(MODAL_IDS.OTP_VERIFICATION, { phoneNumber, ...callbacks }),
    openNameCollection: (callback: (name: string) => void) => 
      modal.openWithData(MODAL_IDS.NAME_COLLECTION, { callback }),
    
    closeAll: modal.closeAllModals
  };
}