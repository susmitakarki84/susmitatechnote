async function loadSidebar() {
  const sidebarContainer = document.getElementById('sidebar');
  if(!sidebarContainer) return;

  try {
    const response = await fetch('sidebar.html');
    if (!response.ok) throw new Error('Sidebar file not found');
    const html = await response.text();
    sidebarContainer.innerHTML = html;

    // Highlight Active Link
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    const links = sidebarContainer.querySelectorAll('.menu-item a');
    
    links.forEach(link => {
      if (link.getAttribute('href') === page) {
        link.parentElement.classList.add('active');
      }
    });

    initSidebarScripts();
  } catch (error) {
    console.error('Error loading sidebar:', error);
  }
}

function initSidebarScripts() {
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const hamburger = document.getElementById('hamburger');

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      if (window.innerWidth > 992) sidebar.classList.toggle('mini');
    });
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadSidebar);