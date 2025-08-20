
// intro.js 
(function () {
  function makeIntroSection() {
    var sec = document.createElement("section");
    sec.id = "page-intro";
    sec.setAttribute("aria-label", "How to use this page");
    sec.setAttribute("style",
      "max-width:1100px;margin:14px auto 18px;padding:0 12px;position:relative;z-index:1;"
    );

    var card = document.createElement("div");
    card.setAttribute("style",
      "background:#ffffff;border:2px solid #cbd5e1;border-radius:12px;" +
      "padding:16px 20px;box-shadow:0 6px 14px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);" +
      "isolation:isolate;"
    );

    var p = document.createElement("p");
    p.setAttribute("style",
      "margin:0;text-align:center;color:#0f172a;line-height:1.65;font-style:italic;" +
      "font-size:1.05rem;font-weight:500;"
    );
    p.innerHTML = '<em>' +
      'Hover any country on the European map to preview its average features on the spider plot (orange). ' +
      'Single‑click a country to pin it (blue). While a country is pinned, simply hover other countries to compare them in orange. ' +
      'Double‑click a country to open its detailed view. Inside the detailed view, a single click switches to the clicked country\\' + 's detail, ' +
      'or — if you click the same country again — returns to the European map. ' +
      'When “Show non‑normalized values” is enabled, the table below the chart displays raw values for the pinned country and for the one under your cursor. ' +
      'The spider plot summarizes main averages: number of slopes, number of lifts, highest point, snow cannons, and day price.' +
      '</em>';

    card.appendChild(p);
    sec.appendChild(card);
    return sec;
  }

  function insertAfter(refNode, newNode) {
    if (!refNode || !refNode.parentNode) {
      document.body.insertBefore(newNode, document.body.firstChild || null);
      return;
    }
    if (refNode.nextSibling) refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
    else refNode.parentNode.appendChild(newNode);
  }

  function findBanner() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll(
      "h1, .itemTitle, .title, .titleCard, #title, header h1, header .title"
    ));
    var re = /european\s+ski\s+map\s+analysis/i;
    for (var i=0; i<candidates.length; i++) {
      var txt = (candidates[i].textContent || '').trim();
      if (re.test(txt)) return candidates[i];
    }
    return null;
  }

  function init() {
    var old = document.getElementById("page-intro");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var sec = makeIntroSection();
    var banner = findBanner();
    if (banner) insertAfter(banner, sec);
    else insertAfter(document.body.firstElementChild, sec);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
