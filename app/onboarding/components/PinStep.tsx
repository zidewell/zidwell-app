// app/onboarding/components/PinStep.tsx
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function PinStep({
  pin,
  confirmPin,
  setPin,
  setConfirmPin,
}: {
  pin: string;
  confirmPin: string;
  setPin: (v: string) => void;
  setConfirmPin: (v: string) => void;
}) {
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const mismatch =
    pin.length === 4 && confirmPin.length === 4 && pin !== confirmPin;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Set your transaction PIN
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You'll use this 4-digit PIN to authorize payments and transfers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-gray-700 dark:text-gray-300">
            New PIN
          </Label>
          <div className="relative">
            <Input
              id="pin"
              inputMode="numeric"
              type={show1 ? "text" : "password"}
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-12 text-center text-2xl tracking-[0.6em] pr-10 font-semibold"
            />
            <button
              type="button"
              onClick={() => setShow1((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-gray-700 dark:text-gray-300">
            Confirm PIN
          </Label>
          <div className="relative">
            <Input
              id="confirm"
              inputMode="numeric"
              type={show2 ? "text" : "password"}
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-12 text-center text-2xl tracking-[0.6em] pr-10 font-semibold"
            />
            <button
              type="button"
              onClick={() => setShow2((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {mismatch && <p className="text-sm text-red-500">PINs do not match.</p>}

      <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose a PIN you can remember — avoid birthdays or repeating digits
          like 1111.
        </p>
      </div>
    </div>
  );
}
