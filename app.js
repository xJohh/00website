document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.getElementById("projectGrid");
  const cvSection = document.getElementById("cv-section");
  const cvContentBody = document.getElementById("cv-content-body");
  const navLinks = document.querySelectorAll(".header-center a");
  const cvLink = document.getElementById("cv-link");
  const homeLink = document.getElementById("home-link");

  const modal = document.getElementById("projectModal");
  const modalInner = document.getElementById("modal-inner");
  const closeBtn = document.querySelector(".close-btn");

  // Impressum Modal
  const impressumModal = document.getElementById("impressumModal");
  const impressumLink = document.getElementById("impressum-link");
  const closeImpressumBtn = document.getElementById("close-impressum");

  // Handle LocalStorage and Trackpad/Wheel Zoom
  let currentZoom = parseInt(localStorage.getItem("portfolioZoom") || "3", 10);
  gridContainer.setAttribute("data-zoom", currentZoom);

  let zoomAccumulator = 0;
  window.addEventListener('wheel', (e) => {
    // Check if ctrlKey or metaKey is held down (mac trackpad pinch translates to wheel+ctrlKey)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); // Prevent standard browser zoom
      
      zoomAccumulator += e.deltaY;
      
      const threshold = 50; 
      
      if (zoomAccumulator > threshold) {
        currentZoom = Math.min(5, currentZoom + 1);
        gridContainer.setAttribute("data-zoom", currentZoom);
        localStorage.setItem("portfolioZoom", currentZoom);
        zoomAccumulator = 0;
      } else if (zoomAccumulator < -threshold) {
        currentZoom = Math.max(1, currentZoom - 1);
        gridContainer.setAttribute("data-zoom", currentZoom);
        localStorage.setItem("portfolioZoom", currentZoom);
        zoomAccumulator = 0;
      }
    }
  }, { passive: false });

  // Extract "CV" safely since we generated projects.js dynamically
  const cvProject = typeof projects !== 'undefined' ? projects.find(p => p.slug === "cv-kontakt" || p.title.includes("CV")) : null;
  const works = typeof projects !== 'undefined' ? projects.filter(p => !cvProject || p.slug !== cvProject.slug) : [];

  if (cvProject && typeof marked !== 'undefined') {
    cvContentBody.innerHTML = `<div class="cv-content">${marked.parse(cvProject.body)}</div>`;
  }

  // Grid Renderer
  function renderGrid(filter = "All") {
    gridContainer.innerHTML = "";
    gridContainer.style.display = "flex";
    cvSection.style.display = "none";
    
    // Add animation class
    gridContainer.classList.remove("section-fade-in");
    void gridContainer.offsetWidth; // Trigger reflow
    gridContainer.classList.add("section-fade-in");

    works.forEach((proj, idx) => {
      if (filter !== "All") {
         if (!proj.category || !proj.category.includes(filter)) return;
      }

      const card = document.createElement("a");
      card.className = `project-card ${proj.format || 'square'}`;
      card.href = `#${proj.slug}`;

      let coverPath = proj.cover ? proj.cover.replace("./", "") : "cover.webp";
      let imgUrl = `Portfolio_Content/${proj.slug}/${coverPath}`;

      card.innerHTML = `
        <img src="${imgUrl}" alt="${proj.title}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'500\\' height=\\'500\\'><rect fill=\\'%23f5f5f5\\' width=\\'500\\' height=\\'500\\'/></svg>'">
        <div class="overlay">
          <h2>${proj.title}</h2>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(proj, imgUrl);
      });

      card.style.animationDelay = `${idx * 0.05}s`;

      gridContainer.appendChild(card);
    });
  }

  // Start with 'All' active
  renderGrid();

  // Navigation Filter logic
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove("active"));
      e.target.classList.add("active");
      cvLink.classList.remove("active");
      renderGrid(link.getAttribute("data-filter"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  if (cvLink) {
    cvLink.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove("active"));
      gridContainer.style.display = "none";
      cvSection.style.display = "block";
      
      // Animation trigger
      cvSection.classList.remove("section-fade-in");
      void cvSection.offsetWidth;
      cvSection.classList.add("section-fade-in");
      
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (homeLink) {
    homeLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (navLinks[0]) navLinks[0].click();
    });
  }

  // Modal logic
  let currentImageIndex = 0;
  let currentImages = [];

  const updateCarousel = (index) => {
    if (!currentImages.length) return;
    const modalImage = document.getElementById('modal-image');
    const dots = modalInner.querySelectorAll('.dot');
    
    currentImageIndex = (index + currentImages.length) % currentImages.length;
    
    if (modalImage) {
      modalImage.style.opacity = "0.5";
      modalImage.src = currentImages[currentImageIndex];
      modalImage.onload = () => { modalImage.style.opacity = "1"; };
    }
    
    if (dots.length) {
      dots.forEach(d => d.classList.remove('active'));
      dots[currentImageIndex].classList.add('active');
    }
  };

  function openModal(proj, defaultImgUrl) {
    let bodyHtml = typeof marked !== 'undefined' ? marked.parse(proj.body) : `<p>${proj.body}</p>`;
    
    if (proj.images && proj.images.length > 0) {
      currentImages = proj.images.map(img => `Portfolio_Content/${proj.slug}/${img}`);
      let coverPath = proj.cover ? proj.cover.replace("./", "") : "";
      currentImageIndex = proj.images.findIndex(img => img === coverPath);
      if (currentImageIndex === -1) currentImageIndex = 0;
    } else {
      currentImages = [defaultImgUrl];
      currentImageIndex = 0;
    }

    let carouselHtml = `
      <div class="carousel-container" style="background-color: #f9f9f9; min-height: 400px; display: flex; align-items: center; justify-content: center;">
        <img id="modal-image" src="${currentImages[currentImageIndex]}" alt="${proj.title}" 
             style="transition: opacity 0.3s ease;" 
             onerror="this.style.display='none'">
        ${currentImages.length > 1 ? `
          <button class="carousel-btn prev-btn" aria-label="Previous image">&#10094;</button>
          <button class="carousel-btn next-btn" aria-label="Next image">&#10095;</button>
          <div class="carousel-dots">
            ${currentImages.map((_, i) => `<span class="dot ${i === currentImageIndex ? 'active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    let htmlContent = `
      ${carouselHtml}
      <div class="modal-inner-content">
        <h1 class="modal-header">${proj.title}</h1>
        <p class="modal-subtitle">
          ${proj.year || ''} ${proj.category ? ' | ' + proj.category : ''}
        </p>
        <div class="modal-text">
          ${bodyHtml}
        </div>
      </div>
    `;
    modalInner.innerHTML = htmlContent;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (currentImages.length > 1) {
      const prevBtn = modalInner.querySelector('.prev-btn');
      const nextBtn = modalInner.querySelector('.next-btn');
      const dots = modalInner.querySelectorAll('.dot');
      const carouselContainer = modalInner.querySelector('.carousel-container');

      prevBtn.addEventListener('click', () => updateCarousel(currentImageIndex - 1));
      nextBtn.addEventListener('click', () => updateCarousel(currentImageIndex + 1));
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          updateCarousel(parseInt(e.target.getAttribute('data-index'), 10));
        });
      });

      let touchStartX = 0;
      let touchEndX = 0;
      carouselContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, {passive: true});
      carouselContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) updateCarousel(currentImageIndex + 1); // swipe left
        if (touchEndX > touchStartX + 50) updateCarousel(currentImageIndex - 1); // swipe right
      }, {passive: true});
    }

    window.addEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e) {
    if (modal.classList.contains("active")) {
      if (e.key === "ArrowLeft" && currentImages.length > 1) {
        updateCarousel(currentImageIndex - 1);
      } else if (e.key === "ArrowRight" && currentImages.length > 1) {
        updateCarousel(currentImageIndex + 1);
      } else if (e.key === "Escape") {
        closeModal();
      }
    } else if (impressumModal.classList.contains("active")) {
      if (e.key === "Escape") {
        closeImpressum();
      }
    }
  }

  closeBtn.addEventListener("click", closeModal);
  
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop") || e.target.classList.contains("modal")) {
      closeModal();
    }
  });

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
    window.removeEventListener('keydown', handleKeyDown);
  }

  // --- Impressum Logic ---
  if (impressumLink) {
    impressumLink.addEventListener("click", () => {
      impressumModal.classList.add("active");
      document.body.style.overflow = "hidden";
      window.addEventListener('keydown', handleKeyDown);
    });
  }

  const closeImpressum = () => {
    impressumModal.classList.remove("active");
    document.body.style.overflow = "auto";
    window.removeEventListener('keydown', handleKeyDown);
  };

  if (closeImpressumBtn) {
    closeImpressumBtn.addEventListener("click", closeImpressum);
  }

  impressumModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop") || e.target.classList.contains("modal")) {
      closeImpressum();
    }
  });
});
