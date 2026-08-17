const SUPABASE_URL = "https://brfegowczdarhljtmxtl.supabase.co";
const SUPABASE_KEY = "sb_publishable_r-f0TfqlnBV2gHNK0ejZwA_ZMuhKz58";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const show = (id,on=true) => $(id).classList.toggle("hidden",!on);

async function adminUser(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return null;
  const {data,error}=await sb.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error || !data) return null;
  return user;
}

async function start(){
  const user=await adminUser();
  if(!user){ show("login",true); show("dashboard",false); return; }
  $("account").textContent=user.email;
  show("login",false); show("dashboard",true);
  await Promise.all([loadEvents(),loadAarti(),loadDonations(),loadExpenses()]);
}

$("loginForm").onsubmit=async e=>{
  e.preventDefault(); $("loginMessage").textContent="Signing in...";
  const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){$("loginMessage").textContent=error.message;return}
  $("loginMessage").textContent=""; await start();
};
$("logout").onclick=async()=>{await sb.auth.signOut();location.reload()};

$("addEvent").onclick=()=>{ $("eventForm").reset();$("eventId").value="";show("eventForm") };
$("cancelEvent").onclick=()=>show("eventForm",false);
$("eventForm").onsubmit=async e=>{
  e.preventDefault();
  const row={Title:$("eventTitle").value.trim(),description:$("eventDescription").value.trim(),event_date:$("eventDate").value,event_time:$("eventTime").value||null,location:$("eventLocation").value.trim()};
  const id=$("eventId").value;
  const {error}=id?await sb.from("events").update(row).eq("id",id):await sb.from("events").insert(row);
  $("eventMessage").textContent=error?error.message:"Saved.";
  if(!error){show("eventForm",false);loadEvents()}
};
async function loadEvents(){
  const box=$("events"); const {data,error}=await sb.from("events").select("*").order("event_date",{ascending:true});
  if(error){box.innerHTML="<p class=message>"+esc(error.message)+"</p>";return}
  box.innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.Title)}</b><p>📅 ${esc(x.event_date)} ${x.event_time?esc(x.event_time):""}</p>${x.location?`<p>📍 ${esc(x.location)}</p>`:""}${x.description?`<p>${esc(x.description)}</p>`:""}</div><div class=actions><button onclick="editEvent('${x.id}')">Edit</button><button class=secondary onclick="deleteEvent('${x.id}')">Delete</button></div></div>`).join(""):"<p>No events.</p>";
}
window.editEvent=async id=>{const {data,error}=await sb.from("events").select("*").eq("id",id).single();if(error)return alert(error.message);$("eventId").value=data.id;$("eventTitle").value=data.Title||"";$("eventDescription").value=data.description||"";$("eventDate").value=data.event_date||"";$("eventTime").value=data.event_time||"";$("eventLocation").value=data.location||"";show("eventForm")};
window.deleteEvent=async id=>{if(confirm("Delete this event?")){const {error}=await sb.from("events").delete().eq("id",id);if(error)alert(error.message);else loadEvents()}};

$("addAarti").onclick=()=>{$("aartiForm").reset();$("aartiId").value="";$("aartiDate").value=today();show("aartiForm")};
$("cancelAarti").onclick=()=>show("aartiForm",false);
$("aartiForm").onsubmit=async e=>{
  e.preventDefault(); const row={aarti_date:$("aartiDate").value,person_name:$("aartiPerson").value.trim(),aarti_time:$("aartiTime").value||null,notes:$("aartiNotes").value.trim()}; const id=$("aartiId").value;
  const {error}=id?await sb.from("aarti").update(row).eq("id",id):await sb.from("aarti").insert(row);
  $("aartiMessage").textContent=error?error.message:"Saved."; if(!error){show("aartiForm",false);loadAarti()}
};
async function loadAarti(){
  const box=$("aartis"); const {data,error}=await sb.from("aarti").select("*").order("aarti_date",{ascending:false});
  if(error){box.innerHTML="<p class=message>"+esc(error.message)+"</p>";return}
  box.innerHTML=data?.length?data.map(x=>`<div class=item><div><b>🪔 ${esc(x.person_name)}</b><p>📅 ${esc(x.aarti_date)} ${x.aarti_time?` · 🕐 ${esc(x.aarti_time)}`:""}</p>${x.notes?`<p>${esc(x.notes)}</p>`:""}</div><div class=actions><button onclick="editAarti('${x.id}')">Edit</button><button class=secondary onclick="deleteAarti('${x.id}')">Delete</button></div></div>`).join(""):"<p>No Aarti entries.</p>";
}
window.editAarti=async id=>{const {data,error}=await sb.from("aarti").select("*").eq("id",id).single();if(error)return alert(error.message);$("aartiId").value=data.id;$("aartiDate").value=data.aarti_date||"";$("aartiPerson").value=data.person_name||"";$("aartiTime").value=data.aarti_time||"";$("aartiNotes").value=data.notes||"";show("aartiForm")};
window.deleteAarti=async id=>{if(confirm("Delete this Aarti entry?")){const {error}=await sb.from("aarti").delete().eq("id",id);if(error)alert(error.message);else loadAarti()}};

$("addDonation").onclick=()=>{$("donationForm").reset();$("donationId").value="";$("donationDate").value=today();show("donationForm")};
$("cancelDonation").onclick=()=>show("donationForm",false);
$("donationForm").onsubmit=async e=>{
  e.preventDefault(); const row={donor_name:$("donorName").value.trim(),mobile:$("donorMobile").value.trim(),amount:Number($("donorAmount").value),payment_mode:$("paymentMode").value,donation_date:$("donationDate").value,notes:$("donationNotes").value.trim()}; const id=$("donationId").value;
  const {error}=id?await sb.from("vargani").update(row).eq("id",id):await sb.from("vargani").insert(row);
  $("donationMessage").textContent=error?error.message:"Saved."; if(!error){show("donationForm",false);loadDonations()}
};
async function loadDonations(){
  const box=$("donations"); const {data,error}=await sb.from("vargani").select("*").order("donation_date",{ascending:false});
  if(error){box.innerHTML="<p class=message>"+esc(error.message)+"</p>";return}
  const total=(data||[]).reduce((s,x)=>s+Number(x.amount||0),0); $("totalVargani").textContent="₹"+total.toFixed(2);
  box.innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.donor_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.donation_date)} · ${esc(x.payment_mode)}</p></div><div class=actions><button onclick="editDonation('${x.id}')">Edit</button><button class=secondary onclick="deleteDonation('${x.id}')">Delete</button></div></div>`).join(""):"<p>No donations.</p>";
  updateRemaining();
}
window.editDonation=async id=>{const {data,error}=await sb.from("vargani").select("*").eq("id",id).single();if(error)return alert(error.message);$("donationId").value=data.id;$("donorName").value=data.donor_name||"";$("donorMobile").value=data.mobile||"";$("donorAmount").value=data.amount??"";$("paymentMode").value=data.payment_mode||"Other";$("donationDate").value=data.donation_date||"";$("donationNotes").value=data.notes||"";show("donationForm")};
window.deleteDonation=async id=>{if(confirm("Delete this donation?")){const {error}=await sb.from("vargani").delete().eq("id",id);if(error)alert(error.message);else loadDonations()}};

$("addExpense").onclick=()=>{$("expenseForm").reset();$("expenseId").value="";$("expenseDate").value=today();show("expenseForm")};
$("cancelExpense").onclick=()=>show("expenseForm",false);
$("expenseForm").onsubmit=async e=>{
  e.preventDefault(); const row={item_name:$("expenseItem").value.trim(),amount:Number($("expenseAmount").value),expense_date:$("expenseDate").value,notes:$("expenseNotes").value.trim()}; const id=$("expenseId").value;
  const {error}=id?await sb.from("expenses").update(row).eq("id",id):await sb.from("expenses").insert(row);
  $("expenseMessage").textContent=error?error.message:"Saved."; if(!error){show("expenseForm",false);loadExpenses()}
};
async function loadExpenses(){
  const box=$("expenses"); const {data,error}=await sb.from("expenses").select("*").order("expense_date",{ascending:false});
  if(error){box.innerHTML="<p class=message>"+esc(error.message)+"</p>";$("totalExpenses").textContent="—";$("remaining").textContent="—";return}
  const total=(data||[]).reduce((s,x)=>s+Number(x.amount||0),0); $("totalExpenses").textContent="₹"+total.toFixed(2);
  box.innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.item_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.expense_date)}</p></div><div class=actions><button onclick="editExpense('${x.id}')">Edit</button><button class=secondary onclick="deleteExpense('${x.id}')">Delete</button></div></div>`).join(""):"<p>No expenses.</p>";
  updateRemaining();
}
async function updateRemaining(){
  const {data}=await sb.from("vargani").select("amount"); const {data:ex}=await sb.from("expenses").select("amount");
  const total=(data||[]).reduce((s,x)=>s+Number(x.amount||0),0), spent=(ex||[]).reduce((s,x)=>s+Number(x.amount||0),0);
  $("totalVargani").textContent="₹"+total.toFixed(2); $("totalExpenses").textContent="₹"+spent.toFixed(2); $("remaining").textContent="₹"+(total-spent).toFixed(2);
}
window.editExpense=async id=>{const {data,error}=await sb.from("expenses").select("*").eq("id",id).single();if(error)return alert(error.message);$("expenseId").value=data.id;$("expenseItem").value=data.item_name||"";$("expenseAmount").value=data.amount??"";$("expenseDate").value=data.expense_date||"";$("expenseNotes").value=data.notes||"";show("expenseForm")};
window.deleteExpense=async id=>{if(confirm("Delete this expense?")){const {error}=await sb.from("expenses").delete().eq("id",id);if(error)alert(error.message);else loadExpenses()}};

sb.auth.getSession().then(start);
