import { useRef } from "react";
import { Upload, Plus, X } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import type { Student, FeeItem } from "@/app/hooks/useStore"; 
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  students: Student[];
  setStudents: (s: Student[]) => void;
  className: string;
  setClassName: (c: string) => void;
  feeBreakdown: FeeItem[];
  setFeeBreakdown: (f: FeeItem[]) => void;
  requiredFields: string[];
  setRequiredFields: (f: string[]) => void;
}

const SchoolFields = ({
  students,
  setStudents,
  className,
  setClassName,
  feeBreakdown,
  setFeeBreakdown,
  requiredFields,
  setRequiredFields,
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsed: Student[] = results.data
            .filter((r: any) => r.name || r.Name || r["Student Name"])
            .map((r: any) => ({
              name: r.name || r.Name || r["Student Name"] || "",
              className: r.class || r.Class || r.className || className || "",
              regNumber:
                r.regNumber ||
                r["Reg Number"] ||
                r["Registration Number"] ||
                "",
            }));
          setStudents([...students, ...parsed]);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        const parsed: Student[] = data
          .filter((r) => r.name || r.Name || r["Student Name"])
          .map((r) => ({
            name: r.name || r.Name || r["Student Name"] || "",
            className: r.class || r.Class || r.className || className || "",
            regNumber:
              r.regNumber || r["Reg Number"] || r["Registration Number"] || "",
          }));
        setStudents([...students, ...parsed]);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const addStudent = () =>
    setStudents([...students, { name: "", className, regNumber: "" }]);

  const updateStudent = (i: number, field: keyof Student, val: string) => {
    const updated = [...students];
    (updated[i] as any)[field] = val;
    setStudents(updated);
  };

  const removeStudent = (i: number) =>
    setStudents(students.filter((_, idx) => idx !== i));

  const addFeeItem = () =>
    setFeeBreakdown([...feeBreakdown, { label: "", amount: 0 }]);
  const updateFeeItem = (i: number, field: keyof FeeItem, val: string) => {
    const updated = [...feeBreakdown];
    (updated[i] as any)[field] = field === "amount" ? Number(val) || 0 : val;
    setFeeBreakdown(updated);
  };
  const removeFeeItem = (i: number) =>
    setFeeBreakdown(feeBreakdown.filter((_, idx) => idx !== i));

  const addField = () => setRequiredFields([...requiredFields, ""]);
  const updateField = (i: number, val: string) => {
    const updated = [...requiredFields];
    updated[i] = val;
    setRequiredFields(updated);
  };
  const removeField = (i: number) =>
    setRequiredFields(requiredFields.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      {/* Class Name */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Class / Group Name
        </Label>
        <Input
          placeholder="e.g. JSS1, SS2, Primary 4"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Fee Breakdown */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Fee Breakdown
        </Label>
        <div className="space-y-2">
          {feeBreakdown.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="Fee label (e.g. Tuition)"
                value={item.label}
                onChange={(e) => updateFeeItem(i, "label", e.target.value)}
                className="flex-1 h-10"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount || ""}
                onChange={(e) => updateFeeItem(i, "amount", e.target.value)}
                className="w-28 h-10"
              />
              <button
                onClick={() => removeFeeItem(i)}
                className="h-8 w-8 rounded-lg bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343] hover:bg-[#ee4343]/20 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFeeItem}
            className="mt-1"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Fee Item
          </Button>
        </div>
      </div>

      {/* Student List */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Student List</Label>
        <input
          type="file"
          ref={fileRef}
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full p-4 rounded-xl border-2 border-dashed border-[#ded4c3] bg-[#e9e2d7]/50 flex flex-col items-center gap-2 hover:border-[#e1bf46] hover:bg-[#e1bf46]/5 transition-all mb-3"
        >
          <Upload className="h-5 w-5 text-[#3e7465]" />
          <span className="text-sm text-[#3e7465]">
            Upload CSV or Excel file
          </span>
          <span className="text-xs text-[#3e7465]/60">
            Columns: Name, Class, Reg Number
          </span>
        </button>

        {students.length > 0 && (
          <div className="space-y-2 mb-3">
            {students.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Student name"
                  value={s.name}
                  onChange={(e) => updateStudent(i, "name", e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Input
                  placeholder="Reg #"
                  value={s.regNumber || ""}
                  onChange={(e) =>
                    updateStudent(i, "regNumber", e.target.value)
                  }
                  className="w-24 h-9 text-sm"
                />
                <button
                  onClick={() => removeStudent(i)}
                  className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343] shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={addStudent}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Student Manually
        </Button>
      </div>

      {/* Custom Required Fields */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Custom Required Fields (for parents)
        </Label>
        <div className="space-y-2">
          {requiredFields.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. House/Hostel, Sport choice"
                value={f}
                onChange={(e) => updateField(i, e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <button
                onClick={() => removeField(i)}
                className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343] shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchoolFields;
