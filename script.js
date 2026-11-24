(() => {
  "use strict";

  const config = window.DATE_INVITE || {};
  const questionPanel = document.getElementById("question-panel");
  const answerPanel = document.getElementById("answer-panel");
  const yesButton = document.getElementById("yes-button");
  const noButton = document.getElementById("no-button");
  const hint = document.getElementById("playful-hint");
  const confetti = document.getElementById("confetti");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const initialHint = hint.textContent;
  let escapeCount = 0;

  function setText(id, value, fallback) {
    document.getElementById(id).textContent =
      typeof value === "string" && value.trim() ? value : fallback;
  }

  setText("meeting-date", config.date, "Дату выберем вместе");
  setText("meeting-time", config.time, "В удобное для нас время");
  setText("meeting-place", config.place, "В нашем любимом месте");
  setText("meeting-address", config.address, "Детали я пришлю тебе лично");
  setText("answer-message", config.message, "Очень жду нашей встречи!");
  setText("closing-note", config.closing, "До встречи ♡");

  if (typeof config.recipient === "string" && config.recipient.trim()) {
    const personalNote = document.getElementById("personal-note");
    personalNote.textContent = config.recipient;
    personalNote.hidden = false;
  }

  // Разрешаем только обычные веб-ссылки, даже если конфиг был изменён случайно.
  if (typeof config.mapUrl === "string" && config.mapUrl.trim()) {
    try {
      const url = new URL(config.mapUrl);
      if (url.protocol === "https:" || url.protocol === "http:") {
        const mapLink = document.getElementById("map-link");
        mapLink.href = url.href;
        mapLink.hidden = false;
      }
    } catch {
      // Некорректную ссылку просто не показываем.
    }
  }

  function overlaps(rect, other, gap = 18) {
    return rect.left < other.right + gap && rect.right > other.left - gap &&
      rect.top < other.bottom + gap && rect.bottom > other.top - gap;
  }

  function moveNoButton() {
    const oldRect = noButton.getBoundingClientRect();
    const yesRect = yesButton.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportLeft = viewport ? viewport.offsetLeft : 0;
    const viewportTop = viewport ? viewport.offsetTop : 0;
    const width = viewport ? viewport.width : document.documentElement.clientWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    const margin = 16;
    const minX = viewportLeft + margin;
    const minY = viewportTop + margin;
    const maxX = Math.max(minX, viewportLeft + width - oldRect.width - margin);
    const maxY = Math.max(minY, viewportTop + height - oldRect.height - margin);
    let bestPosition = null;
    let bestDistance = -1;

    // Ищем новое место в видимой области и никогда не перекрываем кнопку «Да».
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const candidate = { left: x, top: y, right: x + oldRect.width, bottom: y + oldRect.height };
      if (overlaps(candidate, yesRect)) continue;
      const distance = Math.hypot(x - oldRect.left, y - oldRect.top);
      if (distance > bestDistance) {
        bestDistance = distance;
        bestPosition = { x, y };
      }
      if (distance > Math.min(160, width * 0.45)) break;
    }

    if (bestPosition) {
      noButton.getAnimations().forEach((animation) => animation.cancel());
      noButton.classList.add("is-escaping");
      noButton.style.left = `${bestPosition.x}px`;
      noButton.style.top = `${bestPosition.y}px`;
      if (!motionPreference.matches) {
        noButton.animate([
          { transform: `translate(${oldRect.left - bestPosition.x}px, ${oldRect.top - bestPosition.y}px)` },
          { transform: "translate(0, 0)" },
        ], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    }

    const hints = [
      "Э.. зачем ты туда нажала?",
      "Да нажми на вон ту кнопку лучше",
      "Вот черт, опять убежала, как же так..",
      "Ты точно по кнопке попадаешь вообще?",
      "nt",
      "Ну вот сейчас точно попадешь я думаю",
    ];
    hint.textContent = hints[escapeCount % hints.length];
    escapeCount += 1;
  }

  function resetNoButton() {
    noButton.getAnimations().forEach((animation) => animation.cancel());
    noButton.classList.remove("is-escaping");
    noButton.style.removeProperty("left");
    noButton.style.removeProperty("top");
  }

  function celebrate() {
    confetti.replaceChildren();
    if (motionPreference.matches) return;
    const colors = ["#8050ad", "#b89bd6", "#a69cda", "#dcc5f0"];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 40; i += 1) {
      const piece = document.createElement("span");
      const isHeart = i % 3 === 0;
      piece.className = `confetti-piece${isHeart ? " is-heart" : ""}`;
      if (isHeart) piece.textContent = "♥";
      const size = 6 + Math.random() * 7;
      piece.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size * 1.5}px;font-size:${size + 6}px;--color:${colors[i % colors.length]};--duration:${2.8 + Math.random() * 1.7}s;--delay:${Math.random() * 0.6}s;--drift:${Math.random() * 180 - 90}px;--spin:${Math.random() * 600 - 300}deg;`;
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
      fragment.appendChild(piece);
    }
    confetti.appendChild(fragment);
  }

  noButton.addEventListener("click", moveNoButton);

  yesButton.addEventListener("click", () => {
    resetNoButton();
    questionPanel.hidden = true;
    answerPanel.hidden = false;
    document.getElementById("answer-title").focus({ preventScroll: true });
    answerPanel.scrollIntoView({ block: "nearest", behavior: "instant" });
    celebrate();
  });

  document.getElementById("back-button").addEventListener("click", () => {
    answerPanel.hidden = true;
    questionPanel.hidden = false;
    resetNoButton();
    escapeCount = 0;
    hint.textContent = initialHint;
    confetti.replaceChildren();
    yesButton.focus({ preventScroll: true });
    questionPanel.scrollIntoView({ block: "nearest", behavior: "instant" });
  });

  // После поворота телефона, изменения масштаба или окна кнопка снова на месте.
  window.addEventListener("resize", resetNoButton);
  window.visualViewport?.addEventListener("resize", resetNoButton);
  motionPreference.addEventListener("change", () => confetti.replaceChildren());
})();
