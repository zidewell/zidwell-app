// app/components/sign-contract-form-component/SignContractInput.tsx
import React from 'react'

const SignContractInput: React.FC<{ label?: string; placeholder?: string; id:string; value:string; onchange:(e:any)=> void;  }> = ({ label, placeholder,id,value,onchange }) => (
    <div>
        {label && <label className="block text-xs font-medium text-[var(--text-secondary)]">{label}</label>}
        <input 
            id={id} 
            value={value} 
            onChange={onchange} 
            className="mt-1 w-full border border-[var(--border-color)] rounded px-3 py-2 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]" 
            style={{ outline: "none", boxShadow: "none" }}
            placeholder={placeholder} 
        />
    </div>
)
export default SignContractInput