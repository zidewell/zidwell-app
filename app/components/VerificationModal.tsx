// app/components/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, Mail, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import logo from "@/public/logo.png";



interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResend: () => Promise<void>;
  isResending?: boolean;
}


const VerificationModal = ({
  isOpen,
  onClose,
  email,
  onResend,
  isResending = false,
}: VerificationModalProps) => {
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResend = async () => {
    await onResend();
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={onClose}
      />

      {/* Modal - Compact version */}
      <div style={{
        position: "relative",
        background: "var(--bg-primary)",
        borderRadius: "1rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        maxWidth: "24rem",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        animation: "zoomIn 0.3s ease-out",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            zIndex: 10,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <X size={18} />
        </button>

        {/* Header - Compact */}
        <div style={{
          background: "linear-gradient(135deg, var(--color-accent-yellow), #f59e0b)",
          padding: "1.5rem 1rem 1rem",
          textAlign: "center",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "0.5rem",
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "9999px",
              padding: "0.5rem",
            }}>
              <Mail size={24} style={{ color: "var(--color-ink)" }} />
            </div>
          </div>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "var(--color-ink)",
            margin: 0,
          }}>
            Check Your Email
          </h2>
          <p style={{
            color: "rgba(25, 25, 25, 0.8)",
            fontSize: "0.75rem",
            marginTop: "0.25rem",
          }}>
            We sent a verification link to:
          </p>
          <p style={{
            color: "var(--color-ink)",
            fontWeight: "600",
            fontSize: "0.75rem",
            marginTop: "0.25rem",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "0.125rem 0.75rem",
            borderRadius: "9999px",
            display: "inline-block",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {email}
          </p>
        </div>

        {/* Content - Compact */}
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Steps - Compact */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "0.375rem",
            }}>
              <div style={{
                width: "1.25rem",
                height: "1.25rem",
                borderRadius: "9999px",
                background: "rgba(253, 192, 32, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: "0.625rem",
                  fontWeight: "bold",
                  color: "var(--color-accent-yellow)",
                }}>1</span>
              </div>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Open your inbox and click the verification link
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "0.375rem",
            }}>
              <div style={{
                width: "1.25rem",
                height: "1.25rem",
                borderRadius: "9999px",
                background: "rgba(253, 192, 32, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: "0.625rem",
                  fontWeight: "bold",
                  color: "var(--color-accent-yellow)",
                }}>2</span>
              </div>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--text-primary)",
                margin: 0,
              }}>
                Your account will be activated instantly
              </p>
            </div>
          </div>

          {/* Timer notice - Compact */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            background: "rgba(251, 191, 36, 0.1)",
            borderRadius: "0.375rem",
            border: "1px solid rgba(251, 191, 36, 0.2)",
          }}>
            <Clock size={14} style={{ color: "#d97706", flexShrink: 0 }} />
            <p style={{
              fontSize: "0.7rem",
              color: "#d97706",
              margin: 0,
            }}>
              Link expires in <strong>24 hours</strong>
            </p>
          </div>

          {/* Resend section - Compact */}
          <div style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "0.75rem",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}>
                Didn't receive the email?
              </p>
              <button
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--color-accent-yellow)",
                  background: "transparent",
                  color: "var(--color-accent-yellow)",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  cursor: isResending || resendSuccess ? "not-allowed" : "pointer",
                  opacity: isResending || resendSuccess ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isResending && !resendSuccess) {
                    e.currentTarget.style.background = "rgba(253, 192, 32, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {isResending ? (
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : resendSuccess ? (
                  "Sent ✓"
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Resend
                  </>
                )}
              </button>
            </div>
            {resendSuccess && (
              <p style={{
                fontSize: "0.625rem",
                color: "#16a34a",
                marginTop: "0.25rem",
                animation: "slideDown 0.3s ease-out",
              }}>
                ✓ Verification email resent!
              </p>
            )}
          </div>

          {/* Action buttons - Compact */}
          <div style={{
            display: "flex",
            gap: "0.5rem",
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.375rem",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.75rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Close
            </button>
            <button
              onClick={() => {
                window.open("https://mail.google.com", "_blank");
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.375rem",
                border: "none",
                background: "var(--color-accent-yellow)",
                color: "var(--color-ink)",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Open Gmail
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoomIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-0.5rem);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};