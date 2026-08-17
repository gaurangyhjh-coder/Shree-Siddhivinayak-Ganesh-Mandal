const SUPABASE_URL="https://brfegowczdarhljtmxtl.supabase.co";
const SUPABASE_KEY="sb_publishable_r-f0TfqlnBV2gHNK0ejZwA_ZMuhKz58";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const show=(id,on=true)=>$(id).classList.toggle("hidden",!on);

async function isAdmin(user){
  const {data,error}=await sb.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error) throw error;
  return !!data;
}
async function start(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user){show("login",true);show("dashboard",false);return}
  try{
    if(!(await isAdmin(user))){show("login",true);show("dashboard",false);$("loginMessage").textContent="This account is not in the admins table.";return}
  }catch(e){$("loginMessage").textContent="Admin check failed: "+e.message;return}
  $("account").textContent=user.email;show("login",false);show("dashboard",true);
  await Promise.all([loadEvents(),loadAarti(),loadDonations(),loadExpenses()]);
}

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  $("loginButton").disabled=true;$("loginButton").textContent="Logging in...";$("loginMessage").textContent="";
  const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){$("loginMessage").textContent=error.message;$("loginButton").disabled=false;$("loginButton").textContent="Login";return}
  await start();$("loginButton").disabled=false;$("loginButton").textContent="Login";
});
$("logout").addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});

$("addEvent").onclick=()=>{$("eventForm").reset();$("eventId").value="";show("eventForm")};
$("cancelEvent").onclick=()=>show("eventForm",false);
$("eventForm").addEventListener("submit",async e=>{
 e.preventDefault();const row={Title:$("eventTitle").value.trim(),description:$("eventDescription").value.trim(),event_date:$("eventDate").value,event_time:$("eventTime").value||null,location:$("eventLocation").value.trim()};const id=$("eventId").value;
 const r=id?await sb.from("events").update(row).eq("id",id):await sb.from("events").insert(row);
 $("eventMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("eventForm",false);loadEvents()}
});
async function loadEvents(){const {data,error}=await sb.from("events").select("*").order("event_date");if(error){$("events").innerHTML="<p class=message>"+esc(error.message)+"</p>";return}$("events").innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.Title)}</b><p>📅 ${esc(x.event_date)} ${esc(x.event_time||"")}</p></div></div>`).join(""):"<p>No events.</p>"}

$("addAarti").onclick=()=>{$("aartiForm").reset();$("aartiId").value="";$("aartiDate").value=today();show("aartiForm")};
$("cancelAarti").onclick=()=>show("aartiForm",false);
$("aartiForm").addEventListener("submit",async e=>{e.preventDefault();const row={aarti_date:$("aartiDate").value,person_name:$("aartiPerson").value.trim(),aarti_time:$("aartiTime").value||null,notes:$("aartiNotes").value.trim()};const id=$("aartiId").value;const r=id?await sb.from("aarti").update(row).eq("id",id):await sb.from("aarti").insert(row);$("aartiMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("aartiForm",false);loadAarti()}});
async function loadAarti(){const {data,error}=await sb.from("aarti").select("*").order("aarti_date",{ascending:false});if(error){$("aartis").innerHTML="<p class=message>"+esc(error.message)+"</p>";return}$("aartis").innerHTML=data?.length?data.map(x=>`<div class=item><div><b>🪔 ${esc(x.person_name)}</b><p>📅 ${esc(x.aarti_date)} ${esc(x.aarti_time||"")}</p></div></div>`).join(""):"<p>No Aarti entries.</p>"}

$("addDonation").onclick=()=>{$("donationForm").reset();$("donationId").value="";$("donationDate").value=today();show("donationForm")};
$("cancelDonation").onclick=()=>show("donationForm",false);
$("donationForm").addEventListener("submit",async e=>{e.preventDefault();const row={donor_name:$("donorName").value.trim(),mobile:$("donorMobile").value.trim(),amount:Number($("donorAmount").value),payment_mode:$("paymentMode").value,donation_date:$("donationDate").value,notes:$("donationNotes").value.trim()};const id=$("donationId").value;const r=id?await sb.from("vargani").update(row).eq("id",id):await sb.from("vargani").insert(row);$("donationMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("donationForm",false);loadDonations()}});
async function loadDonations(){const {data,error}=await sb.from("vargani").select("*").order("donation_date",{ascending:false});if(error){$("donations").innerHTML="<p class=message>"+esc(error.message)+"</p>";return}$("donations").innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.donor_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.donation_date)}</p></div></div>`).join(""):"<p>No donations.</p>";await updateRemaining()}

$("addExpense").onclick=()=>{$("expenseForm").reset();$("expenseId").value="";$("expenseDate").value=today();show("expenseForm")};
$("cancelExpense").onclick=()=>show("expenseForm",false);
$("expenseForm").addEventListener("submit",async e=>{e.preventDefault();const row={item_name:$("expenseItem").value.trim(),amount:Number($("expenseAmount").value),expense_date:$("expenseDate").value,notes:$("expenseNotes").value.trim()};const id=$("expenseId").value;const r=id?await sb.from("expenses").update(row).eq("id",id):await sb.from("expenses").insert(row);$("expenseMessage").textContent=r.error?r.error.message:"Saved.";if(!r.error){show("expenseForm",false);loadExpenses()}});
async function loadExpenses(){const {data,error}=await sb.from("expenses").select("*").order("expense_date",{ascending:false});if(error){$("expenses").innerHTML="<p class=message>"+esc(error.message)+"</p>";$("totalExpenses").textContent="—";$("remaining").textContent="—";return}$("expenses").innerHTML=data?.length?data.map(x=>`<div class=item><div><b>${esc(x.item_name)} — ₹${Number(x.amount||0).toFixed(2)}</b><p>📅 ${esc(x.expense_date)}</p></div></div>`).join(""):"<p>No expenses.</p>";await updateRemaining()}
async function updateRemaining(){const a=await sb.from("vargani").select("amount");const b=await sb.from("expenses").select("amount");const total=(a.data||[]).reduce((s,x)=>s+Number(x.amount||0),0);const spent=(b.data||[]).reduce((s,x)=>s+Number(x.amount||0),0);$("totalVargani").textContent="₹"+total.toFixed(2);$("totalExpenses").textContent="₹"+spent.toFixed(2);$("remaining").textContent="₹"+(total-spent).toFixed(2)}

sb.auth.getSession().then(start).catch(e=>{$("loginMessage").textContent=e.message});
