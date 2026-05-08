// ElectricityBills.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Check,
  AlertCircle,
  Building2Icon,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Image from "next/image";
import { useUserContextData } from "../context/userData";
import ElectricityCustomerCard from "./ElectricityCusInfo";
import Swal from "sweetalert2";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import PinPopOver from "./PinPopOver";

interface AirtimeAmount {
  value: number;
}

const airtimeAmounts: AirtimeAmount[] = [
  { value: 1000 },
  { value: 2000 },
  { value: 5000 },
  { value: 10000 },
];

export default function ElectricityBills() {
  const inputCount = 4;
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [powerProviders, setPowerProviders] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState("");
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isOpen, setIsOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const { userData, setUserData } = useUserContextData();
  const router = useRouter();
  const meterTypes = ["Prepaid", "Postpaid"];
  const [validatedMeters, setValidatedMeters] = useState<{
    [key: string]: any;
  }>({});

  const validateAmount = (amt: number | null) => {
    if (!amt) return "Amount is required";
    if (amt < 1000) return "Minimum amount is ₦1000";
    if (amt > 50000) return "Maximum amount is ₦50,000";
    return "";
  };

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setAmount(amount);
    setCustomAmount(null);
    setIsCustomAmount(false);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ""), 10);
    setCustomAmount(numericValue);
    setAmount(numericValue);
    setSelectedAmount(null);
    setIsCustomAmount(true);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleMeterNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setMeterNumber(cleanValue);
    setIsVerified(false);

    if (errors.meterNumber) {
      setErrors((prev) => ({ ...prev, meterNumber: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedProvider) {
      newErrors.provider = "Please select an electricity provider";
    }

    if (!isVerified) {
      newErrors.verification = "Please verify your meter number first";
    }

    const amountError = validateAmount(amount);
    if (amountError) {
      newErrors.amount = amountError;
    }

    if (!meterNumber) {
      newErrors.meterNumber = "Please enter your meter number";
    }
    if (!meterType) {
      newErrors.meterType = "Please select a meter type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (pinCode: string) => {
    if (!validateForm()) return;

    if (!selectedProvider?.id) {
      throw new Error("Please ensure you've selected a provider");
    }

    if (!userInfo) {
      throw new Error("Please validate your meter number before proceeding");
    }

    if (!amount || isNaN(Number(amount))) {
      throw new Error("Amount must be a valid number");
    }

    const payload = {
      disco: selectedProvider.id,
      pin: pinCode,
      customerId: userInfo.meterNumber,
      meterType: userInfo.meterType.toLowerCase(),
      amount: Number(amount),
      payerName: userData?.fullName || "Valued Customer",
      merchantTxRef: `power-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    try {
      setLoading3(true);

      const response = await fetch("/api/buy-electricity", {
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

      setIsOpen(false);

      setPin(Array(inputCount).fill(""));
      setSelectedProvider(null);
      setSelectedPlan(null);
      setAmount(null);
      setUserInfo(null);
      setMeterNumber("");
      setMeterType("");

      Swal.fire({
        icon: "success",
        title: "Power Purchase Successful",
        confirmButtonColor: "var(--color-accent-yellow)",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Purchase error:", error);
      throw error;
    } finally {
      setLoading3(false);
    }
  };

  const getPowerProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/electricity-providers");
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch providers");

      const prefixLogos: Record<string, string> = {
        ikedc: "/disco-img/ikeja.png",
        ekedc: "/disco-img/eko.png",
        phed: "/disco-img/portharcourt.png",
        kedco: "/disco-img/kano.png",
        aedc: "/disco-img/abuja.png",
        ibedc: "/disco-img/ibadan.png",
        eedc: "/disco-img/enugu.png",
        bedc: "/disco-img/benin.png",
        jed: "/disco-img/jos.png",
        yedc: "/disco-img/yola.png",
      };

      const enrichedProviders = data.data.map((provider: any) => ({
        ...provider,
        logo: prefixLogos[provider.id] || "/disco-img/default.png",
      }));

      setPowerProviders(enrichedProviders);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateMeterNumber = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedProvider?.id) {
      newErrors.provider = "Please select an electricity provider";
    }

    if (!meterNumber) {
      newErrors.meterNumber = "Meter number is required";
    } else if (!/^\d{10,14}$/.test(meterNumber)) {
      newErrors.meterNumber = "Meter number must be 10–14 digits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsVerified(false);
      return;
    }

    if (validatedMeters[meterNumber]) {
      setUserInfo(validatedMeters[meterNumber]);
      setIsVerified(true);
      setErrors({});
      return;
    }

    const params = new URLSearchParams({
      disco: selectedProvider.id || "",
      customerId: meterNumber.trim(),
    });

    try {
      setLoading2(true);

      const response = await fetch(`/api/validate-electricity?${params}`, {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Validation failed");

      setUserInfo(data.data);
      setIsVerified(true);
      setErrors({});
      setValidatedMeters((prev) => ({ ...prev, [meterNumber]: data }));
    } catch (err: any) {
      setIsVerified(false);
      setUserInfo(null);
      setErrors({
        meterNumber:
          "Meter number validation failed. Please check and try again.",
      });
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    getPowerProviders();
  }, []);

  return (
    <div className="space-y-6 md:max-w-5xl md:mx-auto opacity-50 pointer-events-none select-none relative">
      {/* Disabled Overlay */}
      <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-md">
          <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            Electricity bill payment service is currently under development.
            Please check back later.
          </p>
        </div>
      </div>

      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={async (pinCode) => {
          try {
            setPinError(null);
            await handlePayment(pinCode);
          } catch (error: any) {
            setPinError(
              error.message || "Transaction failed. Please try again.",
            );
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
          className="text-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)]/80 hover:bg-[var(--bg-secondary)] text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>

        <div className="">
          <h1 className="md:text-3xl text-xl font-bold mb-2 text-[var(--text-primary)]">
            Pay Electricity Bills
          </h1>
          <p className="text-[var(--text-secondary)]">
            Pay your electricity bills instantly across all DISCOs in Nigeria
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                <Building2Icon className="w-5 h-5 text-[var(--color-accent-yellow)]" />
                Select Network Provider
              </CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-4 border-2 rounded-md bg-gray-100 animate-pulse"
                    >
                      <div className="w-16 h-16 bg-gray-300 rounded mx-auto mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {powerProviders?.map((provider: any) => {
                    const isSelected = selectedProvider?.name === provider.name;

                    return (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className={`relative p-4 border-2 rounded-md transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-accent-yellow)]/10 border-[var(--color-accent-yellow)] text-[var(--text-primary)] shadow-md"
                            : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 relative">
                            <Image
                              src={provider.logo}
                              alt={`${provider.name} logo`}
                              fill
                              className="rounded-lg object-contain"
                            />
                          </div>
                          <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                            {provider.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2">
                            <div className="w-6 h-6 bg-[var(--color-accent-yellow)] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-[var(--color-ink)]" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {errors.provider && (
                <div className="flex items-center gap-2 mt-3 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.provider}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedProvider && (
            <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Meter Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meterType" className="text-[var(--text-primary)]">Meter Type</Label>
                    <Select
                      value={meterType}
                      onValueChange={(value) => {
                        setMeterType(value);
                        setIsVerified(false);
                        setMeterNumber("");
                      }}
                    >
                      <SelectTrigger className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
                        <SelectValue placeholder="Select meter type" />
                      </SelectTrigger>
                      <SelectContent>
                        {meterTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.meterType && (
                      <div className="flex items-center gap-2 mt-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.meterType}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="meterNumber" className="text-[var(--text-primary)]">Meter Number</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="meterNumber"
                        type="text"
                        placeholder="Enter meter number"
                        value={meterNumber}
                        onChange={(e) =>
                          handleMeterNumberChange(e.target.value)
                        }
                        className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] ${errors.meterNumber ? "border-destructive" : ""}`}
                        style={{ outline: "none", boxShadow: "none" }}
                        onBlur={validateMeterNumber}
                        maxLength={13}
                      />
                      {loading2 ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-accent-yellow)]"></div>
                      ) : isVerified ? (
                        <div className="text-[var(--color-lemon-green)]" title="Verified">
                          <Check className="w-6 h-6" />
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={validateMeterNumber}
                          disabled={!meterNumber || !meterType}
                          className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                    {errors.meterNumber && (
                      <div className="flex items-center gap-2 mt-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{errors.meterNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Select Amount</CardTitle>
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
                                ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                                : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                            }`}
                  >
                    <div className="text-center">
                      <p className="font-bold text-[var(--text-primary)]">
                        ₦{amount.value.toLocaleString()}
                      </p>
                    </div>
                    {selectedAmount === amount.value && !isCustomAmount && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-[var(--color-accent-yellow)] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-[var(--color-ink)]" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border-color)] pt-4">
                <Label htmlFor="customAmount" className="text-[var(--text-primary)]">Or Enter Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">
                    ₦
                  </span>
                  <Input
                    id="customAmount"
                    type="text"
                    placeholder="Enter amount (min ₦1000)"
                    value={customAmount || ""}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`pl-8 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] ${errors.amount ? "border-red-500" : ""}`}
                    style={{ outline: "none", boxShadow: "none" }}
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

        <div className="lg:col-span-1">
          <ElectricityCustomerCard
            customerName={userInfo || ""}
            meterNumber={meterNumber || ""}
            meterType={meterType || ""}
            selectedProvider={selectedProvider}
            selectedPlan={selectedPlan}
            amount={amount}
            loading={loading3}
            validateForm={validateForm}
            setIsOpen={setIsOpen}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}