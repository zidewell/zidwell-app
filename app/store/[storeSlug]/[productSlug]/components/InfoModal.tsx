// app/store/[storeSlug]/[productSlug]/components/InfoModal.tsx
"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  Truck,
  CalendarIcon,
  Clock,
  MessageSquare,
  CreditCard,
  Loader2,
  CircleCheck,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Calendar as DateCalendar } from "@/app/components/ui/calendar";
import { TimePicker } from "./TimePicker";
import {
  PRIMARY_BG,
  PRIMARY_BG_HOVER,
  PRIMARY_TEXT,
} from "../utils/helpers";

interface Props {
  // Form state
  isDonation: boolean;
  requireDonorName: boolean;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  errors: Record<string, string>;
  setErrors: (e: Record<string, string>) => void;

  // Shipping
  requiresShipping: boolean;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  setShippingAddress: (a: any) => void;

  // Booking
  bookingEnabled: boolean;
  bookingDate: string;
  setBookingDate: (v: string) => void;
  bookingTime: string;
  setBookingTime: (v: string) => void;

  // Note
  customerNoteEnabled: boolean;
  customerNote: string;
  setCustomerNote: (v: string) => void;

  // Donation
  allowDonorMessage: boolean;
  donorMessage: string;
  setDonorMessage: (v: string) => void;

  // Payment link custom fields
  isPaymentLink: boolean;
  customFields: any[];
  linkConfig: any;
  customFieldValues: Record<string, any>;
  setCustomFieldValues: (v: Record<string, any>) => void;

  // School
  isSchoolPage: boolean;
  schoolRequiredFields: string[];
  schoolFields: Record<string, any>;
  setSchoolFields: (v: Record<string, any>) => void;

  // Pricing
  showQuantity: boolean;
  quantity: number;
  currentTotalAmount: number;

  // Payment
  processingCardPayment: boolean;
  submissionLock: boolean;

  // Actions
  onClose: () => void;
  onProceed: () => void;
}

export function InfoModal({
  isDonation,
  requireDonorName,
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  setCustomerPhone,
  errors,
  setErrors,
  requiresShipping,
  shippingAddress,
  setShippingAddress,
  bookingEnabled,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  customerNoteEnabled,
  customerNote,
  setCustomerNote,
  allowDonorMessage,
  donorMessage,
  setDonorMessage,
  isPaymentLink,
  customFields,
  linkConfig,
  customFieldValues,
  setCustomFieldValues,
  isSchoolPage,
  schoolRequiredFields,
  schoolFields,
  setSchoolFields,
  showQuantity,
  quantity,
  currentTotalAmount,
  processingCardPayment,
  submissionLock,
  onClose,
  onProceed,
}: Props) {
  const isSubmitting = processingCardPayment || submissionLock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isDonation ? "Your donation" : "Your information"}
          </h3>
          <button
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          {(!isDonation || requireDonorName) && (
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Full name *
              </Label>
              <Input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              Email {!isDonation && "*"}
            </Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={errors.email ? "border-red-500" : ""}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              Phone number
            </Label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08012345678"
            />
          </div>

          {/* Shipping */}
          {requiresShipping && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Truck className="h-4 w-4 text-foreground/60" />
                Delivery address
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Street address *
                  </Label>
                  <Input
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        street: e.target.value,
                      })
                    }
                    className={errors.shippingStreet ? "border-red-500" : ""}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-1 block text-xs font-medium">
                      City *
                    </Label>
                    <Input
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      placeholder="Lagos"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium">
                      State *
                    </Label>
                    <Input
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value,
                        })
                      }
                      placeholder="Lagos"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking */}
          {bookingEnabled && (
            <div className="border-t border-border pt-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDC020]/15">
                  <CalendarIcon className="h-4 w-4 text-[#191919] dark:text-[#FDC020]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Is This An Appointment</p>
                  <p className="text-xs text-foreground/50">
                    Pick a date and time that works for you
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-[#FDC020]/60 ${
                        errors.bookingDate ? "border-red-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-foreground/60" />
                        <div>
                          <p className="text-xs text-foreground/50">
                            Preferred date
                          </p>
                          <p className="text-sm font-medium">
                            {bookingDate
                              ? format(
                                  new Date(bookingDate),
                                  "EEEE, MMM d, yyyy"
                                )
                              : "Select a date"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <DateCalendar
                      mode="single"
                      selected={bookingDate ? new Date(bookingDate) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        setBookingDate(
                          `${d.getFullYear()}-${String(
                            d.getMonth() + 1
                          ).padStart(2, "0")}-${String(d.getDate()).padStart(
                            2,
                            "0"
                          )}`
                        );
                        if (errors.bookingDate)
                          setErrors({ ...errors, bookingDate: "" });
                      }}
                      disabled={(d) =>
                        d < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Time picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-[#FDC020]/60 ${
                        errors.bookingTime ? "border-red-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-foreground/60" />
                        <div>
                          <p className="text-xs text-foreground/50">
                            Preferred time
                          </p>
                          <p className="text-sm font-medium">
                            {bookingTime
                              ? format(
                                  new Date(`2000-01-01T${bookingTime}`),
                                  "h:mm a"
                                )
                              : "Select a time"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-2">
                    <TimePicker
                      value={bookingTime}
                      onChange={(v) => {
                        setBookingTime(v);
                        if (errors.bookingTime)
                          setErrors({ ...errors, bookingTime: "" });
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {bookingDate && bookingTime && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#FDC020]/40 bg-[#FDC020]/5 px-3 py-2">
                  <CircleCheck className="h-3.5 w-3.5 text-[#191919] dark:text-[#FDC020] shrink-0" />
                  <p className="text-xs text-foreground/80">
                    Booking for{" "}
                    <strong>
                      {format(
                        new Date(`${bookingDate}T${bookingTime}`),
                        "EEEE, MMM d 'at' h:mm a"
                      )}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Customer note */}
          {customerNoteEnabled && (
            <div>
              <Label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-3.5 w-3.5 text-foreground/60" />
                Note (optional)
              </Label>
              <Textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Describe your request"
                rows={3}
              />
            </div>
          )}

          {/* Donor message */}
          {isDonation && allowDonorMessage && (
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Message (optional)
              </Label>
              <Textarea
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder="Leave a message"
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Payment link custom fields */}
          {isPaymentLink && customFields.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">
                Additional information
              </p>
              <div className="space-y-3">
                {linkConfig.amountMode === "variable" && (
                  <div>
                    <Label className="mb-1.5 block text-sm font-medium">
                      Amount *
                    </Label>
                    <Input
                      type="number"
                      value={customFieldValues.customAmount || ""}
                      onChange={(e) =>
                        setCustomFieldValues({
                          ...customFieldValues,
                          customAmount: e.target.value,
                        })
                      }
                      placeholder="Enter amount"
                    />
                  </div>
                )}
                {customFields.map((field: any) => (
                  <div key={field.id}>
                    <Label className="mb-1.5 block text-sm font-medium">
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>
                    {field.type === "paragraph" ? (
                      <Textarea
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues({
                            ...customFieldValues,
                            [field.id]: e.target.value,
                          })
                        }
                        rows={3}
                        className="resize-none"
                      />
                    ) : field.type === "dropdown" ? (
                      <select
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues({
                            ...customFieldValues,
                            [field.id]: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground"
                      >
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map(
                          (opt: string, i: number) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          )
                        )}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!customFieldValues[field.id]}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.id]: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span>Yes</span>
                      </label>
                    ) : (
                      <Input
                        type={
                          field.type === "number"
                            ? "number"
                            : field.type === "date"
                            ? "date"
                            : "text"
                        }
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues({
                            ...customFieldValues,
                            [field.id]: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* School required fields */}
          {isSchoolPage && schoolRequiredFields.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">
                Additional information
              </p>
              <div className="space-y-3">
                {schoolRequiredFields.map((field: string, i: number) => (
                  <div key={i}>
                    <Label className="mb-1.5 block text-sm font-medium">
                      {field}
                    </Label>
                    <Input
                      value={schoolFields[field] || ""}
                      onChange={(e) =>
                        setSchoolFields({
                          ...schoolFields,
                          [field]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            {showQuantity && quantity > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">
                  {quantity} × ₦
                  {(currentTotalAmount / Math.max(quantity, 1)).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
                <span className="font-medium">
                  ₦{currentTotalAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-border">
              <span className="text-sm font-medium">Amount</span>
              <span className="text-lg font-semibold">
                ₦{currentTotalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={onProceed}
            disabled={isSubmitting}
            className={`w-full rounded-lg ${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER} py-3 text-sm font-semibold disabled:opacity-60`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {isDonation ? "Donate now" : "Proceed to payment"}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}