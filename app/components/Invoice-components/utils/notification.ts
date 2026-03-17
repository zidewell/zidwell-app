export const showCustomNotification = ({
  type,
  title,
  message,
}: {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}) => {
  // Check if notification already exists
  const existingNotification = document.querySelector(".custom-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200"
      : type === "error"
        ? "bg-red-50 border-red-200"
        : type === "warning"
          ? "bg-green-50 border-yellow-200"
          : "bg-blue-50 border-blue-200";
  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
        ? "text-red-800"
        : type === "warning"
          ? "text-yellow-800"
          : "text-blue-800";
  const icon =
    type === "success"
      ? "✅"
      : type === "error"
        ? "❌"
        : type === "warning"
          ? "⚠️"
          : "ℹ️";

  notification.className = `custom-notification fixed top-4 right-4 ${bgColor} border rounded-lg shadow-lg p-4 max-w-sm z-50`;
  notification.style.cssText = `
    animation: slideIn 0.3s ease-out forwards;
    transform: translateX(100%);
  `;

  notification.innerHTML = `
    <div class="flex items-start">
      <span class="text-xl mr-3">${icon}</span>
      <div>
        <h4 class="font-bold ${textColor}">${title}</h4>
        <p class="text-sm text-gray-600 mt-1">${message}</p>
      </div>
    </div>
  `;

  // Add CSS animation if not already present
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.style.animation = "slideIn 0.3s ease-out forwards";
  }, 10);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};
