import { FileText } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

function ReceiptCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-(--text-primary) mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Create your first receipt in under a minute. No signup required.
          </p>
          <Link href="/dashboard/services/receipt/create-receipt">
            <Button
              className="bg-(--color-accent-yellow) text-[var(--color-ink)] hover:bg-(--color-accent-yellow)/90 squircle-md"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Create Your Receipt
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ReceiptCta;
