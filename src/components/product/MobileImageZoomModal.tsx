// Stub temporaneo: l'implementazione completa arriva in Task 4.
// Esposto solo per consentire l'import dal MobileImageCarousel mantenendo il typecheck verde.
import type { ReactNode } from "react";

interface MobileImageZoomModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function MobileImageZoomModal({ onClose: _onClose }: MobileImageZoomModalProps): ReactNode {
  return null;
}
