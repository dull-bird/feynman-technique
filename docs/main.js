// 费曼学习法陪练 · 交互脚本
// 1) Hero 对话逐条显现  2) 红笔划线  3) 滚动 reveal  4) 复制按钮

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isEn = (document.documentElement.lang || "").indexOf("en") === 0;

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
        btn.textContent = isEn ? "Copied ✓" : "已复制 ✓";
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


// ---- 真实对话 gallery + 数据驱动的进步追踪 ----
(function () {
  "use strict";

  var data = window.FEYNMAN_GALLERY;
  if (!data || !data.length) return;

  // 英文页面复用本脚本：仅切换 UI 文案，gallery 数据本身保持中文
  var isEn = (document.documentElement.lang || "").indexOf("en") === 0;
  var STR = isEn ? {
    all: "All",
    rounds: " rounds",
    passed: "Passed",
    failed: "Not passed",
    gapsLabel: "Blind spots: ",
    fullDialogue: function (n) { return "Read full dialogue (" + n + " messages)"; },
    mastered: "Mastered",
    revisit: "To revisit",
    summary: function (total, passed) { return total + " sessions · " + passed + " passed"; },
    trend: "Score trend "
  } : {
    all: "全部",
    rounds: " 轮",
    passed: "通过",
    failed: "未通过",
    gapsLabel: "盲区：",
    fullDialogue: function (n) { return "读完整对话（" + n + " 条）"; },
    mastered: "已掌握",
    revisit: "待回填",
    summary: function (total, passed) { return total + " 次对话 · " + passed + " 次通过"; },
    trend: "评分走势 "
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---- gallery ----
  var chipsBox = document.getElementById("gallery-chips");
  var grid = document.getElementById("gallery-grid");
  if (!chipsBox || !grid) return;

  var domains = [STR.all];
  data.forEach(function (s) {
    if (domains.indexOf(s.domain) === -1) domains.push(s.domain);
  });

  var activeChip = null;
  domains.forEach(function (d, i) {
    var chip = el("button", "chip" + (i === 0 ? " active" : ""), d);
    chip.setAttribute("role", "tab");
    chip.addEventListener("click", function () {
      if (activeChip) activeChip.classList.remove("active");
      chip.classList.add("active");
      activeChip = chip;
      renderCards(d);
    });
    if (i === 0) activeChip = chip;
    chipsBox.appendChild(chip);
  });

  function scoreClass(score) {
    if (score <= 2) return "g-score low";
    if (score >= 4) return "g-score high";
    return "g-score";
  }

  function renderCards(domain) {
    grid.innerHTML = "";
    data.forEach(function (s) {
      if (domain !== STR.all && s.domain !== domain) return;

      var card = el("article", "g-card");

      var top = el("div", "g-card-top");
      top.appendChild(el("span", "g-domain", s.domain));
      if (s.dual) top.appendChild(el("span", "g-dual", "双 agent 实测"));
      top.appendChild(el("span", scoreClass(s.score), s.score + "/5"));
      card.appendChild(top);

      card.appendChild(el("h3", null, s.concept));

      var meta = el("p", "g-meta");
      meta.appendChild(document.createTextNode(s.date + " · " + s.rounds + STR.rounds + " · "));
      meta.appendChild(el("span", s.passed ? "g-status-pass" : "g-status-fail",
        s.passed ? STR.passed : STR.failed));
      card.appendChild(meta);

      if (s.gaps && s.gaps.length) {
        var gaps = el("p", "g-gaps");
        gaps.appendChild(el("strong", null, STR.gapsLabel));
        gaps.appendChild(document.createTextNode(s.gaps.slice(0, 2).join("；")));
        card.appendChild(gaps);
      }

      if (s.messages && s.messages.length) {
        var details = el("details");
        details.appendChild(el("summary", null, STR.fullDialogue(s.messages.length)));
        var dlg = el("div", "g-dialogue");
        s.messages.forEach(function (m) {
          var bubble = el("div", "g-msg " + (m.who === "you" ? "you" : "listener"));
          bubble.appendChild(el("span", "g-who", m.who));
          bubble.appendChild(document.createTextNode(m.text));
          dlg.appendChild(bubble);
        });
        details.appendChild(dlg);
        card.appendChild(details);
      }

      grid.appendChild(card);
    });
  }

  renderCards(STR.all);

  // ---- 进步追踪（真实数据） ----
  var tbody = document.getElementById("progress-tbody");
  if (!tbody) return;

  var byConcept = {};
  var conceptOrder = [];
  data.forEach(function (s) {
    if (!byConcept[s.concept]) {
      byConcept[s.concept] = { domain: s.domain, sessions: [] };
      conceptOrder.push(s.concept);
    }
    byConcept[s.concept].sessions.push(s);
  });

  conceptOrder.forEach(function (concept) {
    var info = byConcept[concept];
    var scores = info.sessions.map(function (s) { return s.score; });
    var last = info.sessions[info.sessions.length - 1];
    var tr = document.createElement("tr");
    tr.appendChild(el("td", null, concept));
    tr.appendChild(el("td", null, info.domain));
    tr.appendChild(el("td", null, String(info.sessions.length)));
    tr.appendChild(el("td", null, scores.join(" → ")));
    var status = el("td");
    status.appendChild(el("span", last.passed ? "g-status-pass" : "g-status-fail",
      last.passed ? STR.mastered : STR.revisit));
    tr.appendChild(status);
    tbody.appendChild(tr);
  });

  var total = data.length;
  var passed = data.filter(function (s) { return s.passed; }).length;
  var summary = document.getElementById("progress-summary");
  if (summary) summary.textContent = STR.summary(total, passed);

  // 评分走势 sparkline（按时间顺序的全部评分）
  var spark = document.getElementById("progress-sparkline");
  var trend = document.getElementById("progress-trend");
  var all = data.map(function (s) { return s.score; });
  if (spark && all.length >= 2) {
    var min = 1, max = 5;
    var stepX = 90 / (all.length - 1);
    var points = all.map(function (sc, i) {
      var x = 10 + i * stepX;
      var y = 36 - ((sc - min) / (max - min)) * 30;
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", points.join(" "));
    poly.setAttribute("fill", "none");
    spark.appendChild(poly);
    var lastPt = points[points.length - 1].split(",");
    var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", lastPt[0]);
    dot.setAttribute("cy", lastPt[1]);
    dot.setAttribute("r", "3");
    spark.appendChild(dot);
  }
  if (trend) trend.textContent = STR.trend + all.join(" → ");
})();
