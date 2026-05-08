// app/components/sign-contract-form-component/SignContractSelect.tsx
import React from 'react'
import { Button } from '../ui/button'
import { sampleContracts } from '@/app/data/sampleContracts';
import { toast } from 'sonner';

interface SignContractSelectProps {
  setContractTitle: (title: any) => void;
  setContractContent: (content: any) => void;
}

const SignContractSelect: React.FC<SignContractSelectProps> = ({ setContractTitle, setContractContent }) => {

    const handleLoadSample = (type: keyof typeof sampleContracts) => {
    const sample = sampleContracts[type];
    setContractTitle(sample.title);
    setContractContent(sample.content);
    toast.success(`Loaded ${sample.title} template`);
  };
    return(
        <div className="flex gap-2 mt-2">
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample("employment")}
            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-yellow)]"
        >
            Employment
        </Button>
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample("service")}
            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-yellow)]"
        >
            Service
        </Button>
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample("loan")}
            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-yellow)]"
        >
            Loan
        </Button>
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample("nda")}
            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent-yellow)]"
        >
            NDA
        </Button>
    </div>
    )
}
export default SignContractSelect