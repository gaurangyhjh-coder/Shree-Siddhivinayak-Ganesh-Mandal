const SUPABASE_URL = "https://brfegowczdarhljtmxtl.supabase.co";
const SUPABASE_KEY = "sb_publishable_r-f0TfqlnBV2gHNK0ejZwA_ZMuhKz58";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
const show = (id, on=true) => $(id).classList.toggle("hidden", !on);

async function isAdmin(user) {
  const {data,error} = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return !!data;
}

async function start() {
  const {data:{user}} = await sb.auth.getUser();
  if (!user) { show("login",true); show("dashboard",false); return; }
  try {
    if (!await isAdmin(user)) throw new Error("This account is not in the admins table.");
    $("account").textContent = user.email || "";
    show("login",false); show("dashboard",true);
    await Promise.all([loadEvents(),loadAarti(),loadVargani(),loadExpenses()]);
  } catch(e) {
    $("loginMessage").textContent = e.message;
    show("login",true); show("dashboard",false);
  }
}

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginButton").disabled = true;
  $("loginButton").textContent = "Logging in...";
  $("loginMessage").textContent = "";
  const {error} = await sb.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });
  if (error) {
    $("loginMessage").textContent = error.message;
    $("loginButton").disabled = false;
    $("loginButton").textContent = "Login";
    return;
  }
  $("loginButton").disabled = false;
  $("loginButton").textContent = "Login";
  await start();
});

$("logout").addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});

/* EVENTS */
$("addEvent").onclick = () => {
  $("eventForm").reset(); $("eventId").value = ""; show("eventForm");
};
$("cancelEvent").onclick = () => show("eventForm",false);

async function loadEvents() {
  const {data,error} = await sb.from("events").select("*").order("event_date",{ascending:true});
  if (error) { $("events").innerHTML = `<p class="message">${esc(error.message)}</p>`; return; }
  $("events").innerHTML = data?.length ? data.map(x => `
    <div class="item">
      <div><b>${esc(x.Title)}</b><p>📅 ${esc(x.event_date||"")} ${esc(x.event_time||"")}</p></div>
      <div class="actions">
        <button type="button" onclick="editEvent('${x.id}')">Edit</button>
        <button type="button" class="secondary" onclick="deleteEvent('${x.id}')">Delete</button>
      </div>
    </div>`).join("") : "<p>No events.</p>";
}
window.editEvent = async id => {
  const {data,error} = await sb.from("events").select("*").eq("id",id).single();
  if (error) return alert(error.message);
  $("eventId").value=data.id; $("eventTitle").value=data.Title||"";
  $("eventDate").value=data.event_date||""; $("eventTime").value=data.event_time||"";
  $("eventLocation").value=data.location||""; $("eventDescription").value=data.description||"";
  show("eventForm");
};
window.deleteEvent = async id => {
  if (!confirm("Delete this event?")) return;
  const {error}=await sb.from("events").delete().eq("id",id);
  if(error) alert(error.message); else loadEvents();
};
$("eventForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id=$("eventId").value;
  const row={Title:$("eventTitle").value.trim(),event_date:$("eventDate").value,
    event_time:$("eventTime").value||null,location:$("eventLocation").value.trim()||null,
    description:$("eventDescription").value.trim()||null};
  const r=id?await sb.from("events").update(row).eq("id",id):await sb.from("events").insert(row);
  $("eventMessage").textContent=r.error?r.error.message:"Saved.";
  if(!r.error){show("eventForm",false);loadEvents();}
});

/* AARTI */
$("addAarti").onclick = () => {
  $("aartiForm").reset(); $("aartiId").value=""; $("aartiDate").value=today(); show("aartiForm");
};
$("cancelAarti").onclick=()=>show("aartiForm",false);

async function loadAarti(){
  const {data,error}=await sb.from("aarti").select("*").order("aarti_date",{ascending:true});
  if(error){$("aartis").innerHTML=`<p class="message">${esc(error.message)}</p>`;return;}
  $("aartis").innerHTML=data?.length?data.map(x=>`
    <div class="item">
      <div><b>🪔 ${esc(x.person_name)}</b><p>📅 ${esc(x.aarti_date||"")} ${esc(x.aarti_time||"")}</p></div>
      <div class="actions"><button type="button" onclick="editAarti('${x.id}')">Edit</button><button type="button" class="secondary" onclick="deleteAarti('${x.id}')">Delete</button></div>
    </div>`).join(""):"<p>No Aarti entries.</p>";
}
window.editAarti=async id=>{
  const {data,error}=await sb.from("aarti").select("*").eq("id",id).single();
  if(error)return alert(error.message);
  $("aartiId").value=data.id;$("aartiDate").value=data.aarti_date||"";$("aartiPerson").value=data.person_name||"";
  $("aartiTime").value=data.aarti_time||"";$("aartiNotes").value=data.notes||"";show("aartiForm");
};
window.deleteAarti=async id=>{
  if(!confirm("Delete this Aarti entry?"))return;
  const {error}=await sb.from("aarti").delete().eq("id",id);
  if(error)alert(error.message);else loadAarti();
};
$("aartiForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("aartiId").value;
  const row={aarti_date:$("aartiDate").value,person_name:$("aartiPerson").value.trim(),aarti_time:$("aartiTime").value||null,notes:$("aartiNotes").value.trim()||null};
  const r=id?await sb.from("aarti").update(row).eq("id",id):await sb.from("aarti").insert(row);
  $("aartiMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("aartiForm",false);loadAarti();}
});

/* VARGANI */
$("addDonation").onclick=()=>{
  $("donationForm").reset();$("donationId").value="";$("donationDate").value=today();show("donationForm");
};
$("cancelDonation").onclick=()=>show("donationForm",false);

async function loadVargani(){
  const {data,error}=await sb.from("vargani").select("*").order("donation_date",{ascending:false});
  if(error){$("donations").innerHTML=`<p class="message">${esc(error.message)}</p>`;return;}
  $("donations").innerHTML=data?.length?data.map(x=>`
    <div class="item">
      <div><b>${esc(x.donor_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.donation_date||"")} · ${esc(x.payment_mode||"")}</p></div>
      <div class="actions"><button type="button" onclick="editVargani('${x.id}')">Edit</button><button type="button" class="secondary" onclick="deleteVargani('${x.id}')">Delete</button></div>
    </div>`).join(""):"<p>No donations.</p>";
  await updateRemaining();
}
window.editVargani=async id=>{
  const {data,error}=await sb.from("vargani").select("*").eq("id",id).single();
  if(error)return alert(error.message);
  $("donationId").value=data.id;$("donorName").value=data.donor_name||"";$("donorMobile").value=data.mobile||"";
  $("donorAmount").value=data.amount??"";$("paymentMode").value=data.payment_mode||"Other";$("donationDate").value=data.donation_date||"";
  $("donationNotes").value=data.notes||"";show("donationForm");
};
window.deleteVargani=async id=>{
  if(!confirm("Delete this Vargani entry?"))return;
  const {error}=await sb.from("vargani").delete().eq("id",id);
  if(error)alert(error.message);else loadVargani();
};
$("donationForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("donationId").value;
  const row={donor_name:$("donorName").value.trim(),mobile:$("donorMobile").value.trim()||null,amount:Number($("donorAmount").value),
    payment_mode:$("paymentMode").value,donation_date:$("donationDate").value,notes:$("donationNotes").value.trim()||null};
  const r=id?await sb.from("vargani").update(row).eq("id",id):await sb.from("vargani").insert(row);
  $("donationMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("donationForm",false);loadVargani();}
});

/* EXPENSES */
$("addExpense").onclick=()=>{
  $("expenseForm").reset();$("expenseId").value="";$("expenseDate").value=today();show("expenseForm");
};
$("cancelExpense").onclick=()=>show("expenseForm",false);

async function loadExpenses(){
  const {data,error}=await sb.from("expenses").select("*").order("expense_date",{ascending:false});
  if(error){$("expenses").innerHTML=`<p class="message">${esc(error.message)}</p>`;return;}
  $("expenses").innerHTML=data?.length?data.map(x=>`
    <div class="item">
      <div><b>${esc(x.item_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.expense_date||"")}</p></div>
      <div class="actions"><button type="button" onclick="editExpense('${x.id}')">Edit</button><button type="button" class="secondary" onclick="deleteExpense('${x.id}')">Delete</button></div>
    </div>`).join(""):"<p>No expenses.</p>";
  await updateRemaining();
}
window.editExpense=async id=>{
  const {data,error}=await sb.from("expenses").select("*").eq("id",id).single();
  if(error)return alert(error.message);
  $("expenseId").value=data.id;$("expenseItem").value=data.item_name||"";$("expenseAmount").value=data.amount??"";
  $("expenseDate").value=data.expense_date||"";$("expenseNotes").value=data.notes||"";show("expenseForm");
};
window.deleteExpense=async id=>{
  if(!confirm("Delete this expense?"))return;
  const {error}=await sb.from("expenses").delete().eq("id",id);
  if(error)alert(error.message);else loadExpenses();
};
$("expenseForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("expenseId").value;
  const row={item_name:$("expenseItem").value.trim(),amount:Number($("expenseAmount").value),expense_date:$("expenseDate").value,notes:$("expenseNotes").value.trim()||null};
  const r=id?await sb.from("expenses").update(row).eq("id",id):await sb.from("expenses").insert(row);
  $("expenseMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("expenseForm",false);loadExpenses();}
});

async function updateRemaining(){
  const a=await sb.from("vargani").select("amount"), b=await sb.from("expenses").select("amount");
  if(a.error||b.error)return;
  const total=(a.data||[]).reduce((s,x)=>s+Number(x.amount||0),0);
  const spent=(b.data||[]).reduce((s,x)=>s+Number(x.amount||0),0);
  $("totalVargani").textContent="₹"+total.toFixed(2);
  $("totalExpenses").textContent="₹"+spent.toFixed(2);
  $("remaining").textContent="₹"+(total-spent).toFixed(2);
}

sb.auth.getSession().then(start).catch(e=>$("loginMessage").textContent=e.message);
