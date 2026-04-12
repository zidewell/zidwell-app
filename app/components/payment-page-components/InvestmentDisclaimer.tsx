import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";

interface Props {
  onAccept: () => void;
}

const InvestmentDisclaimer = ({ onAccept }: Props) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] bg-[#023528]/60 flex items-center justify-center p-4">
      <div className="bg-[#f9f6ef] rounded-3xl p-6 max-w-md w-full shadow-2xl">
        {/* Warning Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-yellow-500/15 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2">
          Important Disclaimer
        </h2>

        {/* Warning Box */}
        <div className="rounded-2xl border-2 border-yellow-500/40 bg-yellow-500/5 p-4 mb-5 space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm">
              <strong>Zidwell is a payment facilitator only.</strong> We do not
              operate, manage, or endorse any investment opportunity listed on
              this platform.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm">
              <strong>No guaranteed returns.</strong> Zidwell does not guarantee
              any returns on investments made through this page.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm">
              <strong>No liability.</strong> Zidwell is not liable for any
              losses, fraud, or disputes arising from this transaction.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm">
              <strong>Verify independently.</strong> You must independently
              verify this provider before making any payment.
            </p>
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-[#e9e2d7]/50 border border-[#ded4c3] cursor-pointer mb-5">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed">
            I understand that Zidwell is only a payment facilitator and I have
            independently verified this provider.
          </span>
        </label>

        <Button
          variant="secondary"
          size="lg"
          className="w-full py-5"
          disabled={!accepted}
          onClick={onAccept}
        >
          I Understand, Proceed
        </Button>
      </div>
    </div>
  );
};

export default InvestmentDisclaimer;
