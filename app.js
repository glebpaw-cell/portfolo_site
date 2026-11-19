(function () {
  "use strict";
  document.documentElement.classList.add("has-js");

  var projects = window.PORTFOLIO_PROJECTS || [];
  var projectGrid = document.getElementById("projectGrid");
  var archiveGrid = document.getElementById("archiveGrid");
  var filtersElement = document.getElementById("filters");
  var countElement = document.getElementById("archiveCount");
  var projectDialog = document.getElementById("projectDialog");
  var projectDialogContent = document.getElementById("projectDialogContent");
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightboxImage");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxPosition = document.getElementById("lightboxPosition");
  var currentFilter = "Все";
  var archiveItems = [];
  var viewerItems = [];
  var viewerIndex = 0;

  projects.forEach(function (project) {
    if (project.archiveAsProject) {
      archiveItems.push({
        kind: project.type === "presentation" ? "presentation" : "project",
        projectId: project.id,
        projectTitle: project.title,
        category: project.category,
        caption: project.title,
        src: project.cover,
        alt: project.title + " — обложка проекта",
        badge: project.archiveBadge || "Открыть проект",
        slides: project.type === "presentation" ? project.images : null
      });
    }
    (project.images || []).forEach(function (item, index) {
      var entry = Object.assign({}, item, {
        kind: "image",
        projectId: project.id,
        projectTitle: project.title,
        itemIndex: index
      });
      if (!project.archiveAsProject && item.showInArchive !== false) archiveItems.push(entry);
    });
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function formatCount(count) {
    var lastTwo = count % 100;
    var last = count % 10;
    var word = "материалов";
    if (lastTwo < 11 || lastTwo > 14) {
      if (last === 1) word = "материал";
      else if (last >= 2 && last <= 4) word = "материала";
    }
    return count + " " + word;
  }

  function imageCountText(count) {
    var lastTwo = count % 100;
    var last = count % 10;
    var word = "изображений";
    if (lastTwo < 11 || lastTwo > 14) {
      if (last === 1) word = "изображение";
      else if (last >= 2 && last <= 4) word = "изображения";
    }
    return count + " " + word;
  }

  function imageMarkup(item, loading) {
    return '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || item.caption) +
      '" loading="' + (loading || "lazy") + '" decoding="async">';
  }

  function renderProjects() {
    projectGrid.innerHTML = projects.filter(function (project) { return project.featured; }).map(function (project, index) {
      return '<article class="project-card reveal" data-project="' + escapeHtml(project.id) + '" tabindex="0" role="button" aria-label="Открыть кейс: ' + escapeHtml(project.title) + '" style="--card-tone:' + escapeHtml(project.tone) + '">' +
        '<div class="project-card__visual">' + imageMarkup({ src: project.cover, alt: project.title + " — обложка кейса" }, index === 0 ? "eager" : "lazy") +
        '<span class="project-card__index">' + escapeHtml(project.category) + '</span><span class="project-card__open" aria-hidden="true">+</span></div>' +
        '<div class="project-card__info"><div><h3 class="project-card__title">' + escapeHtml(project.title) + '</h3><p class="project-card__subtitle">' + escapeHtml(project.subtitle) + '</p></div>' +
        '<p class="project-card__type">' + escapeHtml(project.facts[0]) + '</p></div></article>';
    }).join("");

    Array.prototype.forEach.call(projectGrid.querySelectorAll(".project-card"), function (card) {
      var open = function () { openProject(card.getAttribute("data-project")); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
    });
    observeReveals();
  }

  function filterItems(category) {
    currentFilter = category;
    var filtered = category === "Все" ? archiveItems : archiveItems.filter(function (item) { return item.category === category; });
    archiveGrid.innerHTML = filtered.map(function (item, index) {
      var grouped = item.kind !== "image";
      var label = grouped ? "Открыть проект: " : "Открыть изображение: ";
      var className = grouped ? "archive-item archive-item--project" : "archive-item";
      return '<button class="' + className + '" type="button" data-entry-index="' + index + '" aria-label="' + label + escapeHtml(item.caption) + '">' +
        '<span class="archive-item__image">' + imageMarkup(item, index === 0 ? "eager" : "lazy") +
        (grouped ? '<span class="archive-item__badge">' + escapeHtml(item.badge) + '</span>' : '') + '</span>' +
        '<span class="archive-item__caption"><span>' + escapeHtml(item.caption) + '</span><span>' + escapeHtml(grouped ? item.badge : item.projectTitle) + '</span></span></button>';
    }).join("");
    countElement.textContent = category + " · " + formatCount(filtered.length);
    Array.prototype.forEach.call(archiveGrid.querySelectorAll(".archive-item"), function (button) {
      button.addEventListener("click", function () {
        var item = filtered[Number(button.getAttribute("data-entry-index"))];
        if (item.kind === "presentation") openLightbox(item.slides, 0);
        else if (item.kind === "project") openProject(item.projectId);
        else {
          var images = filtered.filter(function (entry) { return entry.kind === "image"; });
          openLightbox(images, images.indexOf(item));
        }
      });
    });
  }

  function renderFilters() {
    var filters = ["Все", "Айдентика", "Постеры", "Соцсети", "Баннеры", "Интерфейсы", "Презентации", "Карточки товара"];
    filtersElement.innerHTML = filters.map(function (filter) {
      return '<button class="filter-button" type="button" data-filter="' + escapeHtml(filter) + '" aria-pressed="' + (filter === currentFilter ? "true" : "false") + '">' + escapeHtml(filter) + '</button>';
    }).join("");
    Array.prototype.forEach.call(filtersElement.querySelectorAll(".filter-button"), function (button) {
      button.addEventListener("click", function () {
        Array.prototype.forEach.call(filtersElement.querySelectorAll(".filter-button"), function (candidate) {
          candidate.setAttribute("aria-pressed", candidate === button ? "true" : "false");
        });
        filterItems(button.getAttribute("data-filter"));
      });
    });
  }

  function openProject(id) {
    var project = projects.find(function (entry) { return entry.id === id; });
    if (!project) return;
    var presentation = project.presentationId ? projects.find(function (entry) { return entry.id === project.presentationId; }) : null;
    var gallery = (project.images || []).map(function (item, index) {
      return '<figure class="case-gallery-item" tabindex="0" role="button" data-gallery-index="' + index + '" aria-label="Посмотреть изображение: ' + escapeHtml(item.caption) + '">' +
        imageMarkup(item) + '<figcaption>' + escapeHtml(item.caption) + '</figcaption></figure>';
    }).join("");
    var copyParagraphs = [project.intro, project.description].filter(function (copy) { return Boolean(copy); });
    var caseDescription = copyParagraphs.length ? (
      '<div class="case-description' + (copyParagraphs.length === 1 ? ' case-description--single' : '') + '">' +
      copyParagraphs.map(function (copy) { return '<p>' + escapeHtml(copy) + '</p>'; }).join("") + '</div>'
    ) : "";
    var demo = project.demo ? (
      '<section class="demo-block" aria-labelledby="demoTitle"><div class="demo-block__heading"><div><h3 id="demoTitle">Попробовать прототип</h3>' +
      '<p>Демо работает в пропорциях экрана iPhone 15 Pro Max. Страница загружается по кнопке и сохраняет собственные стили и сценарии.</p></div></div>' +
      '<button class="demo-launch" type="button" data-demo-src="' + escapeHtml(project.demo) + '">Запустить интерактивный макет</button>' +
      '<div class="demo-container"><figure class="iphone-device" aria-label="iPhone 15 Pro Max с интерактивным макетом школы"><div class="iphone-frame"><div class="iphone-screen">' +
      '<span class="iphone-island" aria-hidden="true"></span><iframe class="demo-frame" title="Интерактивный макет сайта школы" loading="lazy" sandbox="allow-scripts allow-forms" src="about:blank"></iframe>' +
      '</div></div><figcaption>iPhone 15 Pro Max <span>· 430 px</span></figcaption></figure>' +
      '<div class="demo-copy"><strong>Попробуй сам</strong><p>Открой меню, перейди в разделы и прокручивай экран внутри телефона. Макет масштабируется под ширину устройства.</p>' +
      '<a class="demo-external" href="' + escapeHtml(project.demoPreview || project.demo) + '" target="_blank" rel="noreferrer">Открыть предпросмотр iPhone в новой вкладке</a></div></div></section>'
    ) : "";
    var context = project.context ? (
      '<aside class="server-context" aria-label="Контекст сервера СП5"><div class="server-context__index"><span class="server-context__index-label">КОНТЕКСТ<br>СООБЩЕСТВА</span><a class="server-context__logo" href="https://spworlds.ru/" target="_blank" rel="noreferrer" aria-label="Открыть официальный сайт СП"><img src="assets/work/sp-logo-user-reference.png" alt="Логотип СП: белый графический знак с синим акцентом и буквами СП" loading="lazy" decoding="async"></a></div><div><p class="server-context__label">' + escapeHtml(project.context.label) +
      '</p><h3>' + escapeHtml(project.context.title) + '</h3><p class="server-context__copy">' + escapeHtml(project.context.description) + '</p>' +
      '<div class="server-context__sources">' + project.context.sources.map(function (source) {
        return '<a href="' + escapeHtml(source.href) + '" target="_blank" rel="noreferrer">' + escapeHtml(source.label) + ' ↗</a>';
      }).join("") + '</div></div></aside>'
    ) : "";
    var presentationResource = presentation ? (
      '<section class="case-resource"><div><p class="case-resource__kicker">МАТЕРИАЛ ПРОЕКТА · ' + presentation.images.length + ' СЛАЙДОВ</p><h3>Презентация школьного проекта</h3><p>Открыть с первого слайда и листать всю последовательность.</p></div>' +
      '<button class="case-resource__open" type="button" data-presentation-id="' + escapeHtml(presentation.id) + '" aria-label="Открыть все слайды презентации">' +
      '<img src="' + escapeHtml(presentation.cover) + '" alt="Обложка презентации школьного проекта" loading="lazy"><span aria-hidden="true">+</span></button></section>'
    ) : "";
    var galleryBlock = gallery ? (
      '<div class="case-gallery-title"><h3>Материалы серии</h3><p>' + imageCountText((project.images || []).length) + ' · нажми, чтобы увеличить</p></div>' +
      '<div class="case-gallery">' + gallery + '</div>'
    ) : "";
    projectDialogContent.innerHTML =
      '<section class="case-heading"><div><p class="case-heading__tag">' + escapeHtml(project.category) + '</p><h2 id="projectDialogTitle">' + escapeHtml(project.title) + '</h2><p class="case-heading__subtitle">' + escapeHtml(project.subtitle) + '</p></div>' +
      '<div class="case-facts">' + (project.facts || []).map(function (fact) { return '<span>' + escapeHtml(fact) + '</span>'; }).join("") + '</div></section>' +
      caseDescription +
      context + (project.note ? '<p class="case-note">' + escapeHtml(project.note) + '</p>' : "") +
      demo + presentationResource + galleryBlock;

    Array.prototype.forEach.call(projectDialogContent.querySelectorAll(".case-gallery-item"), function (figure) {
      var open = function () { openLightbox(project.images, Number(figure.getAttribute("data-gallery-index"))); };
      figure.addEventListener("click", open);
      figure.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
    });

    var demoButton = projectDialogContent.querySelector(".demo-launch");
    if (demoButton) {
      demoButton.addEventListener("click", function () {
        var container = projectDialogContent.querySelector(".demo-container");
        var frame = container.querySelector("iframe");
        var demoBlock = projectDialogContent.querySelector(".demo-block");
        if (frame.getAttribute("src") === "about:blank") frame.setAttribute("src", demoButton.getAttribute("data-demo-src"));
        demoBlock.classList.add("is-open");
        container.classList.add("is-open");
        demoButton.textContent = "Прототип загружен";
        demoButton.disabled = true;
        var dialogHeader = projectDialog.querySelector(".project-dialog__top");
        var dialogTop = projectDialog.getBoundingClientRect().top;
        var containerTop = container.getBoundingClientRect().top - dialogTop;
        var headerOffset = dialogHeader ? dialogHeader.getBoundingClientRect().height + 12 : 12;
        projectDialog.scrollTo({
          top: Math.max(0, projectDialog.scrollTop + containerTop - headerOffset),
          behavior: "smooth"
        });
      });
    }
    var presentationButton = projectDialogContent.querySelector(".case-resource__open");
    if (presentationButton) {
      presentationButton.addEventListener("click", function () {
        openLightbox(presentation.images, 0);
      });
    }

    projectDialog.showModal();
    projectDialog.scrollTop = 0;
  }

  function setLightboxItem() {
    var item = viewerItems[viewerIndex];
    if (!item) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt || item.caption || "";
    lightboxCaption.textContent = item.caption || item.projectTitle || "";
    lightboxPosition.textContent = (viewerIndex + 1) + " / " + viewerItems.length;
    document.querySelector(".lightbox-step--prev").disabled = viewerItems.length < 2;
    document.querySelector(".lightbox-step--next").disabled = viewerItems.length < 2;
  }

  function openLightbox(items, index) {
    viewerItems = items || [];
    viewerIndex = Math.max(0, Math.min(index || 0, viewerItems.length - 1));
    setLightboxItem();
    lightbox.showModal();
  }

  function stepLightbox(amount) {
    if (viewerItems.length < 2) return;
    viewerIndex = (viewerIndex + amount + viewerItems.length) % viewerItems.length;
    setLightboxItem();
  }

  document.querySelector(".dialog-close").addEventListener("click", function () { projectDialog.close(); });
  projectDialog.addEventListener("click", function (event) {
    if (event.target === projectDialog) projectDialog.close();
  });
  lightbox.querySelector(".lightbox-close").addEventListener("click", function () { lightbox.close(); });
  lightbox.querySelector(".lightbox-step--prev").addEventListener("click", function () { stepLightbox(-1); });
  lightbox.querySelector(".lightbox-step--next").addEventListener("click", function () { stepLightbox(1); });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) lightbox.close();
  });
  var swipeStart = null;
  lightbox.addEventListener("pointerdown", function (event) {
    if (event.pointerType !== "touch" || !event.target.closest(".lightbox-figure")) return;
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  lightbox.addEventListener("pointerup", function (event) {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;
    var dx = event.clientX - swipeStart.x;
    var dy = event.clientY - swipeStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35) stepLightbox(dx > 0 ? -1 : 1);
    swipeStart = null;
  });
  lightbox.addEventListener("pointercancel", function () { swipeStart = null; });
  document.addEventListener("keydown", function (event) {
    if (!lightbox.open) return;
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });

  var menuButton = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".main-nav");
  menuButton.addEventListener("click", function () {
    var open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  var discordButton = document.getElementById("copyDiscord");
  var contactCopyStatus = document.getElementById("contactCopyStatus");
  function fallbackCopyText(value) {
    var field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
    field.remove();
    return copied;
  }
  function reportDiscordCopy(copied) {
    contactCopyStatus.textContent = copied ? "Ник Discord скопирован: show3nnn" : "Не удалось скопировать ник. Discord: show3nnn";
  }
  if (discordButton) {
    discordButton.addEventListener("click", function () {
      var value = discordButton.getAttribute("data-copy-value");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () { reportDiscordCopy(true); }, function () { reportDiscordCopy(fallbackCopyText(value)); });
      } else {
        reportDiscordCopy(fallbackCopyText(value));
      }
    });
  }

  function observeReveals() {
    var elements = document.querySelectorAll(".reveal:not(.is-observed)");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(elements, function (element) { element.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.classList.add("is-observed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    Array.prototype.forEach.call(elements, function (element) { observer.observe(element); });
  }

  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    document.querySelector(".reading-progress").style.transform = "scaleX(" + progress + ")";
  }

  function initializeTicker() {
    var ticker = document.querySelector(".ticker");
    if (!ticker) return;
    var track = ticker.querySelector(".ticker__track");
    var source = track.querySelector(".ticker__group");
    var pixelsPerSecond = 48;
    var resizeFrame = 0;

    function rebuild() {
      track.querySelectorAll(".ticker__group--clone").forEach(function (clone) { clone.remove(); });
      var groupWidth = source.getBoundingClientRect().width;
      var tickerWidth = ticker.getBoundingClientRect().width;
      if (!groupWidth || !tickerWidth) return;

      var groupCount = Math.ceil(tickerWidth / groupWidth) + 2;
      for (var i = 1; i < groupCount; i += 1) {
        var clone = source.cloneNode(true);
        clone.classList.add("ticker__group--clone");
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }

      track.style.setProperty("--ticker-shift", -groupWidth + "px");
      track.style.animationDuration = groupWidth / pixelsPerSecond + "s";
      track.classList.add("is-ready");
    }

    function scheduleRebuild() {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(rebuild);
    }

    if ("ResizeObserver" in window) {
      var tickerObserver = new ResizeObserver(scheduleRebuild);
      tickerObserver.observe(ticker);
      tickerObserver.observe(source);
    } else {
      window.addEventListener("resize", scheduleRebuild, { passive: true });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRebuild);
    rebuild();
  }

  window.addEventListener("scroll", updateProgress, { passive: true });

  initializeTicker();
  renderProjects();
  renderFilters();
  filterItems("Все");
  observeReveals();
  updateProgress();
})();
