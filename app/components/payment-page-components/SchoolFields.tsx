"use client";

import { useRef, useEffect, useState } from "react";
import { Upload, Plus, X, HelpCircle, AlertCircle, Trash2 } from "lucide-react";
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

// Helper function to find the name column in any row
const findNameColumn = (row: any): string => {
  const possibleNameColumns = [
    "full name", "fullname", "name", "student name", "student_name", 
    "student full name", "studentfullname", "pupil name", "child name",
    "first name", "firstname", "last name", "lastname", "surname",
    "Name", "Full Name", "Student Name", "Pupil Name", "Child Name"
  ];
  
  const rowKeys = Object.keys(row).map(key => key.toLowerCase());
  
  for (const possibleName of possibleNameColumns) {
    const match = rowKeys.find(key => key.includes(possibleName) || possibleName.includes(key));
    if (match) {
      return Object.keys(row).find(key => key.toLowerCase() === match) || "";
    }
  }
  
  const nameKey = Object.keys(row).find(key => 
    key.toLowerCase().includes("name") || 
    key.toLowerCase().includes("pupil") ||
    key.toLowerCase().includes("student")
  );
  
  return nameKey || "";
};

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
  onPriceChange,
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Default fee items
  const defaultFeeItems: FeeItem[] = [
    { label: "Tuition", amount: 0 },
    { label: "Uniform", amount: 0 },
    { label: "Textbooks", amount: 0 },
  ];

  // Initialize feeBreakdown with default items if empty
  useEffect(() => {
    if (feeBreakdown.length === 0) {
      setFeeBreakdown(defaultFeeItems);
    }
  }, []);

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

  const parseStudentData = (data: any[]): Student[] => {
    const parsedStudents: Student[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      const hasData = Object.values(row).some(val => val && String(val).trim());
      if (!hasData) continue;
      
      const nameColumn = findNameColumn(row);
      let name = "";
      
      if (nameColumn && row[nameColumn]) {
        name = String(row[nameColumn]).trim();
      } else {
        for (const key of Object.keys(row)) {
          const value = String(row[key]).trim();
          if (value && /^[a-zA-Z\s\.\-']+$/.test(value) && value.length > 2 && value.length < 100) {
            name = value;
            break;
          }
        }
      }
      
      if (!name) {
        errors.push(`Row ${i + 2}: Could not find a valid name. Please ensure a name column exists.`);
        continue;
      }
      
      const classColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes("class") || 
        key.toLowerCase().includes("grade") ||
        key.toLowerCase().includes("form") ||
        key.toLowerCase().includes("level")
      );
      const studentClass = classColumn ? String(row[classColumn]).trim() : className;
      
      const regColumn = Object.keys(row).find(key => 
        key.toLowerCase().includes("reg") || 
        key.toLowerCase().includes("registration") ||
        key.toLowerCase().includes("student id") ||
        key.toLowerCase().includes("id") ||
        key.toLowerCase().includes("number")
      );
      const regNumber = regColumn ? String(row[regColumn]).trim() : "";
      
      parsedStudents.push({
        name,
        className: studentClass,
        regNumber,
      });
    }
    
    if (errors.length > 0) {
      setUploadError(errors.join(" "));
    }
    
    return parsedStudents;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("CSV Parse Results:", results);
            
            if (results.errors && results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors);
            }
            
            const mapped = parseStudentData(results.data);
            console.log("Mapped students:", mapped);
            
            if (mapped.length === 0 && !uploadError) {
              setUploadError(
                "No valid student data found in the file. Please ensure a 'Name' or 'Full Name' column exists."
              );
            } else if (mapped.length > 0) {
              setStudents([...students, ...mapped]);
              setUploadError(null);
            }
            setUploading(false);
          },
          error: (error) => {
            console.error("CSV Parse Error:", error);
            setUploadError("Failed to parse CSV file. Please check the file format.");
            setUploading(false);
          },
        });
      } else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = new Uint8Array(ev.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
            
            console.log("Excel Parse Results:", jsonData);
            
            const mapped = parseStudentData(jsonData);
            console.log("Mapped students from Excel:", mapped);
            
            if (mapped.length === 0 && !uploadError) {
              setUploadError(
                "No valid student data found in the Excel file. Please ensure a 'Name' or 'Full Name' column exists."
              );
            } else if (mapped.length > 0) {
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

  const updateFeeItem = (
    i: number,
    field: keyof FeeItem,
    val: string | number,
  ) => {
    const updated = [...feeBreakdown];
    if (field === "amount") {
      updated[i] = { ...updated[i], amount: Number(val) || 0 };
    } else {
      updated[i] = { ...updated[i], label: String(val) };
    }
    setFeeBreakdown(updated);
  };

  const removeFeeItem = (i: number) => {
    const updated = feeBreakdown.filter((_, idx) => idx !== i);
    setFeeBreakdown(updated);
  };

  const addField = () => setRequiredFields([...requiredFields, ""]);
  const updateField = (i: number, val: string) => {
    const updated = [...requiredFields];
    updated[i] = val;
    setRequiredFields(updated);
  };
  const removeField = (i: number) =>
    setRequiredFields(requiredFields.filter((_, idx) => idx !== i));

  const downloadTemplate = () => {
    const headers = ["Full Name", "Class", "Registration Number"];
    const sampleData = [
      ["John Doe", "JSS 1", "REG001"],
      ["Jane Smith", "JSS 2", "REG002"],
      ["Bob Johnson", "SSS 1", "REG003"],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => row.join(",")),
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

  // Calculate fee information
  const totalAmount = calculateTotal();
  const feeAmount = Math.min(totalAmount * 0.02, 2000);
  const creatorReceives = totalAmount - feeAmount;

  return (
    <div className="space-y-6">
      {/* Class Name */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
          Class / Group Name
        </Label>
        <Input
          placeholder="e.g. JSS1, SS2, Primary 4"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="h-12 text-base border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
          style={{ outline: "none", boxShadow: "none" }}
        />
      </div>

      {/* Fee Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold text-[var(--text-primary)]">Fee Breakdown</Label>
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-[var(--text-secondary)] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--color-ink)] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 squircle-sm">
              For instance: Tuition, uniform, textbooks, sports, exam fee etc.
            </div>
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Add all fee items that make up the total amount (e.g., Tuition,
          uniform, textbooks, sports, exam fee)
        </p>
        
        <div className="space-y-2">
          {feeBreakdown.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. Tuition, Uniform, Textbooks"
                value={item.label}
                onChange={(e) => updateFeeItem(i, "label", e.target.value)}
                className="flex-1 h-10 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <Input
                type="number"
                placeholder="Amount (₦)"
                value={item.amount || ""}
                onChange={(e) => updateFeeItem(i, "amount", e.target.value)}
                className="w-32 md:34 h-10 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <button
                type="button"
                onClick={() => removeFeeItem(i)}
                className="h-8 w-8 rounded-lg bg-[var(--destructive)]/10 flex items-center justify-center text-[var(--destructive)] hover:bg-[var(--destructive)]/20 transition-colors shrink-0"
                title="Remove fee item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFeeItem}
          className="mt-3 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Fee Item
        </Button>

        {/* Total and Fee Information */}
        {totalAmount > 0 && (
          <div className="mt-4 p-4 bg-[var(--color-accent-yellow)]/10 rounded-xl border border-[var(--color-accent-yellow)]/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-[var(--color-accent-yellow)]">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-2 pt-3 border-t border-[var(--color-accent-yellow)]/20">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Transaction Fee (2%):</span>
                <span className="font-medium text-[var(--destructive)]">- ₦{feeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-dashed border-[var(--color-accent-yellow)]/20">
                <span className="text-[var(--text-primary)]">You Will Receive:</span>
                <span className="text-[var(--color-lemon-green)]">₦{creatorReceives.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-[var(--color-accent-yellow)]/5 rounded-lg">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-3 w-3 text-[var(--color-accent-yellow)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)]">
                  <strong>Fee Information:</strong> Parents pay exactly ₦{totalAmount.toLocaleString()} 
                  (no additional fees). The 2% transaction fee (capped at ₦2,000) will be deducted from your payout.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-semibold text-[var(--text-primary)]">
            Student List
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)] squircle-sm"
          >
            Download Template
          </Button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Upload the list of students in this particular class. Upload either an Excel file or CSV. You can also manually add them individually.
        </p>

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
          className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center gap-2 hover:border-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/5 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed squircle-lg"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-accent-yellow)]"></div>
          ) : (
            <Upload className="h-5 w-5 text-[var(--text-secondary)]" />
          )}
          <span className="text-sm text-[var(--text-secondary)]">
            {uploading ? "Processing file..." : "Upload CSV or Excel file"}
          </span>
          <span className="text-xs text-[var(--text-secondary)]/60">
            Required columns: Full Name (required), Class, Registration Number (optional)
          </span>
        </button>

        {uploadError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 squircle-md">
            <AlertCircle className="h-4 w-4 text-[var(--destructive)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[var(--destructive)]">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-[var(--destructive)] hover:text-[var(--destructive)]/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {students.length > 0 && (
          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto border border-[var(--border-color)] rounded-lg p-2">
            {students.map((s, i) => (
              <div key={i} className="flex gap-2 items-center bg-[var(--bg-primary)] p-2 rounded-lg">
                <Input
                  placeholder="Student full name"
                  value={s.name}
                  onChange={(e) => updateStudent(i, "name", e.target.value)}
                  className="flex-1 h-9 text-sm border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <Input
                  placeholder="Reg #"
                  value={s.regNumber || ""}
                  onChange={(e) =>
                    updateStudent(i, "regNumber", e.target.value)
                  }
                  className="w-24 h-9 text-sm border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => removeStudent(i)}
                  className="h-7 w-7 rounded-md bg-[var(--destructive)]/10 flex items-center justify-center text-[var(--destructive)] shrink-0 hover:bg-[var(--destructive)]/20 transition-opacity"
                  title="Remove student"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addStudent}
          className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Student Manually
        </Button>

        {students.length > 0 && (
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Total students: {students.length}
          </p>
        )}
      </div>

      {/* Additional Questions for the customer */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
          Additional Information (Optional)
        </Label>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Ask the parent or guardian for any additional information you require.
        </p>
      
        <div className="space-y-2">
          {requiredFields.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. House/Hostel, Sport choice, Medical condition"
                value={f}
                onChange={(e) => updateField(i, e.target.value)}
                className="flex-1 h-9 text-sm border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <button
                type="button"
                onClick={() => removeField(i)}
                className="h-7 w-7 rounded-md bg-[var(--destructive)]/10 flex items-center justify-center text-[var(--destructive)] shrink-0 hover:bg-[var(--destructive)]/20 transition-opacity"
                title="Remove question"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addField}
            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchoolFields;