// app/store/[storeSlug]/[productSlug]/client.tsx
"use client";

import { Shield } from "lucide-react";
import { useProductCheckout } from "./hooks/useProductCheckout";
import type { StoreProductClientProps } from "./utils/types";
import { TYPE_LABELS } from "./utils/helpers";
import { ProductHeader } from "./components/ProductHeader";
import { ProductImageGallery } from "./components/ProductImageGallery";
import { StockBadge } from "./components/StockBadge";
import { QuantityPicker } from "./components/QuantityPicker";
import { PaymentOptionToggle } from "./components/PaymentOptionToggle";
import { DescriptionBlock } from "./components/DescriptionBlock";
import { ActivePlanCard } from "./components/ActivePlanCard";
import { CompletedPlanCard } from "./components/CompletedPlanCard";
import { SchoolFields } from "./components/SchoolFields";
import { PhysicalFields } from "./components/PhysicalFields";
import { DonationFields } from "./components/DonationFields";
import { CheckoutButton } from "./components/CheckoutButton";
import { InfoModal } from "./components/InfoModal";
import { ContinueModal } from "./components/ContinueModal";
import { MoreFromStore } from "./components/MoreFromStore";

export default function StoreProductClient(props: StoreProductClientProps) {
  const c = useProductCheckout(props);
  const { page, store, moreProducts = [] } = props;

  // ─── Derived values (defensive) ───
  const selectedVariantSkus = c.selectedVariantSkus ?? new Set<string>();
  const variantQuantities = c.variantQuantities ?? {};
  const selectedVariantLines = c.selectedVariantLines ?? [];

  const totalPhysicalUnits = selectedVariantLines.reduce(
    (sum, l) => sum + (l.quantity || 0),
    0
  );

  function WhatsAppIcon({ className }: { className?: string }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductHeader
        store={store}
        storeNameUpper={c.storeNameUpper}
        cartBadgeCount={
          c.isPhysical && selectedVariantLines.length > 0
            ? totalPhysicalUnits
            : c.canPickQuantity
            ? c.quantity
            : c.selectedEntityIds.size
        }
      />

      <section className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 pt-7 lg:grid-cols-[minmax(380px,1fr)_minmax(420px,1.65fr)] lg:gap-12 lg:px-10 lg:pt-8">
        <ProductImageGallery
          productImages={c.productImages}
          currentImage={c.currentImage}
          setCurrentImage={c.setCurrentImage}
          title={page.title}
        />

        <div className="flex flex-col">
          <span className="w-fit rounded-full border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            {c.isPaymentLink
              ? "Payment Link"
              : TYPE_LABELS[page.pageType] || "Product"}
          </span>

          <h1 className="mt-4 max-w-[780px] text-pretty text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
            {page.title}
          </h1>

          <p className="mt-3 text-sm text-foreground/50">{store.name}</p>

          <StockBadge
            showQuantity={c.showQuantity}
            productStock={c.productStock}
            isOutOfStock={c.isOutOfStock}
          />

          {/* Continue plan button */}
          {c.isSchoolPage && !c.isPlanComplete && (
            <button
              type="button"
              onClick={() => c.setShowContinueModal(true)}
              className="mt-4 w-fit inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground/70 hover:border-[#FDC020] hover:text-foreground"
            >
              Paid before? Find my payments
            </button>
          )}

          {!c.isSchoolPage &&
            !c.existingAccount &&
            c.accountLookupDone &&
            !c.isPlanComplete &&
            (c.showQuantity || c.canDoInstallments) && (
              <button
                type="button"
                onClick={() => c.setShowContinueModal(true)}
                className="mt-4 w-fit inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground/70 hover:border-[#FDC020] hover:text-foreground"
              >
                Already paid before? Continue your plan
              </button>
            )}

          {/* Welcome-back school banner */}
          {c.isSchoolPage &&
            c.myPaidStudents &&
            Object.keys(c.myPaidStudents).length > 0 && (
              <div className="mt-4 rounded-xl border border-[#FDC020] bg-[#FDC020]/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {c.myBuyerName
                        ? `Welcome back, ${c.myBuyerName}`
                        : "Your payments"}
                    </p>
                    <p className="mt-1 text-xs text-foreground/70">
                      You've paid for {Object.keys(c.myPaidStudents).length}{" "}
                      student(s).
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Completed plan */}
          {c.existingAccount && (c.isPlanComplete || c.isAccountFullyPaid) && (
            <CompletedPlanCard
              existingAccount={c.existingAccount}
              isSchoolPage={c.isSchoolPage}
              pageTitle={page.title}
              onBuyAgain={c.handleBuyAgain}
              onBuyAgainForStudent={c.handleBuyAgainForStudent}
            />
          )}

          {/* Active plan */}
          {c.showActivePlanCard && (
            <ActivePlanCard
              existingAccount={c.existingAccount}
              isSchoolPage={c.isSchoolPage}
              submissionLock={c.submissionLock}
              onContinue={c.handleContinueInstallment}
              onClearAccount={c.handleClearAccount}
            />
          )}

          {/* Quantity — hidden for physical products (variants have their own qty) */}
          {c.canPickQuantity &&
            !c.isPhysical &&
            !c.isOutOfStock &&
            !c.isPlanComplete && (
              <QuantityPicker
                quantity={c.quantity}
                setQuantity={c.setQuantity}
                productStock={c.productStock}
                lockedFields={c.lockedFields}
              />
            )}

          {/* Out of stock notice */}
          {c.showQuantity && c.isOutOfStock && !c.isPhysical && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                This item is currently out of stock
              </p>
            </div>
          )}

          {/* Price */}
          {!c.isDonation && !c.isPlanComplete && (
            <div className="mt-5">
              {c.isPhysical &&
              c.variants.length > 0 &&
              selectedVariantSkus.size === 0 ? (
                <span className="text-2xl font-semibold tracking-tight text-foreground/50">
                  Select a variant
                </span>
              ) : (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-[#191919] dark:text-[#FDC020]">
                    ₦{c.buyerDisplayPrice.toLocaleString()}
                  </span>
                  {c.selectedPaymentOption === "installment" &&
                  c.installmentPlan ? (
                    <span className="text-sm text-foreground/50">
                      per payment
                      {c.existingAccount?.installment_count
                        ? ` · ${c.existingAccount.installment_count} payments`
                        : ` · ${c.installmentPlan.installmentCount} payments`}
                    </span>
                  ) : c.isPhysical && selectedVariantLines.length > 0 ? (
                    <span className="text-sm text-foreground/50">
                      × {totalPhysicalUnits}{" "}
                      {totalPhysicalUnits === 1 ? "unit" : "units"}
                    </span>
                  ) : c.showQuantity && c.quantity > 1 ? (
                    <span className="text-sm text-foreground/50">
                      × {c.quantity} {c.quantity === 1 ? "unit" : "units"}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Payment option toggle */}
          {c.canDoInstallments && !c.existingAccount && !c.isPlanComplete && (
            <PaymentOptionToggle
              value={c.selectedPaymentOption}
              onChange={c.setSelectedPaymentOption}
              lockedFields={c.lockedFields}
            />
          )}

          {c.canDoInstallments &&
            c.installmentPlan &&
            !c.existingAccount &&
            !c.isPlanComplete && (
              <p className="mt-3 text-xs text-foreground/50">
                {c.selectedPaymentOption === "installment"
                  ? `${c.installmentPlan.installmentCount} payments of ₦${(
                      (c.installmentPlan.totalAmount *
                        (c.isPhysical
                          ? Math.max(1, totalPhysicalUnits)
                          : c.quantity) *
                        c.buyerFeeMultiplier) /
                      c.installmentPlan.installmentCount
                    ).toLocaleString()} (${c.installmentPlan.period})`
                  : "One-time payment."}
              </p>
            )}

          {/* Donation */}
          {c.isDonation && !c.isPlanComplete && (
            <DonationFields
              suggestedAmounts={c.suggestedAmounts}
              donorAmount={c.donorAmount}
              setDonorAmount={c.setDonorAmount}
              minimumDonation={c.minimumDonation}
              error={c.errors.amount}
            />
          )}

          {/* Physical variants — multi-select */}
          {c.isPhysical && !c.isPlanComplete && (
            <PhysicalFields
              variants={c.variants}
              selectedVariantSkus={selectedVariantSkus}
              variantQuantities={variantQuantities}
              onToggleVariant={c.handleToggleVariant}
              onSetQuantity={c.handleSetVariantQuantity}
              lockedFields={c.lockedFields}
              pagePrice={Number(page.price)}
              selectedPaymentOption={c.selectedPaymentOption}
              installmentCount={page.installmentCount || 1}
              variantStockMap={c.variantStockMap}
            />
          )}

          {/* Digital notice */}
          {c.isDigital && !c.isPlanComplete && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-foreground/70">
                {c.emailDelivery
                  ? "Download link will be sent to your email"
                  : "Access will be granted after payment"}
              </p>
            </div>
          )}

          {/* Shipping notice */}
          {c.requiresShipping && !c.isPlanComplete && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-foreground/70">
                Delivery address required at checkout
              </p>
            </div>
          )}

          {/* School fields */}
          {c.isSchoolPage && (
            <SchoolFields
              entities={c.entities}
              selectedEntityIds={c.selectedEntityIds}
              myPaidStudents={c.myPaidStudents}
              lockedFields={c.lockedFields}
              selectedPaymentOption={c.selectedPaymentOption}
              currentTotalAmount={c.currentTotalAmount}
              paidCount={c.paidCount}
              partialCount={c.partialCount}
              unpaidCount={c.unpaidCount}
              onEntityClick={c.handleEntityClick}
            />
          )}

          {/* Fee breakdown */}
          {c.isSchoolPage && c.feeBreakdown.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold">Fee breakdown</h3>
              {c.feeBreakdown.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 text-sm">
                  <span className="text-foreground/60">{item.label}</span>
                  <span className="font-medium">
                    ₦{Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Locked fields notice */}
          {c.lockedFields && !c.isPlanComplete && !c.isSchoolPage && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="flex-1 text-xs text-foreground/70">
                Details locked from your previous payment
              </p>
              <button
                type="button"
                onClick={c.handleUnlockForEdit}
                className="text-xs font-medium text-foreground underline"
              >
                Unlock to edit
              </button>
            </div>
          )}

          {/* Checkout */}
          {!c.isPlanComplete && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <CheckoutButton
                    onClick={c.openInfoModal}
                    disabled={c.isPayButtonDisabled()}
                    processing={c.processingCardPayment || c.submissionLock}
                    isOutOfStock={c.isOutOfStock}
                    isDonation={c.isDonation}
                    donorAmount={c.donorAmount}
                    showQuantity={c.showQuantity}
                    quantity={c.quantity}
                    currentTotalAmount={c.buyerPayableAmount}
                    disabledReason={c.getDisabledReason()}
                    onCancel={c.handleCancelCheckout}
                  />
                </div>

                {page.metadata?.whatsappContactEnabled &&
                  page.metadata?.whatsappContactNumber && (
                    <a
                      href={`https://wa.me/${page.metadata.whatsappContactNumber}?text=${encodeURIComponent(
                        `Hi, I'm interested in ${page.title}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 sm:w-auto"
                      title="Contact store owner on WhatsApp"
                    >
                      <WhatsAppIcon className="h-4 w-4 shrink-0" />
                      <span>Contact store owner</span>
                    </a>
                  )}
              </div>
            </div>
          )}

          {/* Description */}
          {page.description && <DescriptionBlock html={page.description} />}

          {/* Secured badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/40">
            <Shield className="h-3.5 w-3.5" />
            Secured checkout
          </div>
        </div>
      </section>

      {/* ─── More from this store ─── */}
      <MoreFromStore
        products={moreProducts}
        storeSlug={store.slug}
        storeName={store.name}
        currentProductId={page.id}
      />

      {/* Modals */}
      {c.showInfoModal && (
        <InfoModal
          isDonation={c.isDonation}
          requireDonorName={c.requireDonorName}
          customerName={c.customerName}
          setCustomerName={c.setCustomerName}
          customerEmail={c.customerEmail}
          setCustomerEmail={c.setCustomerEmail}
          customerPhone={c.customerPhone}
          setCustomerPhone={c.setCustomerPhone}
          errors={c.errors}
          setErrors={c.setErrors}
          requiresShipping={c.requiresShipping}
          shippingAddress={c.shippingAddress}
          setShippingAddress={c.setShippingAddress}
          bookingEnabled={c.bookingEnabled}
          bookingDate={c.bookingDate}
          setBookingDate={c.setBookingDate}
          bookingTime={c.bookingTime}
          setBookingTime={c.setBookingTime}
          customerNoteEnabled={c.customerNoteEnabled}
          customerNote={c.customerNote}
          setCustomerNote={c.setCustomerNote}
          allowDonorMessage={c.allowDonorMessage}
          donorMessage={c.donorMessage}
          setDonorMessage={c.setDonorMessage}
          isPaymentLink={c.isPaymentLink}
          customFields={c.customFields}
          linkConfig={c.linkConfig}
          customFieldValues={c.customFieldValues}
          setCustomFieldValues={c.setCustomFieldValues}
          isSchoolPage={c.isSchoolPage}
          schoolRequiredFields={c.schoolRequiredFields}
          schoolFields={c.schoolFields}
          setSchoolFields={c.setSchoolFields}
          showQuantity={c.showQuantity}
          quantity={
            c.isPhysical && totalPhysicalUnits > 0
              ? totalPhysicalUnits
              : c.quantity
          }
          currentTotalAmount={c.buyerPayableAmount}
          processingCardPayment={c.processingCardPayment}
          submissionLock={c.submissionLock}
          onClose={() => c.setShowInfoModal(false)}
          onProceed={c.validateAndProceed}
        />
      )}

      {c.showContinueModal && (
        <ContinueModal
          isSchoolPage={c.isSchoolPage}
          lookupInput={c.lookupInput}
          setLookupInput={c.setLookupInput}
          lookupError={c.lookupError}
          setLookupError={c.setLookupError}
          lookingUp={c.lookingUp}
          onLookup={c.handleLookup}
          onClose={() => {
            c.setShowContinueModal(false);
            c.setLookupError("");
            c.setLookupInput("");
          }}
        />
      )}
    </div>
  );
}