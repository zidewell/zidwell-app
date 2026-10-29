// app/store/[storeSlug]/[productSlug]/client.tsx
"use client";

import { Shield, Truck, Store as StoreIcon, ChevronRight } from "lucide-react";
import Link from "next/link";
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
import { FulfillmentFields } from "./components/FulfillmentFields";

export default function StoreProductClient(props: StoreProductClientProps) {
  const c = useProductCheckout(props);
  const { page, store, moreProducts = [] } = props;

  const selectedVariantSkus = c.selectedVariantSkus ?? new Set<string>();
  const variantQuantities = c.variantQuantities ?? {};
  const selectedVariantLines = c.selectedVariantLines ?? [];

  const totalPhysicalUnits = selectedVariantLines.reduce(
    (sum, l) => sum + (l.quantity || 0),
    0,
  );

  const storeWhatsappNumber =
    (store as any)?.whatsapp_number ||
    page.metadata?.whatsappContactNumber ||
    null;

  const whatsappDigits = storeWhatsappNumber
    ? String(storeWhatsappNumber).replace(/\D/g, "")
    : "";

  const showWhatsappButton =
    page.metadata?.whatsappContactEnabled === true &&
    whatsappDigits.length > 0;

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

  // Compute a fake "original price" for display (20% higher) - remove if you have real compare-at prices
  const originalPrice =
    c.displayPrice > 0
      ? Math.round(c.displayPrice * 1.2)
      : 0;

  const discountPercent =
    originalPrice > 0
      ? Math.round(((originalPrice - c.displayPrice) / originalPrice) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Jumia-style top header ─── */}
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

      {/* ─── Breadcrumb ─── */}
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <nav className="flex items-center gap-1.5 py-3 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#FDC020]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/store/${store.slug}`}
            className="hover:text-[#FDC020]"
          >
            {store.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="line-clamp-1 text-gray-700">{page.title}</span>
        </nav>
      </div>

      {/* ─── Main product section ─── */}
      <section className="mx-auto max-w-[1180px] px-4 pb-10 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-8">
          {/* ─── LEFT COLUMN: Images ─── */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ProductImageGallery
              productImages={c.productImages}
              currentImage={c.currentImage}
              setCurrentImage={c.setCurrentImage}
              title={page.title}
            />

          
          </div>

          {/* ─── RIGHT COLUMN: Product Info ─── */}
          <div className="flex flex-col">
            {/* Category tag */}
            <span className="w-fit text-[11px] font-medium uppercase tracking-wider text-gray-500">
              {c.isPaymentLink
                ? "Payment Link"
                : TYPE_LABELS[page.pageType] || "Product"}
            </span>

            {/* Title */}
            <h1 className="mt-1 text-lg font-medium leading-snug text-gray-900 sm:text-xl">
              {page.title}
            </h1>

            {/* Rating placeholder (Jumia shows stars) */}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-[#FDC020]">
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400">|</span>
              <span>{store.name}</span>
            </div>

            {/* Stock badge */}
            <StockBadge
              showQuantity={c.showQuantity}
              productStock={c.productStock}
              isOutOfStock={c.isOutOfStock}
            />

            {/* ─── Price block ─── */}
            {!c.isDonation && !c.isPlanComplete && (
              <div className="mt-3 border-y border-gray-100 py-3">
                {c.isPhysical &&
                c.variants.length > 0 &&
                selectedVariantSkus.size === 0 ? (
                  <span className="text-xl font-medium text-gray-400">
                    Select a variant
                  </span>
                ) : (
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      ₦{c.displayPrice.toLocaleString()}
                    </span>

                    {originalPrice > 0 && discountPercent > 0 && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          ₦{originalPrice.toLocaleString()}
                        </span>
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-600">
                          -{discountPercent}%
                        </span>
                      </>
                    )}

                    {c.selectedPaymentOption === "installment" &&
                    c.installmentPlan ? (
                      <span className="text-xs text-gray-500">
                        per payment ·{" "}
                        {c.existingAccount?.installment_count ||
                          c.installmentPlan.installmentCount}{" "}
                        payments
                      </span>
                    ) : c.isPhysical && selectedVariantLines.length > 0 ? (
                      <span className="text-xs text-gray-500">
                        × {totalPhysicalUnits}{" "}
                        {totalPhysicalUnits === 1 ? "unit" : "units"}
                      </span>
                    ) : c.showQuantity && c.quantity > 1 ? (
                      <span className="text-xs text-gray-500">
                        × {c.quantity}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* ─── Returning buyer CTAs ─── */}
            {c.isSchoolPage && !c.isPlanComplete && (
              <button
                type="button"
                onClick={() => c.setShowContinueModal(true)}
                className="mt-3 w-fit text-xs font-medium text-[#FDC020] underline hover:no-underline"
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
                  className="mt-3 w-fit text-xs font-medium text-[#FDC020] underline hover:no-underline"
                >
                  Already paid before? Continue your plan
                </button>
              )}

            {/* ─── School welcome card ─── */}
            {c.isSchoolPage &&
              c.myPaidStudents &&
              Object.keys(c.myPaidStudents).length > 0 && (
                <div className="mt-3 rounded-lg border border-[#FDC020] bg-[#FDC020]/5 p-3">
                  <p className="text-sm font-semibold">
                    {c.myBuyerName
                      ? `Welcome back, ${c.myBuyerName}`
                      : "Your payments"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    You've paid for {Object.keys(c.myPaidStudents).length}{" "}
                    student(s).
                  </p>
                </div>
              )}

            {/* ─── Completed / Active plan cards ─── */}
            {c.existingAccount &&
              (c.isPlanComplete || c.isAccountFullyPaid) && (
                <CompletedPlanCard
                  existingAccount={c.existingAccount}
                  isSchoolPage={c.isSchoolPage}
                  pageTitle={page.title}
                  onBuyAgain={c.handleBuyAgain}
                  onBuyAgainForStudent={c.handleBuyAgainForStudent}
                />
              )}

            {c.showActivePlanCard && (
              <ActivePlanCard
                existingAccount={c.existingAccount}
                isSchoolPage={c.isSchoolPage}
                submissionLock={c.submissionLock}
                onContinue={c.handleContinueInstallment}
                onClearAccount={c.handleClearAccount}
              />
            )}

            {/* ─── Quantity (non-physical) ─── */}
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

            {c.showQuantity && c.isOutOfStock && !c.isPhysical && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">
                  This item is currently out of stock
                </p>
              </div>
            )}

            {/* ─── Delivery fee line ─── */}
            {c.requiresShipping &&
              c.deliveryFee > 0 &&
              !c.isPlanComplete && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-600">
                    {c.fulfillment.method === "delivery"
                      ? "Delivery fee"
                      : "Pickup"}
                  </span>
                  <span className="text-sm font-medium">
                    ₦{c.deliveryFee.toLocaleString()}
                  </span>
                </div>
              )}

            {/* ─── Installment toggle ─── */}
            {c.canDoInstallments &&
              !c.existingAccount &&
              !c.isPlanComplete && (
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
                <p className="mt-2 text-xs text-gray-500">
                  {c.selectedPaymentOption === "installment"
                    ? `${c.installmentPlan.installmentCount} payments of ₦${(
                        (c.installmentPlan.totalAmount *
                          (c.isPhysical ? 1 : c.quantity)) /
                        c.installmentPlan.installmentCount
                      ).toLocaleString()} (${c.installmentPlan.period})`
                    : "One-time payment."}
                </p>
              )}

            {/* ─── Donation fields ─── */}
            {c.isDonation && !c.isPlanComplete && (
              <DonationFields
                suggestedAmounts={c.suggestedAmounts}
                donorAmount={c.donorAmount}
                setDonorAmount={c.setDonorAmount}
                minimumDonation={c.minimumDonation}
                error={c.errors.amount}
              />
            )}

            {/* ─── Physical variants ─── */}
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

            {/* ─── Fulfillment (delivery/pickup) ─── */}
            {c.requiresShipping && !c.isPlanComplete && (
              <FulfillmentFields
                storeId={store.id}
                pickupEnabled={c.storePickupEnabled}
                deliveryEnabled={c.storeDeliveryEnabled}
                deliveryFee={c.storeDeliveryFee}
                deliveryFreeThreshold={c.storeDeliveryFreeThreshold}
                deliveryNotes={c.storeDeliveryNotes}
                cartSubtotal={c.currentTotalAmount}
                value={c.fulfillment}
                onChange={c.handleFulfillmentChange}
                disabled={c.lockedFields}
                error={c.errors.fulfillment}
                defaultName={c.customerName}
                defaultPhone={c.customerPhone}
              />
            )}

            {/* ─── Digital info ─── */}
            {c.isDigital && !c.isPlanComplete && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">
                  {c.emailDelivery
                    ? "Download link will be sent to your email"
                    : "Access will be granted after payment"}
                </p>
              </div>
            )}

            {/* ─── School fields ─── */}
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

            {c.isSchoolPage && c.feeBreakdown.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <h3 className="mb-2 text-sm font-semibold">Fee breakdown</h3>
                {c.feeBreakdown.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between py-1 text-sm"
                  >
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">
                      ₦{Number(item.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Locked fields notice ─── */}
            {c.lockedFields && !c.isPlanComplete && !c.isSchoolPage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="flex-1 text-xs text-gray-600">
                  Details locked from your previous payment
                </p>
                <button
                  type="button"
                  onClick={c.handleUnlockForEdit}
                  className="text-xs font-medium text-[#FDC020] underline"
                >
                  Unlock to edit
                </button>
              </div>
            )}

            {/* ─── CTA buttons (Jumia style: side-by-side) ─── */}
            {!c.isPlanComplete && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <CheckoutButton
                      onClick={c.openInfoModal}
                      disabled={c.isPayButtonDisabled()}
                      processing={
                        c.processingCardPayment || c.submissionLock
                      }
                      isOutOfStock={c.isOutOfStock}
                      isDonation={c.isDonation}
                      donorAmount={c.donorAmount}
                      showQuantity={c.showQuantity}
                      quantity={c.quantity}
                      currentTotalAmount={c.currentTotalAmount}
                      disabledReason={c.getDisabledReason()}
                      onCancel={c.handleCancelCheckout}
                    />
                  </div>

                  {showWhatsappButton && (
                    <a
                      href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                        `Hi, I'm interested in ${page.title}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                      title="Contact store owner on WhatsApp"
                    >
                      <WhatsAppIcon className="h-4 w-4 shrink-0 text-green-500" />
                      <span>Chat with seller</span>
                    </a>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  Secured checkout
                </div>
              </div>
            )}

            {/* ─── Description (moved into right column, Jumia style) ─── */}
            {page.description && (
              <DescriptionBlock html={page.description} />
            )}
          </div>
        </div>
      </section>

      {/* ─── More from store ─── */}
      <MoreFromStore
        products={moreProducts}
        storeSlug={store.slug}
        storeName={store.name}
        currentProductId={page.id}
      />

      {/* ─── Modals ─── */}
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
          fulfillment={c.fulfillment}
          deliveryFee={c.deliveryFee}
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
          baseAmount={c.currentTotalAmount}
          feeAmount={Math.max(
            0,
            c.buyerPayableAmount - c.currentTotalAmount - c.deliveryFee,
          )}
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