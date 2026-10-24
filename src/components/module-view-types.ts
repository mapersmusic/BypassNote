import type { ModuleBridgeMessage } from "@/lib/modules";

export type ModuleViewProps = {
  /** Document HTML autonome produit par `buildModuleDocument`. */
  html: string;
  onClose: () => void;
  /** Messages envoyés par les helpers du module. */
  onBridge: (message: ModuleBridgeMessage) => void;
};
