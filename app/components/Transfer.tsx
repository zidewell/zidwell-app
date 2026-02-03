"use client";

import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useUserContextData } from "../context/userData";
import Link from "next/link";
import Swal from "sweetalert2";
import FeeDisplay from "./FeeDisplay";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./ui/command";
import { Check, ChevronsUpDown, Loader2, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import PinPopOver from "./PinPopOver";
import TransactionSummary from "./TransactionSummary";
import confetti from "canvas-confetti";

interface Bank {
  name: string;
  code: string;
}

interface P2PDetails {
  name: string;
  id: string;
}

interface SavedAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  is_default: boolean;
}

interface SavedP2PBeneficiary {
  id: string;
  wallet_id: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
}

type PaymentMethod = "checkout" | "virtual_account" | "bank_transfer" | "p2p";

export default function Transfer() {
  const inputCount = 4;
  const [isOpen, setIsOpen] = useState(false);
  const [transferType, setTransferType] = useState<
    "my-account" | "other-bank" | "p2p"
  >("my-account");
  const [amount, setAmount] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [recepientAcc, setRecepientAcc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [p2pDetails, setP2pDetails] = useState<P2PDetails | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { userData } = useUserContextData();
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  // Popover state for searchable bank select
  const [open, setOpen] = useState(false);
  const [confirmTransaction, setConfirmTransaction] = useState(false);
  const [search, setSearch] = useState("");
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  // New states for saved accounts
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [saveAccount, setSaveAccount] = useState(false);
  const [selectedSavedAccount, setSelectedSavedAccount] =
    useState<SavedAccount | null>(null);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);

  // New states for saved P2P beneficiaries
  const [savedP2PBeneficiaries, setSavedP2PBeneficiaries] = useState<
    SavedP2PBeneficiary[]
  >([]);
  const [saveP2PBeneficiary, setSaveP2PBeneficiary] = useState(false);
  const [selectedSavedP2PBeneficiary, setSelectedSavedP2PBeneficiary] =
    useState<SavedP2PBeneficiary | null>(null);
  const [showSavedP2PBeneficiaries, setShowSavedP2PBeneficiaries] =
    useState(false);

  // Confetti function
  const triggerConfetti = () => {
    // Main burst
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C29307", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 150);

    // Additional bursts for more celebration
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  // Filter banks dynamically
  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle bank selection
  const handleSelectBank = (bank: Bank) => {
    setBankName(bank.name);
    setBankCode(bank.code);
    setOpen(false);
    setSearch("");
  };

  // Fetch user, bank details, saved accounts, and saved P2P beneficiaries
  useEffect(() => {
    if (!userData?.id) return;

    const fetchDetails = async () => {
      setLoading2(true);
      try {
        const [accountRes, banksRes, savedAccountsRes, savedP2PRes] =
          await Promise.all([
            fetch("/api/get-wallet-account-details", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: userData.id }),
            }),
            fetch("/api/banks"),
            fetch(`/api/saved-accounts?userId=${userData.id}`),
            fetch(`/api/save-p2p-beneficiary?userId=${userData.id}`),
          ]);

        const accountData = accountRes.ok ? await accountRes.json() : {};
        const banksData = banksRes.ok ? await banksRes.json() : {};
        const savedAccountsData = savedAccountsRes.ok
          ? await savedAccountsRes.json()
          : {};
        const savedP2PData = savedP2PRes.ok ? await savedP2PRes.json() : {};

        setUserDetails(accountData || {});
        setBanks(banksData?.data || []);
        setSavedAccounts(savedAccountsData.accounts || []);
        setSavedP2PBeneficiaries(savedP2PData.beneficiaries || []);
      } catch (err) {
        console.error("Error fetching details:", err);
        setUserDetails(null);
        setWalletDetails(null);
        setBanks([]);
        setSavedAccounts([]);
        setSavedP2PBeneficiaries([]);
      } finally {
        setLoading2(false);
      }
    };

    fetchDetails();
  }, [userData?.id]);

  // Handle account lookup for other-bank transfers
  useEffect(() => {
    if (transferType !== "other-bank") return;
    if (accountNumber.length !== 10 || !bankCode) return;

    if (accountNumber === userDetails?.bank_details.bank_account_number) {
      setP2pDetails(null);
      setErrors((prev) => ({
        ...prev,
        recepientAcc: "You cannot transfer to your own account.",
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/bank-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankCode, accountNumber }),
        });
        const data = res.ok ? await res.json() : null;
        const acctName = data?.data?.accountName;
        if (acctName) {
          setAccountName(acctName);
          setErrors((prev) => ({ ...prev, accountNumber: "" }));
        } else {
          setAccountName("");
          setErrors((prev) => ({
            ...prev,
            accountNumber: data?.message || "Account lookup failed.",
          }));
        }
      } catch (err: any) {
        setAccountName("");
        setErrors((prev) => ({
          ...prev,
          accountNumber: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [accountNumber, bankCode, transferType]);


  // Handle P2P lookup
  useEffect(() => {
    if (transferType !== "p2p") return;
    if (!recepientAcc || recepientAcc.length < 6) return;

    if (recepientAcc === userDetails?.bank_details.bank_account_number) {
      setP2pDetails(null);
      setErrors((prev) => ({
        ...prev,
        recepientAcc: "You cannot transfer to your own account.",
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/find-user-wallet-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accNumber: recepientAcc }),
        });
        const data = res.ok ? await res.json() : null;

        if (data?.receiverName || data?.full_name) {
          setP2pDetails({
            name: data.receiverName || data.full_name,
            id: data.walletId,
          });
          setErrors((prev) => ({ ...prev, recepientAcc: "" }));
        } else {
          setP2pDetails(null);
          setErrors((prev) => ({
            ...prev,
            recepientAcc: data?.message || "User not found.",
          }));
        }
      } catch (err: any) {
        setP2pDetails(null);
        setErrors((prev) => ({
          ...prev,
          recepientAcc: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [recepientAcc, transferType]);




  // Handle saved account selection
  const handleSelectSavedAccount = (account: SavedAccount) => {
    setSelectedSavedAccount(account);
    setAccountNumber(account.account_number);
    setAccountName(account.account_name);
    setBankCode(account.bank_code);
    setBankName(account.bank_name);
    setShowSavedAccounts(false);
    setSaveAccount(false);
  };

  // Handle saved P2P beneficiary selection
  const handleSelectSavedP2PBeneficiary = (beneficiary: SavedP2PBeneficiary) => {
    setSelectedSavedP2PBeneficiary(beneficiary);
    setRecepientAcc(beneficiary.account_number);
    setP2pDetails({
      name: beneficiary.account_name,
      id: beneficiary.wallet_id,
    });
    setShowSavedP2PBeneficiaries(false);
    setSaveP2PBeneficiary(false);
  };

  // Handle account number change
  const handleAccountNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setAccountNumber(newValue);

    if (
      selectedSavedAccount &&
      newValue !== selectedSavedAccount.account_number
    ) {
      setSelectedSavedAccount(null);
      setAccountName("");
      setBankCode("");
      setBankName("");
    }
  };

  // Handle P2P account number change
  const handleP2PAccountNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setRecepientAcc(newValue);

    if (
      selectedSavedP2PBeneficiary &&
      newValue !== selectedSavedP2PBeneficiary.account_number
    ) {
      setSelectedSavedP2PBeneficiary(null);
      setP2pDetails(null);
    }
  };

  // Save account to profile
  const saveAccountToProfile = async () => {
    if (
      !userData?.id ||
      !accountNumber ||
      !accountName ||
      !bankCode ||
      !bankName
    ) {
      return;
    }

    try {
      const response = await fetch("/api/saved-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          accountNumber,
          accountName,
          bankCode,
          bankName,
          isDefault: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedAccounts((prev) => [...prev, data.account]);
        Swal.fire({
          icon: "success",
          title: "Account Saved!",
          text: "This account has been saved to your profile for future transfers.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: data.message || "Could not save account",
        });
      }
    } catch (error) {
      console.error("Failed to save account:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save account. Please try again.",
      });
    }
  };

  // Save P2P beneficiary to profile
  const saveP2PBeneficiaryToProfile = async () => {
    if (
      !userData?.id ||
      !recepientAcc ||
      !p2pDetails?.name ||
      !p2pDetails?.id
    ) {
      return;
    }

    try {
      const response = await fetch("/api/save-p2p-beneficiary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          walletId: p2pDetails.id,
          accountNumber: recepientAcc,
          accountName: p2pDetails.name,
          isDefault: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedP2PBeneficiaries((prev) => [...prev, data.beneficiary]);
        Swal.fire({
          icon: "success",
          title: "Beneficiary Saved!",
          text: "This user has been saved to your beneficiaries for future transfers.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: data.message || "Could not save beneficiary",
        });
      }
    } catch (error) {
      console.error("Failed to save beneficiary:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save beneficiary. Please try again.",
      });
    }
  };

  const performTransfer = async () => {
    setLoading(true);

    try {
      const payload: any = {
        userId: userData?.id,
        senderName: userDetails.bank_details.bank_account_name,
        senderAccountNumber: userDetails.bank_details.bank_account_number,
        senderBankName: userDetails.bank_details.bank_name,
        amount: Number(amount),
        narration,
        type: transferType,
        pin,
        fee: calculatedFee,
        totalDebit,
      };

      if (transferType === "my-account") {
        payload.bankCode = userDetails.payment_details.p_bank_code;
        payload.bankName = userDetails.payment_details.p_bank_name;
        payload.accountNumber = userDetails.payment_details.p_account_number;
        payload.accountName = userDetails.payment_details.p_account_name;
      }

      if (transferType === "other-bank") {
        payload.bankCode = bankCode;
        payload.bankName = bankName;
        payload.accountNumber = accountNumber;
        payload.accountName = accountName;
      }

      if (transferType === "p2p") {
        payload.receiverAccountId = p2pDetails?.id;
      }

      const endpoint =
        transferType === "p2p" ? "/api/p2p-transfer" : "/api/transfer-balance";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // Save account/beneficiary if requested
        if (saveAccount && !selectedSavedAccount && transferType === "other-bank") {
          await saveAccountToProfile();
        }

        if (saveP2PBeneficiary && !selectedSavedP2PBeneficiary && transferType === "p2p") {
          await saveP2PBeneficiaryToProfile();
        }

        // Trigger confetti animation
        triggerConfetti();

        Swal.fire({
          icon: "success",
          title: "Transfer Successful! 🎉",
          text: "Your transaction has been processed successfully.",
          showConfirmButton: true,
          confirmButtonColor: "#C29307",
          timer: 5000,
          timerProgressBar: true,
          background: "#fefefe",
          didOpen: () => {
            setTimeout(() => {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.3 },
                colors: ["#C29307", "#ffd700"],
              });
            }, 100);
          },
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
          window.location.reload();
        });

        // Reset form
        setAmount("");
        setAccountNumber("");
        setAccountName("");
        setNarration("");
        setRecepientAcc("");
        setBankCode("");
        setBankName("");
        setPin(Array(inputCount).fill(""));
        setErrors({});
        setSaveAccount(false);
        setSaveP2PBeneficiary(false);
        setSelectedSavedAccount(null);
        setSelectedSavedP2PBeneficiary(null);
      } else {
        Swal.fire({
          icon: "error",
          title: "Transfer Failed",
          text: data?.reason || data?.message || "Transfer failed.",
        });

        setErrors({
          form: data?.reason || data?.message || "Transfer failed.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err?.message || "Please try again later.",
      });
      setErrors({ form: err?.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    // Validate amount, narration, recipient fields BEFORE PIN
    if (!amount || Number(amount) < 100)
      newErrors.amount = "Amount must be at least ₦100.";
    if (!narration) newErrors.narration = "Narration is required.";
    if (narration.length > 100) newErrors.narration = "Narration too long.";

    if (
      transferType === "my-account" &&
      (!userDetails.payment_details.p_account_number ||
        !userDetails.payment_details.p_account_name)
    ) {
      newErrors.myAccount = "Your bank details are incomplete.";
    }

    if (transferType === "other-bank") {
      if (!bankCode || !accountNumber || !accountName) {
        newErrors.otherBank = "Please complete all bank fields.";
      }
      if (
        accountNumber &&
        (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber))
      ) {
        newErrors.accountNumber = "Account number must be 10 digits.";
      }
    }

    if (transferType === "p2p" && (!recepientAcc || !p2pDetails?.id)) {
      newErrors.recepientAcc = "Recipient not found or invalid.";
    }

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join("<br>");
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: errorMessages,
      });
      setErrors(newErrors);

      return;
    }
    setConfirmTransaction(true);
  };

  const isDisabled =
    loading ||
    !amount ||
    !narration ||
    Number(amount) <= 0 ||
    (transferType === "my-account" &&
      !userDetails?.payment_details?.p_account_number) ||
    (transferType === "other-bank" &&
      (!bankCode || !accountNumber || !accountName)) ||
    (transferType === "p2p" && (!recepientAcc || !p2pDetails?.id));

const getPaymentMethod = (): PaymentMethod => {
  if (transferType === "p2p") {
    return "p2p";
  }
  if (transferType === "my-account" || transferType === "other-bank") {
    return "bank_transfer";
  }
  return "bank_transfer";
};
  return (
    <>
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={() => {
          if (!pin || pin.length !== 4) {
            Swal.fire({
              icon: "error",
              title: "Invalid PIN",
              text: "PIN must be 4 digits",
            });
            return;
          }

          setIsOpen(false);
          performTransfer();
        }}
      />
      <Card className="shadow-xl border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Transfer Funds
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you want to transfer funds from your wallet.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Transfer Type */}
            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <Select
                value={transferType}
                onValueChange={(value) => {
                  setTransferType(value as "my-account" | "other-bank" | "p2p");
                  setSelectedSavedAccount(null);
                  setSelectedSavedP2PBeneficiary(null);
                  setSaveAccount(false);
                  setSaveP2PBeneficiary(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my-account">My Bank Account</SelectItem>
                  <SelectItem value="other-bank">Other Bank Account</SelectItem>
                  <SelectItem value="p2p">Zidwell User (P2P)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
              {transferType !== "p2p" && (
                <FeeDisplay
                  type="transfer"
                  amount={Number(amount)}
                  paymentMethod="bank_transfer"
                  onFeeCalculated={(fee, total) => {
                    setCalculatedFee(fee);
                    setTotalDebit(total);
                  }}
                />
              )}
              
              {errors.amount && (
                <p className="text-red-600 text-sm">{errors.amount}</p>
              )}
            </div>

            {/* My Account */}
            {transferType === "my-account" && (
              <>
                {loading2 ? (
                  <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-600 animate-pulse">
                    Loading your bank details...
                  </div>
                ) : userDetails?.payment_details.p_account_number &&
                  userDetails?.payment_details.p_account_name ? (
                  <div className="bg-gray-50 p-3 rounded-lg border space-y-1 text-sm">
                    <p>
                      <strong>Bank:</strong>{" "}
                      {userDetails.payment_details.p_bank_name}
                    </p>
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {userDetails.payment_details.p_account_number}
                    </p>
                    <p>
                      <strong>Account Name:</strong>{" "}
                      {userDetails.payment_details.p_account_name}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-lg border text-sm text-red-600">
                    You have not set your bank account details yet.{" "}
                    <Link
                      href="/dashboard/profile"
                      className="text-blue-500 hover:underline"
                    >
                      Click here
                    </Link>{" "}
                    to add them.
                    {errors.myAccount && (
                      <p className="text-red-600 text-sm">{errors.myAccount}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Other Bank */}
            {transferType === "other-bank" && (
              <>
                {/* Saved Accounts Dropdown */}
                {savedAccounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Saved Accounts
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSavedAccounts(!showSavedAccounts)}
                        className="flex items-center gap-1"
                      >
                        <Bookmark className="h-4 w-4" />
                        {showSavedAccounts ? "Hide" : "Show"} Saved
                      </Button>
                    </div>

                    {showSavedAccounts && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        {savedAccounts.map((account) => (
                          <div
                            key={account.id}
                            onClick={() => handleSelectSavedAccount(account)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedSavedAccount?.id === account.id
                                ? "bg-blue-100 border border-blue-300"
                                : "bg-white hover:bg-gray-50 border"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {account.account_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {account.account_number} • {account.bank_name}
                                </p>
                              </div>
                              {account.is_default && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Select Bank Name</Label>

                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex justify-between items-center border rounded px-3 py-2 text-sm"
                        aria-expanded={open}
                      >
                        {bankName || "Search bank..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search bank..."
                          value={search}
                          onValueChange={setSearch}
                          autoFocus
                        />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {filteredBanks.map((bank) => (
                              <CommandItem
                                key={bank.code}
                                onSelect={() => handleSelectBank(bank)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    bankCode === bank.code
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {errors.otherBank && (
                    <p className="text-red-600 text-sm">{errors.otherBank}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Account Number</Label>
                  <Input
                    type="number"
                    maxLength={10}
                    value={accountNumber}
                    onChange={handleAccountNumberChange}
                    placeholder="10-digit account number"
                  />
                  {errors.accountNumber && (
                    <p className="text-red-600 text-sm">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                {lookupLoading && (
                  <p className="text-[#C29307] text-sm flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Verifying account...
                  </p>
                )}
                {accountName && !errors.accountNumber && (
                  <div className="space-y-2">
                    <p className="text-green-600 text-sm font-semibold">
                      Account Name: {accountName}
                    </p>

                    {/* Save Account Toggle */}
                    {!selectedSavedAccount &&
                      accountNumber.length === 10 &&
                      accountName && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <span className="text-sm font-medium text-gray-700">
                            Save to beneficiaries
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveAccount}
                              onChange={(e) => setSaveAccount(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div
                              className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C29307]"
                            ></div>
                          </label>
                        </div>
                      )}
                  </div>
                )}
              </>
            )}

            {/* P2P */}
            {transferType === "p2p" && (
              <>
                {/* Saved P2P Beneficiaries Dropdown */}
                {savedP2PBeneficiaries.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Saved Beneficiaries
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSavedP2PBeneficiaries(!showSavedP2PBeneficiaries)}
                        className="flex items-center gap-1"
                      >
                        <User className="h-4 w-4" />
                        {showSavedP2PBeneficiaries ? "Hide" : "Show"} Saved
                      </Button>
                    </div>

                    {showSavedP2PBeneficiaries && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        {savedP2PBeneficiaries.map((beneficiary) => (
                          <div
                            key={beneficiary.id}
                            onClick={() => handleSelectSavedP2PBeneficiary(beneficiary)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedSavedP2PBeneficiary?.id === beneficiary.id
                                ? "bg-purple-100 border border-purple-300"
                                : "bg-white hover:bg-gray-50 border"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {beneficiary.account_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {beneficiary.account_number} • Zidwell User
                                </p>
                              </div>
                              {beneficiary.is_default && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Account Number (Zidwell User)</Label>
                  <Input
                    type="number"
                    value={recepientAcc}
                    onChange={handleP2PAccountNumberChange}
                    placeholder="0234******"
                  />
                  {errors.recepientAcc && (
                    <p className="text-red-600 text-sm">{errors.recepientAcc}</p>
                  )}
                  {lookupLoading && (
                    <p className="text-[#C29307] text-sm flex items-center gap-2">
                      <Loader2 className="animate-spin" /> Verifying account...
                    </p>
                  )}
                  {p2pDetails?.name && !errors.recepientAcc && (
                    <div className="space-y-2">
                      <p className="text-green-600 text-sm font-semibold">
                        Account Name: {p2pDetails.name}
                      </p>

                      {/* Save P2P Beneficiary Toggle */}
                      {!selectedSavedP2PBeneficiary &&
                        recepientAcc.length >= 6 &&
                        p2pDetails?.name && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <span className="text-sm font-medium text-gray-700">
                              Save to beneficiaries
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveP2PBeneficiary}
                                onChange={(e) => setSaveP2PBeneficiary(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div
                                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                  peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                  after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C29307]"
                              ></div>
                            </label>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Narration */}
            <div className="space-y-1">
              <Label>
                Narration{" "}
                <span className="text-sm">(purpose of transaction)</span>
              </Label>
              <Input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="e.g. Food"
                maxLength={100}
              />
            </div>
            {errors.narration && (
              <p className="text-red-600 text-sm">{errors.narration}</p>
            )}

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-[#C29307] hover:bg-[#b28a06] text-white md:w-[200px]"
            >
              {loading ? "Processing..." : "Transfer Now"}
            </Button>
          </form>
        </CardContent>
      </Card>
     <TransactionSummary
  senderName={`${userData?.firstName} ${userData?.lastName}`}
  senderAccount={userDetails?.bank_details?.bank_account_number || "N/A"}
  recipientName={
    // For P2P: use p2pDetails.name
    // For other-bank: use accountName (from bank lookup)
    // For my-account: use your own payment details
    transferType === "p2p"
      ? p2pDetails?.name
      : transferType === "other-bank"
      ? accountName
      : userDetails?.payment_details?.p_account_name
  }
  recipientAccount={
    // For P2P: use recepientAcc
    // For other-bank: use accountNumber
    // For my-account: use your own account number
    transferType === "p2p"
      ? recepientAcc
      : transferType === "other-bank"
      ? accountNumber
      : userDetails?.payment_details?.p_account_number
  }
  recipientBank={
    // For P2P: always show "Zidwell"
    // For other-bank: use bankName (selected bank)
    // For my-account: use your own bank name
    transferType === "p2p"
      ? "Zidwell"
      : transferType === "other-bank"
      ? bankName
      : userDetails?.payment_details?.p_bank_name
  }
  purpose={narration}
  amount={amount}
  confirmTransaction={confirmTransaction}
  onBack={() => setConfirmTransaction(false)}
  onConfirm={() => {
    setConfirmTransaction(false);
    setIsOpen(true);
  }}
  paymentMethod={getPaymentMethod()}
  isP2P={transferType === "p2p"}
/>
    </>
  );
}