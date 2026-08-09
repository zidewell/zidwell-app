"use client";

import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface TransferTypeSelectorProps {
  transferType: "my-account" | "other-bank" | "p2p";
  setTransferType: (value: "my-account" | "other-bank" | "p2p") => void;
}

export default function TransferTypeSelector({
  transferType,
  setTransferType,
}: TransferTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-(--text-primary)">Transfer Type</Label>
      <Select
        value={transferType}
        onValueChange={(value) => {
          setTransferType(value as "my-account" | "other-bank" | "p2p");
        }}
      >
        <SelectTrigger className="bg-(--bg-primary) border-(--border-color) text-(--text-primary)">
          <SelectValue placeholder="Select transfer type" />
        </SelectTrigger>
        <SelectContent className="bg-(--bg-primary) border-(--border-color)">
          <SelectItem value="my-account" className="text-(--text-primary)">
            My Bank Account
          </SelectItem>
          <SelectItem value="other-bank" className="text-(--text-primary)">
            Other Bank Account
          </SelectItem>
          <SelectItem value="p2p" className="text-(--text-primary)">
            Zidwell User (P2P)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}