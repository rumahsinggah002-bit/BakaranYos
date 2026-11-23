const $ = s => document.querySelector(s);
const money = n => "Rp" + Number(n||0).toLocaleString("id-ID");
const now = () => new Date();
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dateText = d => d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const timeText = d => d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",hour12:false});
const defaults = [
  {id:"tea",name:"Teh / Es Teh",price:3000,emoji:"🧋",count:0},
  {id:"coffee",name:"Kopi / Es Kopi",price:4000,emoji:"☕",count:0},
  {id:"bakaran",name:"Bakaran",price:0,emoji:"🍢",count:0}
];
let state;
try { state = JSON.parse(localStorage.getItem("bakaranMasBios")) || {products:defaults,transactions:[]}; }
catch { state={products:defaults,transactions:[]}; }
function save(){localStorage.setItem("bakaranMasBios",JSON.stringify(state));render();}
function todayTx(){const key=dateKey(now());return state.transactions.filter(t=>t.date===key);}
function render(){
  const d=now();$("#todayLabel").textContent=dateText(d);$("#historyDate").innerHTML=`<span>${dateText(d)}</span><span>${money(todayTx().reduce((a,t)=>a+t.amount,0))}</span>`;
  const tx=todayTx(), income=tx.filter(t=>t.kind==="income").reduce((a,t)=>a+t.amount,0), expense=tx.filter(t=>t.kind==="expense").reduce((a,t)=>a+t.amount,0);
  $("#balance").textContent=money(income-expense);$("#incomeTotal").textContent=money(income);$("#expenseTotal").textContent=money(expense);
  $("#products").innerHTML=state.products.map(p=>`<button class="product" data-product="${p.id}"><span class="count">${p.count||0}</span><span class="emoji">${p.emoji||"🍽️"}</span><strong>${escapeHtml(p.name)}</strong><small>${p.price?money(p.price):"Atur sendiri"}</small></button>`).join("")+`<button class="product" id="addProductTile"><span class="emoji">＋</span><strong>Tambah Menu</strong><small>Produk baru</small></button>`;
  const list=[...tx].reverse();$("#transactions").innerHTML=list.slice(0,12).map(txHTML).join("");$("#emptyState").style.display=list.length?"none":"block";
  $("#allTransactions").innerHTML=[...state.transactions].reverse().map(txHTML).join("")||'<p class="empty">Belum ada transaksi.</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function txHTML(t){return `<div class="tx"><div class="tx-icon ${t.kind==="expense"?"out":""}">${t.kind==="income"?"↑":"↓"}</div><div class="tx-info"><strong>${escapeHtml(t.name)}</strong><small>${t.time}${t.note?" · "+escapeHtml(t.note):""}</small></div><div class="tx-amount ${t.kind==="income"?"in":"out"}">${t.kind==="income"?"+":"−"}${money(t.amount)}</div><button class="delete-tx" data-delete="${t.id}" aria-label="Hapus transaksi">×</button></div>`;}
function openTx(kind,name="",amount="",note=""){ $("#kind").value=kind;$("#formTitle").textContent=kind==="income"?"Tambah Pemasukan":"Tambah Pengeluaran";$("#txName").value=name;$("#txAmount").value=amount;$("#txNote").value=note;$("#transactionDialog").showModal(); }
$("#addIncome").onclick=()=>openTx("income");$("#addExpense").onclick=()=>openTx("expense");$("#quickRecord").onclick=()=>openTx("income");
$("#transactionForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("#txAmount").value);if(!amount||amount<1)return;const d=now();state.transactions.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind:$("#kind").value,name:$("#txName").value.trim(),amount,note:$("#txNote").value.trim(),date:dateKey(d),time:timeText(d),stamp:d.getTime()});$("#transactionDialog").close();save();});
$("#products").addEventListener("click",e=>{const pbtn=e.target.closest("[data-product]");if(pbtn){const p=state.products.find(x=>x.id===pbtn.dataset.product);if(!p)return;let price=p.price;if(!price){const v=prompt("Masukkan harga "+p.name+" (Rp):");price=Number(v);if(!price||price<1)return;}p.count=(p.count||0)+1;const d=now();state.transactions.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind:"income",name:p.name+" ×1",amount:price,note:"Penjualan",date:dateKey(d),time:timeText(d),stamp:d.getTime()});save();}if(e.target.closest("#addProductTile"))$("#productDialog").showModal();});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#productName").value.trim(),price=Number($("#productPrice").value);if(!name||price<1)return;state.products.push({id:Date.now().toString(36),name,price,emoji:"🍽️",count:0});$("#productDialog").close();$("#productForm").reset();save();});
document.body.addEventListener("click",e=>{const del=e.target.closest("[data-delete]");if(del&&confirm("Hapus transaksi ini?")){state.transactions=state.transactions.filter(t=>t.id!==del.dataset.delete);save();}});
$("#openQris").onclick=()=>$("#qrisDialog").showModal();$("#allHistory").onclick=()=>$("#historyDialog").showModal();$("#menuBtn").onclick=()=>$("#menuDialog").showModal();
$("#addProductOption").onclick=()=>{$("#menuDialog").close();$("#productDialog").showModal();};
$("#resetOption").onclick=()=>{if(confirm("Yakin ingin menghapus semua transaksi dan menu tambahan?")){state={products:defaults.map(x=>({...x})),transactions:[]};save();$("#menuDialog").close();}};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
render();