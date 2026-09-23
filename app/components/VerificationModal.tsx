"use client";

import { useState } from "react";
import { Mail, RefreshCw, X } from "lucide-react";

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
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

      {/* Modal */}
      <div
        className="squircle-lg"
        style={{
          position: "relative",
          background: "var(--bg-primary)",
          boxShadow: "var(--shadow-pop)",
          maxWidth: "28rem",
          width: "100%",
          animation: "zoomIn 0.3s ease-out",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            zIndex: 10,
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div
          style={{
            background: "var(--color-accent-yellow)",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                background: "rgba(25, 25, 25, 0.1)",
                borderRadius: "9999px",
                padding: "0.75rem",
              }}
            >
              <Mail size={32} style={{ color: "var(--color-ink)" }} />
            </div>
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: 0,
              fontFamily: "var(--font-space-grotesk)",
            }}
          >
            Check Your Email
          </h2>
          <p
            style={{
              color: "rgba(25, 25, 25, 0.8)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
              fontFamily: "var(--font-be-vietnam)",
            }}
          >
            We&apos;ve sent a verification link to:
          </p>
          <p
            style={{
              color: "var(--color-ink)",
              fontWeight: 600,
              fontSize: "0.875rem",
              marginTop: "0.25rem",
              background: "rgba(25, 25, 25, 0.1)",
              padding: "0.25rem 1rem",
              borderRadius: "9999px",
              display: "inline-block",
            }}
          >
            {email}
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {[
              {
                n: 1,
                title: "Open your inbox",
                desc: (
                  <>
                    Check the email we just sent to <strong>{email}</strong>
                  </>
                ),
              },
              {
                n: 2,
                title: "Click the verification link",
                desc: "It will verify your email and activate your account",
              },
              {
                n: 3,
                title: "Start using Zidwell",
                desc: "Once verified, you'll have access to all features",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="squircle-md"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "var(--bg-secondary)",
                }}
              >
                <div style={{ marginTop: "0.125rem" }}>
                  <div
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "9999px",
                      background: "rgba(253, 192, 32, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-accent-yellow)",
                      }}
                    >
                      {s.n}
                    </span>
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {s.title}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      margin: "0.125rem 0 0",
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resend */}
          <div
            style={{
              borderTop: "1px solid var(--border-color)",
              paddingTop: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  Didn&apos;t receive the email?
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    margin: "0.125rem 0 0",
                  }}
                >
                  Check your spam folder or resend
                </p>
              </div>
              <button
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                className="squircle-md transition-all"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 1rem",
                  border: "1px solid var(--color-accent-yellow)",
                  background: "transparent",
                  color: "var(--color-accent-yellow)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor:
                    isResending || resendSuccess ? "not-allowed" : "pointer",
                  opacity: isResending || resendSuccess ? 0.6 : 1,
                }}
              >
                {isResending ? (
                  <RefreshCw
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : resendSuccess ? (
                  "Sent! ✓"
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Resend
                  </>
                )}
              </button>
            </div>
            {resendSuccess && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-lemon-green)",
                  marginTop: "0.5rem",
                }}
              >
                ✓ Verification email resent successfully!
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}
          >
            <button
              onClick={onClose}
              className="squircle-md flex-1 transition-colors"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={() => window.open("https://mail.google.com", "_blank")}
              className="squircle-md flex-1 transition-opacity hover:opacity-90"
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                background: "var(--color-accent-yellow)",
                color: "var(--color-ink)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open Gmail
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "0.625rem",
              color: "var(--text-secondary)",
              margin: "0.5rem 0 0",
            }}
          >
            If you didn&apos;t create this account, please ignore this email.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerificationModal;