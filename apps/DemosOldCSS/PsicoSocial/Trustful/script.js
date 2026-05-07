/* Tiny state -> sentence */
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

function getCheckedLabels(selector){
  return $$(selector)
    .filter(el => el.checked)
    .map(el => el.dataset?.label || el.value);
}

function dateStr(id){
  const v = $(id).value;
  if(!v) return null;
  const d = new Date(v);
  if(Number.isNaN(d)) return null;
  return d.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'2-digit'});
}

function buildSentence(){
  const me = $("#meName").value?.trim() || "I";
  const you = $("#youName").value?.trim() || "the other person";
  const rel = $("#relationship").value?.trim();
  const ctx = $("#context").value?.trim();

  const scopes = getCheckedLabels(".scope");
  const deg = $("#degree").value;
  const from = dateStr("#fromDate");
  const to = dateStr("#toDate");

  const limit = $("#limit").value?.trim();
  const checkin = $("#checkin").value?.trim();
  const fallback = $("#fallback").value?.trim();
  const pledge = $("#pledge").value?.trim();

  const signals = $$(".signal:checked").map(s=>s.parentElement.textContent.trim());
  const confidence = $("#confidence").value;
  const risk = $("#risk").value;
  const verify = $("#verify").value;

  const parts = [];
  parts.push(`${me} declare ${deg}% actual trust in ${you}${rel ? ` (${rel})` : ""}`);
  if(scopes.length) parts.push(`for ${scopes.join(", ")}`);
  if(ctx) parts.push(`within “${ctx}”`);
  if(from || to) parts.push(`from ${from || "now"} until ${to || "open-ended"}`);
  const conds = [limit && `Truster limitations: ${limit}`, checkin && `Trustee limitations: ${checkin}`, fallback && `Additional grants given: ${fallback}`, pledge && `Other conditions: ${pledge}`].filter(Boolean);
  if(conds.length) parts.push(`[${conds.join(" • ")}]`);
  parts.push(`potential trust ${confidence}% , my predisponibility for that is ${risk} and my prefered method for assuring that is ${verify}`);
  if(signals.length) parts.push(`signals considered: ${signals.join(", ")}`);

  $("#sentence").textContent = parts.join(" · ");
}

function initDefaults(){
  // Set today's date and +30 days as a friendly default
  const today = new Date();
  const plus30 = new Date(+today + 1000*60*60*24*30);
  $("#fromDate").value = today.toISOString().slice(0,10);
  $("#toDate").value = plus30.toISOString().slice(0,10);
  buildSentence();
}

function listen(){
  ["input","change"].forEach(evt=>{
    document.addEventListener(evt, e=>{
      if(
        e.target.matches("input, select") ||
        e.target.closest(".chip")
      ){ buildSentence(); }
    });
  });
}

/* Save: download JSON + TXT summary (both) */
function saveFile(){
  const data = {
    me: $("#meName").value,
    you: $("#youName").value,
    relationship: $("#relationship").value,
    context: $("#context").value,
    scopes: $$(".scope:checked").map(el => ({
      value: el.value,
      label: el.dataset?.label || el.value,
      note: el.parentElement.querySelector(".chip-note")?.value || ""
    })),
    degree: +$("#degree").value,
    fromDate: $("#fromDate").value,
    toDate: $("#toDate").value,
    conditions:{
      limit: $("#limit").value,
      checkin: $("#checkin").value,
      fallback: $("#fallback").value,
      pledge: $("#pledge").value
    },
    evidence: $$(".signal:checked").map(s => s.value),
    confidence: +$("#confidence").value,
    risk: $("#risk").value,
    verify: $("#verify").value,
    sentence: $("#sentence").textContent.trim(),
    savedAt: new Date().toISOString()
  };

  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const dl = (name, content, type="text/plain")=>{
    const blob = new Blob([content], {type});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  };

  dl(`trusty_${stamp}.json`, JSON.stringify(data, null, 2), "application/json");
  dl(`trusty_${stamp}.txt`, data.sentence + "\n");
}

/* Share: Web Share API if available; fallback to mailto */
async function shareIt(){
  const text = $("#sentence").textContent.trim();
  const title = "Trusty: partial trust declaration";
  if(navigator.share){
    try{
      await navigator.share({title, text});
      return;
    }catch(e){/* fall through */}
  }
  const body = encodeURIComponent(text + "\n\n— Sent from Trusty");
  window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${body}`;
}

/* Publish: open the browser print dialog (PDF option) */
function publishIt(){
  window.print();
}

function bindActions(){
  $("#btnSave").addEventListener("click", saveFile);
  $("#btnShare").addEventListener("click", shareIt);
  $("#btnPublish").addEventListener("click", publishIt);
}

document.addEventListener("DOMContentLoaded", ()=>{
  initDefaults();
  listen();
  bindActions();
});

