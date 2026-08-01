// 费曼学习法陪练 · 交互脚本
// 1) Hero 对话逐条显现  2) 红笔划线  3) 滚动 reveal  4) 复制按钮

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 滚动 reveal（通用）----
  var revealEls = document.querySelectorAll("[data-reveal]");
  var reportCard = document.querySelector(".report-card");

  if ("IntersectionObserver" in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("on");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    revealEls.forEach(function (el) { io.observe(el); });
    if (reportCard) io.observe(reportCard);
  } else {
    revealEls.forEach(function (el) { el.classList.add("on"); });
    if (reportCard) reportCard.classList.add("on");
  }

  // ---- Hero：对话逐条播放 + 红笔划线 ----
  var steps = document.querySelectorAll("#hero-dialogue [data-step], .red-verdict[data-step]");
  var strike = document.querySelector(".strike");
  var played = false;

  function playDialogue() {
    if (played) return;
    played = true;
    if (strike) strike.classList.add("on");
    if (reducedMotion) {
      steps.forEach(function (el) { el.classList.add("on"); });
      return;
    }
    steps.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("on"); }, 500 + i * 900);
    });
  }

  var notebook = document.querySelector(".notebook");
  if (notebook && "IntersectionObserver" in window) {
    var heroIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playDialogue();
          heroIO.disconnect();
        }
      });
    }, { threshold: 0.4 });
    heroIO.observe(notebook);
  } else {
    playDialogue();
  }

  // ---- 复制按钮 ----
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        var original = btn.textContent;
        btn.textContent = "已复制 ✓";
        setTimeout(function () { btn.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* 忽略 */ }
    document.body.removeChild(ta);
  }
})();
