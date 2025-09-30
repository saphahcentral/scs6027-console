// include.js
// Dynamic HTML include for any element with data-include="filename.html"

document.addEventListener("DOMContentLoaded", () => {
  const includeElements = document.querySelectorAll("[data-include]");

  includeElements.forEach(async el => {
    const file = el.getAttribute("data-include");
    if (file) {
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        const html = await response.text();
        el.innerHTML = html;
      } catch (err) {
        console.error(err);
        el.innerHTML = `<p style="color:red">Error loading ${file}</p>`;
      }
    }
  });
});
