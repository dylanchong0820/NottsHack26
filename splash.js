// Generates the animated grass blades at the bottom of the splash screen
(function () {
  const container = document.getElementById("splashGrass");
  const colors = ["#1a4d1a", "#2e7d32", "#388e3c", "#1b5e20", "#43a047"];
  for (let i = 0; i < 80; i++) {
    const b = document.createElement("div");
    b.className = "blade";
    const h = 30 + Math.random() * 55;
    b.style.cssText = `
      left:${(i / 80) * 100 + (Math.random() - 0.5) * 1.5}%;
      height:${h}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay:${Math.random() * 3}s;
      animation-duration:${2.5 + Math.random() * 2}s;
      transform:rotate(${(Math.random() - 0.5) * 14}deg);
      opacity:${0.6 + Math.random() * 0.4};
    `;
    container.appendChild(b);
  }
})();

// Fades out and removes the splash screen when the user clicks
function dismissSplash() {
  const splash = document.getElementById("splash");
  splash.classList.add("hidden");
  setTimeout(() => splash.remove(), 800);
}
