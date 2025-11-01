/**
 * Modal Component
 * Reusable modal dialog for success messages and alerts
 */

/**
 * Show success modal with title and message
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 */
export function showSuccessModal(title, message) {
  const modal = document.getElementById("success-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.style.display = "block";

  // Auto-close after 3 seconds
  setTimeout(() => {
    hideSuccessModal();
  }, 3000);
}

/**
 * Hide success modal
 */
export function hideSuccessModal() {
  const modal = document.getElementById("success-modal");
  modal.style.display = "none";
}

/**
 * Initialize modal event listeners
 */
export function initModal() {
  const modal = document.getElementById("success-modal");
  const closeBtn = document.querySelector(".close");
  const okBtn = document.getElementById("modal-ok-btn");

  // Close modal when clicking X
  closeBtn?.addEventListener("click", hideSuccessModal);

  // Close modal when clicking OK
  okBtn?.addEventListener("click", hideSuccessModal);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideSuccessModal();
    }
  });
}
