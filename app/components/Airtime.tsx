// AirtimePurchase.tsx
"use client";

import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import {
  Smartphone,
  Check,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { useUserContextData } from "../context/userData";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PinPopOver from "./PinPopOver";

interface AirtimeAmount {
  value: number;
  bonus?: string;
  popular?: boolean;
}

interface SavedBeneficiary {
  id: string;
  phoneNumber: string;
  network: string;
  networkName: string;
  amount: number | null;
  isDefault: boolean;
  createdAt: string;
}

const prefixColorMap = [
  {
    id: "mtn",
    name: "MTN",
    src: "/networks-img/mtn.png",
    prefix: [
      "0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913",
    ],
  },
  {
    id: "airtel",
    name: "Airtel",
    src: "/networks-img/airtel.png",
    prefix: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
  },
  {
    id: "glo",
    name: "Glo",
    src: "/networks-img/glo.png",
    prefix: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    name: "9mobile",
    src: "/networks-img/9mobile.png",
    prefix: ["0809", "0818", "0817", "0909", "0908"],
  },
];

const airtimeAmounts: AirtimeAmount[] = [
  { value: 100 },
  { value: 200, popular: true },
  { value: 500, bonus: "+50 bonus" },
  { value: 1000, bonus: "+100 bonus" },
  { value: 2000, bonus: "+300 bonus" },
  { value: 5000, bonus: "+750 bonus" },
  { value: 10000, bonus: "+1500 bonus" },
];

export default function AirtimePurchase() {
  const inputCount = 4;
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { userData, setUserData } = useUserContextData();
  const router = useRouter();

  const [savedBeneficiaries, setSavedBeneficiaries] = useState<SavedBeneficiary[]>([]);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [selectedSavedBeneficiary, setSelectedSavedBeneficiary] = useState<SavedBeneficiary | null>(null);
  const [showSavedBeneficiaries, setShowSavedBeneficiaries] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

  useEffect(() => {
    if (!userData?.id) return;

    const fetchSavedBeneficiaries = async () => {
      setLoadingBeneficiaries(true);
      try {
        const response = await fetch(
          `/api/save-airtime-beneficiaries?userId=${userData.id}&type=airtime`,
        );
        const data = await response.json();

        if (data.success) {
          setSavedBeneficiaries(data.beneficiaries || []);
        }
      } catch (error) {
        console.error("Error fetching saved beneficiaries:", error);
      } finally {
        setLoadingBeneficiaries(false);
      }
    };

    fetchSavedBeneficiaries();
  }, [userData?.id]);

  const handlePhoneNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setPhoneNumber(cleanValue);

    if (selectedSavedBeneficiary && cleanValue !== selectedSavedBeneficiary.phoneNumber) {
      setSelectedSavedBeneficiary(null);
    }

    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  const validatePhoneNumber = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    const nigerianPhoneRegex = /^(0[7-9][0-1]\d{8}|234[7-9][0-1]\d{8})$/;

    if (!cleanNumber) return "Phone number is required";
    if (cleanNumber.length !== 11 && cleanNumber.length !== 13)
      return "Phone number must be 11 digits (starting with 0) or 13 digits (starting with 234)";
    if (!nigerianPhoneRegex.test(cleanNumber))
      return "Please enter a valid Nigerian phone number";

    return "";
  };

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setIsCustomAmount(false);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setCustomAmount(numericValue);
    setSelectedAmount(null);
    setIsCustomAmount(true);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleSelectSavedBeneficiary = (beneficiary: SavedBeneficiary) => {
    setSelectedSavedBeneficiary(beneficiary);
    setPhoneNumber(beneficiary.phoneNumber);

    const provider = prefixColorMap.find((p) => p.id === beneficiary.network);
    if (provider) {
      setSelectedProvider(provider);
    }

    if (beneficiary.amount) {
      setSelectedAmount(beneficiary.amount);
      setCustomAmount("");
      setIsCustomAmount(false);
    }

    setShowSavedBeneficiaries(false);
    setSaveBeneficiary(false);
  };

  const saveBeneficiaryToProfile = async () => {
    if (!userData?.id || !phoneNumber || !selectedProvider) {
      return;
    }

    try {
      const response = await fetch("/api/save-airtime-beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          phoneNumber: phoneNumber.replace(/\D/g, ""),
          network: selectedProvider.id,
          networkName: selectedProvider.name,
          amount: finalAmount > 0 ? finalAmount : null,
          type: "airtime",
          isDefault: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedBeneficiaries((prev) => [...prev, data.beneficiary]);
        Swal.fire({
          icon: "success",
          title: "Beneficiary Saved!",
          text: "This phone number has been saved to your beneficiaries for future airtime purchases.",
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (!selectedProvider) newErrors.provider = "Please select a network provider";

    const amount = isCustomAmount ? parseInt(customAmount) : selectedAmount;

    if (!amount || amount < 100) newErrors.amount = "Amount must be at least ₦100";
    else if (amount > 50000) newErrors.amount = "Maximum amount is ₦50,000";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const finalAmount = isCustomAmount ? parseInt(customAmount) || 0 : selectedAmount || 0;

  const purchaseAirtime = async (pinCode: string) => {
    if (!validateForm()) return;

    const payload = {
      userId: userData?.id,
      pin: pinCode,
      amount: finalAmount,
      network: selectedProvider?.id,
      phoneNumber: phoneNumber.trim(),
      merchantTxRef: `AIRTIME-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderName: userData?.fullName || "Zidwell User",
    };

    try {
      setLoading(true);

      const response = await fetch("/api/buy-airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Transaction failed");
      }

      if (data.zidCoinBalance !== undefined) {
        setUserData((prev: any) => {
          const updated = { ...prev, zidcoinBalance: data.zidCoinBalance };
          localStorage.setItem("userData", JSON.stringify(updated));
          return updated;
        });
      }

      if (saveBeneficiary && !selectedSavedBeneficiary) {
        await saveBeneficiaryToProfile();
      }

      setIsOpen(false);

      setPhoneNumber("");
      setPin(Array(inputCount).fill(""));
      setSelectedProvider(null);
      setSelectedAmount(null);
      setCustomAmount("");
      setIsCustomAmount(false);
      setSaveBeneficiary(false);
      setSelectedSavedBeneficiary(null);

      Swal.fire({
        icon: "success",
        title: "Airtime Purchase Successful",
        text: `₦${payload.amount} sent to ${payload.phoneNumber}`,
        confirmButtonColor: "#0f172a",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Purchase error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4);
      const matchedProvider = prefixColorMap.find((entry) =>
        entry.prefix.includes(prefix),
      );
      if (matchedProvider && matchedProvider?.id !== selectedProvider?.id) {
        setSelectedProvider(matchedProvider);
      }
    }
  }, [phoneNumber]);

  return (
    <div className="space-y-6 md:max-w-5xl md:mx-auto">
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={async (pinCode) => {
          try {
            setPinError(null);
            await purchaseAirtime(pinCode);
          } catch (error: any) {
            setPinError(error.message || "Transaction failed. Please try again.");
            throw error;
          }
        }}
        error={pinError}
        onClearError={() => setPinError(null)}
      />

      <div className="flex items-start space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-[#2b825b] hover:bg-white/10 text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>

        <div className="">
          <h1 className="md:text-3xl text-xl font-bold mb-2">Buy Airtime</h1>
          <p className="text-muted-foreground">
            Instant airtime top-up for all Nigerian networks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Purchase Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Network Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Select Network Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {prefixColorMap?.map((provider) => {
                  const isSelected = selectedProvider?.name === provider.name;

                  return (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative p-4 border-2 rounded-md transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-gray-100 border-[#2b825b] text-gray-900 shadow-md"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 relative">
                          <Image
                            src={provider.src}
                            alt={`${provider.name} logo`}
                            width={64}
                            height={64}
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {provider.name}
                        </h3>
                      </div>

                      {isSelected && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-[#2b825b] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.provider && (
                <div className="flex items-center gap-2 mt-3 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.provider}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone Number Input */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedBeneficiaries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Saved Beneficiaries
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSavedBeneficiaries(!showSavedBeneficiaries)}
                      className="flex items-center gap-1"
                    >
                      <Bookmark className="h-4 w-4" />
                      {showSavedBeneficiaries ? "Hide" : "Show"} Saved
                    </Button>
                  </div>

                  {showSavedBeneficiaries && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                      {loadingBeneficiaries ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-[#2b825b]" />
                          <span className="ml-2 text-sm">
                            Loading beneficiaries...
                          </span>
                        </div>
                      ) : (
                        savedBeneficiaries.map((beneficiary) => (
                          <div
                            key={beneficiary.id}
                            onClick={() => handleSelectSavedBeneficiary(beneficiary)}
                            className={`p-3 rounded cursor-pointer transition-colors ${
                              selectedSavedBeneficiary?.id === beneficiary.id
                                ? "bg-blue-100 border border-blue-300"
                                : "bg-white hover:bg-gray-50 border"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {beneficiary.phoneNumber}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {beneficiary.networkName}
                                  {beneficiary.amount && (
                                    <span className="ml-1 text-green-600 font-medium">
                                      • ₦{beneficiary.amount.toLocaleString()}
                                    </span>
                                  )}
                                </p>
                              </div>
                              {beneficiary.isDefault && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Mobile Number</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0803 123 4567"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    className={`pl-14 ${errors.phoneNumber ? "border-red-500" : ""}`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-500 font-medium">+234</span>
                  </div>
                </div>
                {errors.phoneNumber && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.phoneNumber}</span>
                  </div>
                )}
                {selectedProvider && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{selectedProvider.name} detected</span>
                  </div>
                )}

                {!selectedSavedBeneficiary && phoneNumber.length === 11 && selectedProvider && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mt-3">
                    <span className="text-sm font-medium text-gray-700">
                      Save to beneficiaries
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveBeneficiary}
                        onChange={(e) => setSaveBeneficiary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2b825b]"></div>
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {airtimeAmounts.map((amount) => (
                  <div
                    key={amount.value}
                    onClick={() => handleAmountSelection(amount.value)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    selectedAmount === amount.value && !isCustomAmount
                      ? "border-[#2b825b] bg-blue-50 text-[#2b825b]"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                  >
                    <div className="text-center">
                      <p className="font-bold">₦{amount.value.toLocaleString()}</p>
                    </div>
                    {selectedAmount === amount.value && !isCustomAmount && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-[#2b825b] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="customAmount">Or Enter Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₦
                  </span>
                  <Input
                    id="customAmount"
                    type="text"
                    placeholder="Enter amount (min ₦100)"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
                  />
                </div>
              </div>

              {errors.amount && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.amount}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProvider && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedProvider.id.toUpperCase()}</p>
                    <p className="text-sm text-gray-500">VTU Airtime</p>
                  </div>
                </div>
              )}

              {phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">
                    +234 {phoneNumber.replace(/\D/g, "").substring(1)}
                  </p>
                </div>
              )}

              {finalAmount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{finalAmount.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Airtime Amount</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Wallet balance after</span>
                  <span className="text-green-600">
                    ₦{((userData?.walletBalance || 0) - (finalAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₦{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (validateForm()) {
                    setIsOpen(true);
                  }
                }}
                disabled={!selectedProvider || !phoneNumber || !finalAmount || loading}
                className="w-full bg-[#2b825b] hover:bg-[#2b825b] text-white py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Buy Airtime
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 mt-4">
                <p>🔒 Secure payment powered by Zidwell</p>
                <p>Instant delivery • 24/7 support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}