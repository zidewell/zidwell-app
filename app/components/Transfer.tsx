"use client";

import { useState, useEffect, useRef } from "react";
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
import { Check, ChevronsUpDown, Loader2, Bookmark, User, Eye, EyeOff, Landmark, CopyIcon, Star } from "lucide-react";
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

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  type: string;
  isCustom: boolean;
  is_favorite?: boolean;
  favorite_order?: number;
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
  const { userData, balance, lifetimeBalance } = useUserContextData();
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [open, setOpen] = useState(false);
  const [confirmTransaction, setConfirmTransaction] = useState(false);
  const [search, setSearch] = useState("");
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [saveAccount, setSaveAccount] = useState(false);
  const [selectedSavedAccount, setSelectedSavedAccount] = useState<SavedAccount | null>(null);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const [savedP2PBeneficiaries, setSavedP2PBeneficiaries] = useState<SavedP2PBeneficiary[]>([]);
  const [saveP2PBeneficiary, setSaveP2PBeneficiary] = useState(false);
  const [selectedSavedP2PBeneficiary, setSelectedSavedP2PBeneficiary] = useState<SavedP2PBeneficiary | null>(null);
  const [showSavedP2PBeneficiaries, setShowSavedP2PBeneficiaries] = useState(false);
  const [showAlltime, setShowAlltime] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  
  // State for expense categories
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenseCategory, setExpenseCategory] = useState<string>("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  // Track pending favorite updates to avoid race conditions
  const pendingFavoritesRef = useRef<Set<string>>(new Set());

  // Polling refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertShownRef = useRef<boolean>(false);
  const currentTransactionIdRef = useRef<string | null>(null);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const resetForm = () => {
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
    setExpenseCategory("");
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    currentTransactionIdRef.current = null;
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e"],
      });
    }, 150);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  const startPolling = (transactionId: string) => {
    stopPolling();
    alertShownRef.current = false;
    currentTransactionIdRef.current = transactionId;
    
    let attempts = 0;
    const maxAttempts = 45;
    const pollIntervalMs = 2000;

    const pollStatus = async () => {
      if (currentTransactionIdRef.current !== transactionId) {
        console.log("Transaction ID mismatch, stopping polling");
        return;
      }

      if (alertShownRef.current) {
        console.log("Alert already shown, stopping polling");
        stopPolling();
        return;
      }

      if (attempts >= maxAttempts) {
        console.log("Max polling attempts reached");
        stopPolling();
        if (Swal.isVisible() && !alertShownRef.current) {
          alertShownRef.current = true;
          Swal.close();
          Swal.fire({
            icon: "warning",
            title: "Still Processing",
            text: "Your transfer is taking longer than expected. You will receive an email confirmation once completed.",
            confirmButtonColor: "var(--color-accent-yellow)",
          });
        }
        return;
      }

      attempts++;

      try {
        console.log(`Polling attempt ${attempts} for transaction ${transactionId}`);
        
        const res = await fetch(`/api/transaction/status?transactionId=${transactionId}`);
        
        if (!res.ok) {
          console.error(`Polling failed with status: ${res.status}`);
          return;
        }
        
        const data = await res.json();
        console.log("Polling response:", { status: data.status, transactionId });

        if (alertShownRef.current) return;

        if (data.status === "success") {
          console.log("Transaction successful!");
          alertShownRef.current = true;
          stopPolling();
          
          if (Swal.isVisible()) Swal.close();
          
          triggerConfetti();
          
          await Swal.fire({
            icon: "success",
            title: "Transfer Successful! 🎉",
            text: "Your transaction has been processed successfully.",
            showConfirmButton: true,
            confirmButtonColor: "var(--color-accent-yellow)",
            timer: 5000,
            timerProgressBar: true,
          });
          
          resetForm();
          setConfirmTransaction(false);
          setIsOpen(false);
          
        } 
        else if (data.status === "failed") {
          console.log("Transaction failed!");
          alertShownRef.current = true;
          stopPolling();
          
          if (Swal.isVisible()) Swal.close();
          
          await Swal.fire({
            icon: "error",
            title: "Transfer Failed",
            text: data.message || "Your transfer could not be completed. Your wallet was not charged.",
            confirmButtonColor: "var(--color-accent-yellow)",
          });
          
          setConfirmTransaction(false);
          setIsOpen(false);
        }
        else {
          console.log("Still processing...");
        }
        
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, pollIntervalMs);
  };

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectBank = (bank: Bank) => {
    setBankName(bank.name);
    setBankCode(bank.code);
    setOpen(false);
    setSearch("");
  };

  // Fetch expense categories from database
  const fetchExpenseCategories = async () => {
    if (!userData?.id) return;
    
    setLoadingCategories(true);
    try {
      const response = await fetch(`/api/journal/categories?userId=${userData.id}`);
      const data = await response.json();
      
      // Filter only expense categories
      const expenseCats = data.filter((cat: ExpenseCategory) => cat.type === 'expense');
      setExpenseCategories(expenseCats);
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Toggle favorite category with IMMEDIATE UI update
  const toggleFavoriteCategory = async (category: ExpenseCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent multiple simultaneous updates for the same category
    if (pendingFavoritesRef.current.has(category.id)) {
      return;
    }
    
    const newFavoriteStatus = !category.is_favorite;
    
    // IMMEDIATE UI UPDATE - Optimistic update
    setExpenseCategories(prev =>
      prev.map(cat =>
        cat.id === category.id
          ? { ...cat, is_favorite: newFavoriteStatus, favorite_order: newFavoriteStatus ? Date.now() : 0 }
          : cat
      )
    );
    
    // Mark as pending
    pendingFavoritesRef.current.add(category.id);
    
    // Call API in background
    try {
      const response = await fetch(`/api/journal/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          name: category.name,
          icon: category.icon,
          type: category.type,
          is_favorite: newFavoriteStatus,
          favorite_order: newFavoriteStatus ? Date.now() : 0,
        }),
      });
      
      if (!response.ok) {
        // Revert on error
        setExpenseCategories(prev =>
          prev.map(cat =>
            cat.id === category.id
              ? { ...cat, is_favorite: !newFavoriteStatus, favorite_order: !newFavoriteStatus ? 0 : category.favorite_order }
              : cat
          )
        );
        console.error("Failed to update favorite status");
      }
    } catch (error) {
      // Revert on error
      setExpenseCategories(prev =>
        prev.map(cat =>
          cat.id === category.id
            ? { ...cat, is_favorite: !newFavoriteStatus, favorite_order: !newFavoriteStatus ? 0 : category.favorite_order }
            : cat
        )
      );
      console.error("Failed to update favorite:", error);
    } finally {
      pendingFavoritesRef.current.delete(category.id);
    }
  };

  // Sort categories: favorites first, then by name
  const getSortedCategories = () => {
    return [...expenseCategories].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      if (a.is_favorite && b.is_favorite) {
        return (a.favorite_order || 0) - (b.favorite_order || 0);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const filteredCategories = getSortedCategories().filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSelectCategory = (category: ExpenseCategory) => {
    setExpenseCategory(category.id);
    // Auto-fill narration with category name if narration is empty
    if (!narration) {
      setNarration(category.name);
    }
    setShowCategoryDropdown(false);
    setCategorySearch("");
  };

  const getSelectedCategoryName = () => {
    const category = expenseCategories.find(c => c.id === expenseCategory);
    return category ? category.name : "Select category";
  };

  const getSelectedCategoryIcon = () => {
    const category = expenseCategories.find(c => c.id === expenseCategory);
    return category ? category.icon : "📦";
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
    fetchExpenseCategories();
  }, [userData?.id]);

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

  const handleSelectSavedAccount = (account: SavedAccount) => {
    setSelectedSavedAccount(account);
    setAccountNumber(account.account_number);
    setAccountName(account.account_name);
    setBankCode(account.bank_code);
    setBankName(account.bank_name);
    setShowSavedAccounts(false);
    setSaveAccount(false);
  };

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

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAccountNumber(newValue);
    if (selectedSavedAccount && newValue !== selectedSavedAccount.account_number) {
      setSelectedSavedAccount(null);
      setAccountName("");
      setBankCode("");
      setBankName("");
    }
  };

  const handleP2PAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRecepientAcc(newValue);
    if (selectedSavedP2PBeneficiary && newValue !== selectedSavedP2PBeneficiary.account_number) {
      setSelectedSavedP2PBeneficiary(null);
      setP2pDetails(null);
    }
  };

  const saveAccountToProfile = async () => {
    if (!userData?.id || !accountNumber || !accountName || !bankCode || !bankName) return;
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

  const saveP2PBeneficiaryToProfile = async () => {
    if (!userData?.id || !recepientAcc || !p2pDetails?.name || !p2pDetails?.id) return;
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

  const performTransfer = async (submittedPin: string) => {
    setLoading(true);

    try {
      const selectedCategory = expenseCategories.find(c => c.id === expenseCategory);
      
      const payload: any = {
        userId: userData?.id,
        senderName: userDetails.bank_details.bank_account_name,
        senderAccountNumber: userDetails.bank_details.bank_account_number,
        senderBankName: userDetails.bank_details.bank_name,
        amount: Number(amount),
        narration,
        pin: submittedPin,
        type: transferType,
        fee: calculatedFee,
        totalDebit,
        category: selectedCategory?.name || narration,
        categoryId: expenseCategory,
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

      const endpoint = transferType === "p2p" ? "/api/p2p-transfer" : "/api/transfer-balance";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.status === "processing") {
        alertShownRef.current = false;
        
        Swal.fire({
          icon: "info",
          title: "Processing Transfer",
          text: "Your transfer is being processed. Please wait...",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        if (data.transactionId) startPolling(data.transactionId);
        
        setLoading(false);
        return { success: true };
      } 
      else if (res.ok) {
        if (saveAccount && !selectedSavedAccount && transferType === "other-bank") {
          await saveAccountToProfile();
        }
        if (saveP2PBeneficiary && !selectedSavedP2PBeneficiary && transferType === "p2p") {
          await saveP2PBeneficiaryToProfile();
        }

        triggerConfetti();

        await Swal.fire({
          icon: "success",
          title: "Transfer Successful! 🎉",
          text: "Your transaction has been processed successfully.",
          showConfirmButton: true,
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 5000,
          timerProgressBar: true,
          background: "#fefefe",
          didOpen: () => {
            setTimeout(() => {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.3 },
                colors: ["var(--color-accent-yellow)", "#ffd700"],
              });
            }, 100);
          },
        });

        resetForm();
        setConfirmTransaction(false);
        setIsOpen(false);
        return { success: true };
      } else {
        const errorMessage = data?.reason || data?.message || "Transfer failed.";

        if (errorMessage.toLowerCase().includes("pin") || errorMessage.toLowerCase().includes("transaction pin")) {
          throw new Error(errorMessage);
        }

        await Swal.fire({
          icon: "error",
          title: "Transfer Failed",
          text: errorMessage,
        });

        setErrors({ form: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      setLoading(false);
      setPin(Array(inputCount).fill(""));
      
      if (err?.message?.toLowerCase().includes("pin") || err?.message?.toLowerCase().includes("transaction pin")) throw err;
      
      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err?.message || "Please try again later.",
      });
      
      setErrors({ form: err?.message || "Something went wrong." });
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!amount || Number(amount) < 100)
      newErrors.amount = "Amount must be at least ₦100.";
    if (!narration) newErrors.narration = "Narration is required.";
    if (narration.length > 100) newErrors.narration = "Narration too long.";
    if (!expenseCategory) newErrors.expenseCategory = "Please select an expense category.";

    if (transferType === "my-account" && (!userDetails.payment_details.p_account_number || !userDetails.payment_details.p_account_name)) {
      newErrors.myAccount = "Your bank details are incomplete.";
    }

    if (transferType === "other-bank") {
      if (!bankCode || !accountNumber || !accountName) {
        newErrors.otherBank = "Please complete all bank fields.";
      }
      if (accountNumber && (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber))) {
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
    !expenseCategory ||
    Number(amount) <= 0 ||
    (transferType === "my-account" && !userDetails?.payment_details?.p_account_number) ||
    (transferType === "other-bank" && (!bankCode || !accountNumber || !accountName)) ||
    (transferType === "p2p" && (!recepientAcc || !p2pDetails?.id));

  const getPaymentMethod = (): PaymentMethod => {
    if (transferType === "p2p") return "p2p";
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
        error={pinError}
        onClearError={() => setPinError(null)}
        onConfirm={async (code) => {
          try {
            setPinError(null);
            const result = await performTransfer(code);
            if (result?.success) {
              setIsOpen(false);
              setPin(Array(inputCount).fill(""));
            } else if (result?.error) {
              if (!result.error.toLowerCase().includes("pin")) {
                setIsOpen(false);
                setPin(Array(inputCount).fill(""));
              } else {
                setPinError(result.error);
              }
            }
          } catch (error: any) {
            setPinError(error?.message || "Invalid PIN. Please try again.");
            setPin(Array(inputCount).fill(""));
          }
        }}
      />

      {/* 💳 Balance Cards */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="bg-linear-to-r from-[var(--color-accent-yellow)] to-[#E3A521] text-[var(--color-ink)] flex items-center justify-between shadow-lg rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium">
              Alltime Balance
              <span className="block font-semibold text-xl mt-1">
                {showAlltime ? `₦${formatNumber(lifetimeBalance)}` : "*****"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button
              onClick={() => setShowAlltime((prev) => !prev)}
              className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
            >
              {showAlltime ? <EyeOff className="text-[var(--color-ink)] md:text-2xl" /> : <Eye className="text-[var(--color-ink)] md:text-2xl" />}
            </button>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-r from-gray-600 to-gray-800 text-white flex items-center justify-between shadow-lg rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium">
              Current Balance
              <span className="block font-semibold text-xl mt-1">
                {showCurrent ? `₦${formatNumber(balance ?? 0)}` : "*****"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button
              onClick={() => setShowCurrent((prev) => !prev)}
              className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
            >
              {showCurrent ? <EyeOff className="text-white md:text-2xl" /> : <Eye className="text-white md:text-2xl" />}
            </button>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-md rounded-xl p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base md:text-lg font-medium text-[var(--text-primary)]">
              Your Account Number
              <div className="font-semibold flex items-center gap-4 mt-1 text-[var(--text-primary)]">
                {userDetails?.bank_details?.bank_account_number || "N/A"}
                <button
                  className="text-sm border border-[var(--border-color)] px-3 py-2 rounded-md cursor-pointer hover:bg-[var(--bg-secondary)] transition"
                  onClick={async () => {
                    if (userDetails?.bank_details?.bank_account_number) {
                      await navigator.clipboard.writeText(userDetails.bank_details.bank_account_number);
                      Swal.fire({
                        icon: "success",
                        title: "Copied!",
                        text: "Account number copied to clipboard",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    }
                  }}
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {userDetails?.bank_details?.bank_name || "Loading..."}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-[var(--bg-secondary)] p-3 rounded-full">
              <Landmark className="md:text-2xl text-[var(--text-secondary)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border rounded-2xl bg-[var(--bg-primary)] border-[var(--border-color)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[var(--text-primary)]">
            Transfer Funds
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose how you want to transfer funds from your wallet.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Transfer Type */}
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)]">Transfer Type</Label>
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
                <SelectTrigger className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]">
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                  <SelectItem value="my-account" className="text-[var(--text-primary)]">My Bank Account</SelectItem>
                  <SelectItem value="other-bank" className="text-[var(--text-primary)]">Other Bank Account</SelectItem>
                  <SelectItem value="p2p" className="text-[var(--text-primary)]">Zidwell User (P2P)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label className="text-[var(--text-primary)]">Amount (₦)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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
              {errors.amount && <p className="text-red-600 text-sm">{errors.amount}</p>}
            </div>

            {/* My Account */}
            {transferType === "my-account" && (
              <>
                {loading2 ? (
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] animate-pulse">
                    Loading your bank details...
                  </div>
                ) : userDetails?.payment_details.p_account_number && userDetails?.payment_details.p_account_name ? (
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] space-y-1 text-sm">
                    <p className="text-[var(--text-primary)]"><strong>Bank:</strong> {userDetails.payment_details.p_bank_name}</p>
                    <p className="text-[var(--text-primary)]"><strong>Account Number:</strong> {userDetails.payment_details.p_account_number}</p>
                    <p className="text-[var(--text-primary)]"><strong>Account Name:</strong> {userDetails.payment_details.p_account_name}</p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-lg border text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800">
                    You have not set your bank account details yet.{" "}
                    <Link href="/dashboard/profile" className="text-blue-500 hover:underline">
                      Click here
                    </Link> to add them.
                    {errors.myAccount && <p className="text-red-600 text-sm mt-1">{errors.myAccount}</p>}
                  </div>
                )}
              </>
            )}

            {/* Other Bank */}
            {transferType === "other-bank" && (
              <>
                {savedAccounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-[var(--text-primary)]">Saved Accounts</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSavedAccounts(!showSavedAccounts)} className="flex items-center gap-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                        <Bookmark className="h-4 w-4" />
                        {showSavedAccounts ? "Hide" : "Show"} Saved
                      </Button>
                    </div>
                    {showSavedAccounts && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto dark:bg-blue-900/20 dark:border-blue-800">
                        {savedAccounts.map((account) => (
                          <div key={account.id} onClick={() => handleSelectSavedAccount(account)} className={`p-2 rounded cursor-pointer transition-colors ${selectedSavedAccount?.id === account.id ? "bg-blue-100 border border-blue-300 dark:bg-blue-900/40 dark:border-blue-700" : "bg-white hover:bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm dark:text-gray-100">{account.account_name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{account.account_number} • {account.bank_name}</p>
                              </div>
                              {account.is_default && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2 dark:bg-green-900/30 dark:text-green-400">Default</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[var(--text-primary)]">Select Bank Name</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full flex justify-between items-center border border-[var(--border-color)] rounded px-3 py-2 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]" aria-expanded={open}>
                        {bankName || "Search bank..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-[var(--bg-primary)] border-[var(--border-color)]">
                      <Command className="bg-[var(--bg-primary)]">
                        <CommandInput placeholder="Search bank..." value={search} onValueChange={setSearch} autoFocus className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" />
                        <CommandList>
                          <CommandEmpty className="text-[var(--text-secondary)]">No bank found.</CommandEmpty>
                          <CommandGroup>
                            {filteredBanks.map((bank) => (
                              <CommandItem key={bank.code} onSelect={() => handleSelectBank(bank)} className="text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                                <Check className={cn("mr-2 h-4 w-4", bankCode === bank.code ? "opacity-100" : "opacity-0")} />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.otherBank && <p className="text-red-600 text-sm">{errors.otherBank}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-[var(--text-primary)]">Account Number</Label>
                  <Input type="number" maxLength={10} value={accountNumber} onChange={handleAccountNumberChange} placeholder="10-digit account number" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                  {errors.accountNumber && <p className="text-red-600 text-sm">{errors.accountNumber}</p>}
                </div>

                {lookupLoading && <p className="text-[var(--color-accent-yellow)] text-sm flex items-center gap-2"><Loader2 className="animate-spin" /> Verifying account...</p>}
                {accountName && !errors.accountNumber && (
                  <div className="space-y-2">
                    <p className="text-[var(--color-accent-yellow)] text-sm font-semibold">Account Name: {accountName}</p>
                    {!selectedSavedAccount && accountNumber.length === 10 && accountName && (
                      <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Save to beneficiaries</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={saveAccount} onChange={(e) => setSaveAccount(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-yellow)] dark:bg-gray-600"></div>
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
                {savedP2PBeneficiaries.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-[var(--text-primary)]">Saved Beneficiaries</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSavedP2PBeneficiaries(!showSavedP2PBeneficiaries)} className="flex items-center gap-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                        <User className="h-4 w-4" />
                        {showSavedP2PBeneficiaries ? "Hide" : "Show"} Saved
                      </Button>
                    </div>
                    {showSavedP2PBeneficiaries && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto dark:bg-purple-900/20 dark:border-purple-800">
                        {savedP2PBeneficiaries.map((beneficiary) => (
                          <div key={beneficiary.id} onClick={() => handleSelectSavedP2PBeneficiary(beneficiary)} className={`p-2 rounded cursor-pointer transition-colors ${selectedSavedP2PBeneficiary?.id === beneficiary.id ? "bg-purple-100 border border-purple-300 dark:bg-purple-900/40 dark:border-purple-700" : "bg-white hover:bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm dark:text-gray-100">{beneficiary.account_name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{beneficiary.account_number} • Zidwell User</p>
                              </div>
                              {beneficiary.is_default && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2 dark:bg-green-900/30 dark:text-green-400">Default</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[var(--text-primary)]">Account Number (Zidwell User)</Label>
                  <Input type="number" value={recepientAcc} onChange={handleP2PAccountNumberChange} placeholder="0234******" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                  {errors.recepientAcc && <p className="text-red-600 text-sm">{errors.recepientAcc}</p>}
                  {lookupLoading && <p className="text-[var(--color-accent-yellow)] text-sm flex items-center gap-2"><Loader2 className="animate-spin" /> Verifying account...</p>}
                  {p2pDetails?.name && !errors.recepientAcc && (
                    <div className="space-y-2">
                      <p className="text-[var(--color-accent-yellow)] text-sm font-semibold">Account Name: {p2pDetails.name}</p>
                      {!selectedSavedP2PBeneficiary && recepientAcc.length >= 6 && p2pDetails?.name && (
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                          <span className="text-sm font-medium text-[var(--text-primary)]">Save to beneficiaries</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={saveP2PBeneficiary} onChange={(e) => setSaveP2PBeneficiary(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-yellow)] dark:bg-gray-600"></div>
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
              <Label className="text-[var(--text-primary)]">Narration <span className="text-sm text-[var(--text-secondary)]">(purpose of transaction)</span></Label>
              <Input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Food" maxLength={100} className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
            </div>
            {errors.narration && <p className="text-red-600 text-sm">{errors.narration}</p>}

            {/* Expense Category Dropdown */}
            <div className="space-y-1">
              <Label className="text-[var(--text-primary)]">Expense Category <span className="text-sm text-red-500">*</span></Label>
              
              {loadingCategories ? (
                <div className="flex items-center justify-center p-4 border border-[var(--border-color)] rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-yellow)]" />
                  <span className="ml-2 text-[var(--text-secondary)]">Loading categories...</span>
                </div>
              ) : (
                <Popover open={showCategoryDropdown} onOpenChange={setShowCategoryDropdown}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex justify-between items-center border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{getSelectedCategoryIcon()}</span>
                        <span>{getSelectedCategoryName()}</span>
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-[var(--bg-primary)] border-[var(--border-color)] max-h-[400px] overflow-y-auto" align="start">
                    <Command className="bg-[var(--bg-primary)]">
                      <CommandInput 
                        placeholder="Search category..." 
                        value={categorySearch} 
                        onValueChange={setCategorySearch} 
                        className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" 
                      />
                      <CommandList>
                        <CommandEmpty className="text-[var(--text-secondary)] p-4 text-center">No category found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCategories.map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => handleSelectCategory(category)}
                              className="flex items-center justify-between cursor-pointer hover:bg-[var(--bg-secondary)]"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{category.icon}</span>
                                <span className="text-[var(--text-primary)]">{category.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavoriteCategory(category, e)}
                                  className="p-1 hover:scale-110 transition-transform"
                                >
                                  <Star 
                                    className={cn(
                                      "h-4 w-4",
                                      category.is_favorite ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[var(--text-secondary)]"
                                    )} 
                                  />
                                </button>
                                {expenseCategory === category.id && (
                                  <Check className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {errors.expenseCategory && <p className="text-red-600 text-sm">{errors.expenseCategory}</p>}
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                ⭐ Click the star to favorite a category - favorites appear at the top for quick access
              </p>
            </div>

            <Button type="submit" disabled={isDisabled} className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 md:w-[200px]">
              {loading ? "Processing..." : "Transfer Now"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <TransactionSummary
        senderName={`${userData?.fullName}`}
        senderAccount={userDetails?.bank_details?.bank_account_number || "N/A"}
        recipientName={transferType === "p2p" ? p2pDetails?.name : transferType === "other-bank" ? accountName : userDetails?.payment_details?.p_account_name}
        recipientAccount={transferType === "p2p" ? recepientAcc : transferType === "other-bank" ? accountNumber : userDetails?.payment_details?.p_account_number}
        recipientBank={transferType === "p2p" ? "Zidwell" : transferType === "other-bank" ? bankName : userDetails?.payment_details?.p_bank_name}
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