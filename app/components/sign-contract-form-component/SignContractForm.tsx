// app/components/sign-contract-form-component/SignContractForm.tsx
import FormBody from "./FormBody"
import HowItWorks from "./HowItWorks"

const SignContractForm: React.FC = () => {
    return (
        <div className="rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
            <HowItWorks />
            <FormBody />
        </div>
    )
}

export default SignContractForm;