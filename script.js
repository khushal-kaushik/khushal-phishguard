const input = document.getElementById("url-input");
const btn = document.getElementById("scan-btn");

const badWords = ["login", "verify", "bank", "password", "urgent"];

btn.onclick = scan;
document.getElementById("clear-btn").onclick = clearHistory;

function scan() {
    let text = input.value.trim();
    let score = 0;
    let reasons = [];
    let checks = {};

    if (!text || /\s/.test(text)) {
        alert("Please enter a valid URL");
        return;
    }

    let url;
    let noProtocol = !text.includes("://");
    try {
        url = new URL(noProtocol ? "http://" + text : text);
    } catch (e) {
        alert("Invalid URL");
        return;
    }

    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
        alert("Invalid URL");
        return;
    }

    // 1. HTTPS Check
    if (url.protocol === "https:" && !noProtocol) {
        checks.https = ["low", "HTTPS used"];
        reasons.push(["low", "Uses HTTPS. But HTTPS alone does not prove a site is genuine."]);
    } else {
        score += 20;
        checks.https = ["high", "No HTTPS"];
        reasons.push(["high", "No HTTPS (+20)."]);
    }

    // 2. IP Address Check
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) {
        score += 30;
        checks.ip = ["high", "IP address found"];
        reasons.push(["high", "IP address used instead of a website name (+30)."]);
    } else {
        checks.ip = ["low", "Normal domain"];
    }

    // 3. Keyword Check
    let lower = text.toLowerCase();
    let found = badWords.filter(word => lower.includes(word));
    if (found.length > 0) {
        score += found.length * 10;
        let lvl = found.length >= 3 ? "high" : "medium";
        checks.keywords = [lvl, found.length + " found"];
        reasons.push([lvl, "Suspicious words: " + found.join(", ") + " (+" + found.length * 10 + ")."]);
    } else {
        checks.keywords = ["low", "None found"];
    }

    // 4. URL Length Check
    if (text.length > 100) {
        score += 20;
        checks.length = ["high", text.length + " characters"];
        reasons.push(["high", "Very long link (+20)."]);
    } else {
        checks.length = ["low", text.length + " characters"];
    }

    // 5. Subdomain Check
    let subs = url.hostname.split(".").length - 2;
    if (subs >= 3) {
        score += 15;
        checks.subdomain = ["high", subs + " subdomains"];
        reasons.push(["high", "Too many subdomains (+15)."]);
    } else {
        checks.subdomain = ["low", "Normal"];
    }

    // 6. Symbol Check
    if (url.hostname.includes("xn--") || text.includes("@")) {
        score += 20;
        checks.symbols = ["high", "Found"];
        reasons.push(["high", "Unusual symbol (@ or xn--) found (+20)."]);
    } else {
        checks.symbols = ["low", "None found"];
    }

    score = Math.min(score, 100);

    let result = score >= 60 ? "High Risk" :
                 score >= 30 ? "Medium Risk" : "Low Risk";
    let level = result.split(" ")[0].toLowerCase();

    // Show Result
    document.getElementById("result-section").classList.remove("hidden");
    document.getElementById("scanned-url").textContent = text;
    document.getElementById("score-number").textContent = score;
    document.getElementById("risk-badge").textContent = result;
    document.getElementById("score-circle").className = "score-circle " + level;
    document.getElementById("risk-badge").className = "risk-badge " + level;
    document.getElementById("risk-bar-fill").className = "risk-bar-fill " + level;
    document.getElementById("risk-bar-fill").style.width = score + "%";

    // 6 check cards
    for (let name in checks) {
        let box = document.getElementById("check-" + name);
        box.className = "check-item " + checks[name][0];
        box.querySelector(".check-status").textContent = checks[name][1];
    }

    // Why this score?
    let ul = document.getElementById("reasons-list");
    ul.innerHTML = "";
    reasons.forEach(r => {
        let li = document.createElement("li");
        li.className = r[0];
        li.textContent = r[1];
        ul.appendChild(li);
    });

    // History save + dikhao (tumhari 2 lines)
    saveHistory(text, score, level);
    showHistory();
}

// ===== History functions =====
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem("history")) || [];
    } catch (e) {
        return [];
    }
}

function saveHistory(text, score, level) {
    let h = getHistory();
    h = h.filter(item => item.url !== text);
    h.unshift({ url: text, score: score, level: level });
    h = h.slice(0, 20);
    localStorage.setItem("history", JSON.stringify(h));
}

function showHistory() {
    let h = getHistory();
    let list = document.getElementById("history-list");
    list.innerHTML = "";
    document.getElementById("empty-history").style.display = h.length === 0 ? "block" : "none";

    h.forEach(item => {
        let li = document.createElement("li");
        li.className = item.level;
        li.innerHTML = "<span></span><strong></strong>";
        li.querySelector("span").textContent = item.url;
        li.querySelector("strong").textContent = item.score + "/100";
        list.appendChild(li);
    });

    document.getElementById("stat-total").textContent = h.length;
    document.getElementById("stat-low").textContent = h.filter(i => i.level === "low").length;
    document.getElementById("stat-medium").textContent = h.filter(i => i.level === "medium").length;
    document.getElementById("stat-high").textContent = h.filter(i => i.level === "high").length;
}

function clearHistory() {
    if (confirm("Delete all scan history?")) {
        localStorage.removeItem("history");
        showHistory();
    }
}

// Page khulte hi purani history dikhao
showHistory();