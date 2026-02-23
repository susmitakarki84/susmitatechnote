const toggleBtn = document.getElementById("toggleBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar = document.getElementById("sidebar");


toggleBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
});


closeBtn.addEventListener("click", () => {
  sidebar.classList.remove("active");
});