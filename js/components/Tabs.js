/**
 * Tabs Component
 * Tab navigation functionality
 */

/**
 * Initialize tab navigation
 */
export function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs and contents
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      
      // Add active class to clicked tab
      btn.classList.add("active");
      
      // Show corresponding tab content
      const target = btn.getAttribute("data-tab");
      const section = document.getElementById(target);
      if (section) {
        section.classList.add("active");
      }
    });
  });
}
