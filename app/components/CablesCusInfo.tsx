// CableCustomerCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, Receipt, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function CableCustomerCard(props: any) {
  const {
    customerName,
    decorderNumber,
    service,
    selectedProvider,
    selectedPlan,
    loading,
    validateForm,
    setIsOpen,
    errors,
  } = props;

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      {/* Customer Info Card */}

      {customerName && (
        <Card className="w-full shadow-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--text-primary)]">
            {customerName && (
              <div className="flex gap-2">
                <span className="font-medium text-[var(--text-secondary)]">Name:</span>
                <p className="font-semibold">{customerName}</p>
              </div>
            )}
            {service && (
              <div className="flex gap-2">
                <span className="font-medium text-[var(--text-secondary)]">Subscriber Name:</span>
                <p className="font-semibold">{service}</p>
              </div>
            )}

            {decorderNumber && (
              <div className="flex gap-2">
                <span className="font-medium text-[var(--text-secondary)]">Decoder Number:</span>
                <p className="font-semibold">{decorderNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Summary Card */}
      <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Receipt className="w-5 h-5 text-[var(--color-accent-yellow)]" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedProvider && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <Image
                  src={selectedProvider.src}
                  alt={selectedProvider.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{selectedProvider.name}</p>
                {selectedProvider.description && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedProvider.description}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              if (validateForm()) {
                setIsOpen(true);
              }
            }}
            disabled={!selectedPlan || loading}
            className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] py-3 font-semibold rounded-lg shadow-electric-glow transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--color-ink)] border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Process Payment
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>

          {errors.verification && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.verification}</span>
            </div>
          )}

          <div className="text-center text-xs text-[var(--text-secondary)] mt-4">
            <p>🔒 Secure payment powered by Zidwell</p>
            <p>Instant token generation • 24/7 support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}