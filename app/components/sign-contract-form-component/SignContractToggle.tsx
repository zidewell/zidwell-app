import { useState } from "react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

type SignContractToggleProps = {
    ageConsent: boolean;
    setAgeConsent: (value: boolean) => void;
    termsConsent: boolean;
    setTermsConsent: (value: boolean) => void;
    disabled?: boolean; // Add disabled prop
};

const SignContractToggle: React.FC<SignContractToggleProps> = ({ 
    ageConsent, 
    setAgeConsent, 
    termsConsent, 
    setTermsConsent,
    disabled = false // Default to false
}) => {
    return (
        <>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-1">
                    <Label htmlFor="age-consent" className="cursor-pointer">
                        I confirm that I am 18 years or older
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        You must be of legal age to create binding contracts
                    </p>
                </div>
                <Switch 
                    id="age-consent" 
                    checked={ageConsent} 
                    onCheckedChange={setAgeConsent}
                    className="data-[state=checked]:bg-[#C29307]"
                    disabled={disabled} // Apply disabled prop
                />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-1">
                    <Label htmlFor="terms-consent" className="cursor-pointer">
                        I agree to be bound by the terms stated in this contract
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        By checking this, you acknowledge and accept the contract terms
                    </p>
                </div>
                <Switch
                    id="terms-consent"
                    checked={termsConsent}
                    onCheckedChange={setTermsConsent}
                    className="data-[state=checked]:bg-[#C29307]"
                    disabled={disabled} // Apply disabled prop
                />
            </div>
        </>
    )
}

export default SignContractToggle;