// app/components/payment-page-components/SchoolFields.tsx
import { useRef, useEffect, useState } from "react";
import { Upload, Plus, X, HelpCircle, AlertCircle } from "lucide-react";
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
  price?: number;
  onPriceChange?: (price: number) => void;
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
  price,
  onPriceChange
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Calculate total from fee breakdown
  const calculateTotal = () => {
    return feeBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Update price whenever fee breakdown changes
  useEffect(() => {
    const total = calculateTotal();
    if (onPriceChange && total > 0) {
      onPriceChange(total);
    }
  }, [feeBreakdown]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadError(null);
    
    const ext = file.name.split(".").pop()?.toLowerCase();
    const parsedStudents: Student[] = [];

    try {
      if (ext === "csv") {
        // Parse CSV file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("CSV Parse Results:", results);
            
            if (results.errors && results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors);
            }
            
            // Map the data to Student objects
            const mapped = results.data
              .filter((row: any) => {
                // Check if row has any student data
                const hasData = Object.values(row).some(
                  val => val && String(val).trim()
                );
                return hasData;
              })
              .map((row: any) => {
                // Try different possible column names
                const name = row.name || row.Name || row["Student Name"] || row["student_name"] || row["STUDENT_NAME"] || "";
                const studentClass = row.class || row.Class || row.className || row["Class Name"] || row["CLASS"] || className || "";
                const regNumber = row.regNumber || row["Reg Number"] || row["Registration Number"] || row["reg_number"] || row["REG_NUMBER"] || "";
                
                return {
                  name: String(name).trim(),
                  className: String(studentClass).trim(),
                  regNumber: String(regNumber).trim(),
                };
              })
              .filter((student: Student) => student.name); // Only keep students with names
              
            console.log("Mapped students:", mapped);
            
            if (mapped.length === 0) {
              setUploadError("No valid student data found in the file. Please ensure at least a 'Name' column exists.");
            } else {
              setStudents([...students, ...mapped]);
              setUploadError(null);
            }
            setUploading(false);
          },
          error: (error) => {
            console.error("CSV Parse Error:", error);
            setUploadError("Failed to parse CSV file. Please check the file format.");
            setUploading(false);
          }
        });
      } else if (ext === "xlsx" || ext === "xls") {
        // Parse Excel file
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = new Uint8Array(ev.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
            
            console.log("Excel Parse Results:", jsonData);
            
            // Map the data to Student objects
            const mapped = jsonData
              .filter((row) => {
                // Check if row has any student data
                const hasData = Object.values(row).some(
                  val => val && String(val).trim()
                );
                return hasData;
              })
              .map((row) => {
                // Try different possible column names
                const name = row.name || row.Name || row["Student Name"] || row["student_name"] || row["STUDENT_NAME"] || "";
                const studentClass = row.class || row.Class || row.className || row["Class Name"] || row["CLASS"] || className || "";
                const regNumber = row.regNumber || row["Reg Number"] || row["Registration Number"] || row["reg_number"] || row["REG_NUMBER"] || "";
                
                return {
                  name: String(name).trim(),
                  className: String(studentClass).trim(),
                  regNumber: String(regNumber).trim(),
                };
              })
              .filter((student) => student.name); // Only keep students with names
              
            console.log("Mapped students from Excel:", mapped);
            
            if (mapped.length === 0) {
              setUploadError("No valid student data found in the Excel file. Please ensure at least a 'Name' column exists.");
            } else {
              setStudents([...students, ...mapped]);
              setUploadError(null);
            }
            setUploading(false);
          } catch (error) {
            console.error("Excel Parse Error:", error);
            setUploadError("Failed to parse Excel file. Please check the file format.");
            setUploading(false);
          }
        };
        reader.onerror = () => {
          setUploadError("Failed to read Excel file.");
          setUploading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setUploadError("Unsupported file format. Please upload CSV or Excel files.");
        setUploading(false);
      }
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError("An error occurred while processing the file.");
      setUploading(false);
    }
    
    // Reset the file input
    e.target.value = "";
  };

  const addStudent = () =>
    setStudents([...students, { name: "", className, regNumber: "" }]);

  const updateStudent = (i: number, field: keyof Student, val: string) => {
    const updated = [...students];
    updated[i] = { ...updated[i], [field]: val };
    setStudents(updated);
  };

  const removeStudent = (i: number) =>
    setStudents(students.filter((_, idx) => idx !== i));

  const addFeeItem = () => {
    setFeeBreakdown([...feeBreakdown, { label: "", amount: 0 }]);
  };
  
  const updateFeeItem = (i: number, field: keyof FeeItem, val: string | number) => {
    const updated = [...feeBreakdown];
    if (field === "amount") {
      updated[i] = { ...updated[i], amount: Number(val) || 0 };
    } else {
      updated[i] = { ...updated[i], label: String(val) };
    }
    setFeeBreakdown(updated);
  };
  
  const removeFeeItem = (i: number) => {
    setFeeBreakdown(feeBreakdown.filter((_, idx) => idx !== i));
  };

  const addField = () => setRequiredFields([...requiredFields, ""]);
  const updateField = (i: number, val: string) => {
    const updated = [...requiredFields];
    updated[i] = val;
    setRequiredFields(updated);
  };
  const removeField = (i: number) =>
    setRequiredFields(requiredFields.filter((_, idx) => idx !== i));

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ["Name", "Class", "Reg Number"];
    const sampleData = [
      ["John Doe", "JSS 1", "REG001"],
      ["Jane Smith", "JSS 2", "REG002"],
      ["Bob Johnson", "SSS 1", "REG003"]
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold">Fee Breakdown</Label>
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-[#3e7465] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              For instance: Tuition, uniform, textbooks, sports, exam fee etc.
            </div>
          </div>
        </div>
        <p className="text-xs text-[#3e7465] mb-3">
          Add all fee items that make up the total amount (e.g., Tuition, uniform, textbooks, sports, exam fee)
        </p>
        <div className="space-y-2">
          {feeBreakdown.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. Tuition, Uniform, Textbooks"
                value={item.label}
                onChange={(e) => updateFeeItem(i, "label", e.target.value)}
                className="flex-1 h-10"
              />
              <Input
                type="number"
                placeholder="Amount (₦)"
                value={item.amount || ""}
                onChange={(e) => updateFeeItem(i, "amount", e.target.value)}
                className="w-28 h-10"
              />
              <button
                type="button"
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
        {calculateTotal() > 0 && (
          <div className="mt-3 p-3 bg-[#e1bf46]/10 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#023528]">Total Amount:</span>
              <span className="text-lg font-bold text-[#e1bf46]">₦{calculateTotal().toLocaleString()}</span>
            </div>
            <p className="text-xs text-[#3e7465] mt-1">This total will be automatically set as your page price</p>
          </div>
        )}
      </div>

      {/* Student List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-semibold">Student List</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="text-xs text-[#3e7465] hover:text-[#2b825b]"
          >
            Download Template sample
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileRef}
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
        />
        
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 rounded-xl border-2 border-dashed border-[#ded4c3] bg-[#e9e2d7]/50 flex flex-col items-center gap-2 hover:border-[#e1bf46] hover:bg-[#e1bf46]/5 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3e7465]"></div>
          ) : (
            <Upload className="h-5 w-5 text-[#3e7465]" />
          )}
          <span className="text-sm text-[#3e7465]">
            {uploading ? "Processing file..." : "Upload CSV or Excel file"}
          </span>
          <span className="text-xs text-[#3e7465]/60">
            Required columns: Name (required), Class, Reg Number (optional)
          </span>
        </button>

        {uploadError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {students.length > 0 && (
          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto border border-[#ded4c3] rounded-lg p-2">
            {students.map((s, i) => (
              <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-lg">
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
                  type="button"
                  onClick={() => removeStudent(i)}
                  className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343] shrink-0 hover:bg-[#ee4343]/20"
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
        
        {students.length > 0 && (
          <p className="text-xs text-[#3e7465] mt-2">
            Total students: {students.length}
          </p>
        )}
      </div>

      {/* Additional Questions for the customer */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Additional Questions for the customer
        </Label>
        <p className="text-xs text-[#3e7465] mb-3">
          Ask customers to provide additional information during checkout (e.g., House/Hostel, Sport choice, Medical info)
        </p>
        <div className="space-y-2">
          {requiredFields.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. House/Hostel, Sport choice, Medical condition"
                value={f}
                onChange={(e) => updateField(i, e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => removeField(i)}
                className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343] shrink-0 hover:bg-[#ee4343]/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchoolFields;