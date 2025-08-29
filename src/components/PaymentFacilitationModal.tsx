import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentFacilitation } from "./PaymentFacilitation";

interface PaymentFacilitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: any;
  onPaymentCompleted: () => void;
}

export const PaymentFacilitationModal = ({ 
  open, 
  onOpenChange, 
  agreement,
  onPaymentCompleted 
}: PaymentFacilitationModalProps) => {
  const handlePaymentCompleted = () => {
    onPaymentCompleted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Payment Transfer
          </DialogTitle>
        </DialogHeader>
        
        {agreement && (
          <PaymentFacilitation
            agreement={agreement}
            onPaymentCompleted={handlePaymentCompleted}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
