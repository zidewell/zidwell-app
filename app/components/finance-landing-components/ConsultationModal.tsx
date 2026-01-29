import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { ArrowRight, MessageCircle, CheckCircle, Phone } from "lucide-react";
import { Button2 } from "../ui/button2";

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConsultationModal = ({ open, onOpenChange }: ConsultationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-2 border-foreground shadow-brutal p-0 overflow-hidden">
        {/* Header with gold gradient */}
        <div className="bg-linear-to-br from-[#C29307] via-[#C29307] to-[#9a7506] p-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground">
              Expert Consultation
            </DialogTitle>
            <DialogDescription className="text-foreground/80 text-base">
              Get personalized financial guidance from our senior experts
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 space-y-6">
          {/* Price highlight */}
          <div className="bg-secondary border-2 border-foreground p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              One-time consultation fee
            </p>
            <p className="text-4xl font-black text-foreground">₦50,000</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
              What you get:
            </h4>
            <ul className="space-y-3">
              {[
                "One-on-one session with our top finance manager",
                "Deep dive into your business finances",
                "Customized recommendations for your needs",
                "Clear roadmap to get started with Zidwell",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <Button2 className="w-full group">
            Book Consultation
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button2>

          {/* WhatsApp Contact */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Have questions before booking?
            </p>
            <a
              href="https://wa.me/7069175399"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-3 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm flex items-center gap-1">
                  WhatsApp
                </p>
                <p className="text-muted-foreground text-sm">
                  +234 7069 1753 99
                </p>
              </div>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationModal;
