const $ = id => document.getElementById(id);

function today(){
  return new Date().toISOString().slice(0,10);
}
function esc(v){
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function show(el, yes=true){ el.classList.toggle('hidden', !yes); }

async function isAdmin(){
  const {data:{user}} = await sb.auth.getUser();
  if(!user) return null;
  const {data, error} = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if(error || !data) return null;
  return user;
}

async function requireAdmin(){
  const user = await isAdmin();
  if(!user){
    await sb.auth.signOut();
    show($('loginView'), true); show($('appView'), false);
    $('loginMsg').textContent = 'This account is not an authorized admin.';
    return null;
  }
  $('signedInAs').textContent = 'Signed in as ' + user.email;
  show($('loginView'), false); show($('appView'), true);
  await loadEvents();
  await loadDonations();
  await loadExpenses();
  return user;
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginMsg').textContent = 'Signing in...';
  const {error} = await sb.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });
  if(error){ $('loginMsg').textContent = error.message; return; }
  $('loginMsg').textContent = '';
  await requireAdmin();
});

$('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  show($('appView'), false); show($('loginView'), true);
});

$('newEventBtn').onclick = () => {
  $('eventForm').reset();
  $('eventId').value = '';
  show($('eventForm'), true);
};
$('cancelEventBtn').onclick = () => show($('eventForm'), false);

$('eventForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('eventId').value;
  const row = {
    Title: $('eventTitle').value.trim(),
    description: $('eventDescription').value.trim(),
    event_date: $('eventDate').value,
    event_time: $('eventTime').value || null,
    location: $('eventLocation').value.trim()
  };
  const q = id
    ? sb.from('events').update(row).eq('id', id)
    : sb.from('events').insert(row);
  const {error} = await q;
  $('eventMsg').textContent = error ? error.message : 'Event saved.';
  if(!error){ show($('eventForm'), false); await loadEvents(); }
});

async function loadEvents(){
  const box = $('eventsList');
  box.innerHTML = '<p>Loading events...</p>';
  const {data,error} = await sb.from('events').select('*').order('event_date',{ascending:true}).order('event_time',{ascending:true});
  if(error){ box.innerHTML = '<p class="msg">'+esc(error.message)+'</p>'; return; }
  if(!data.length){ box.innerHTML = '<p>No events yet.</p>'; return; }
  box.innerHTML = data.map(x => `
    <div class="item">
      <div>
        <h3>${esc(x.Title)}</h3>
        <p>📅 ${esc(x.event_date)} ${x.event_time ? ' · 🕐 '+esc(x.event_time) : ''}</p>
        ${x.location ? '<p>📍 '+esc(x.location)+'</p>' : ''}
        ${x.description ? '<p>'+esc(x.description)+'</p>' : ''}
      </div>
      <div class="itemActions">
        <button onclick="editEvent('${x.id}')">Edit</button>
        <button class="secondary" onclick="deleteEvent('${x.id}')">Delete</button>
      </div>
    </div>`).join('');
}

window.editEvent = async id => {
  const {data,error} = await sb.from('events').select('*').eq('id',id).single();
  if(error){ alert(error.message); return; }
  $('eventId').value=data.id; $('eventTitle').value=data.Title||'';
  $('eventDescription').value=data.description||''; $('eventDate').value=data.event_date||'';
  $('eventTime').value=data.event_time||''; $('eventLocation').value=data.location||'';
  show($('eventForm'), true); window.scrollTo({top:0,behavior:'smooth'});
};
window.deleteEvent = async id => {
  if(!confirm('Delete this event?')) return;
  const {error}=await sb.from('events').delete().eq('id',id);
  if(error) alert(error.message); else await loadEvents();
};

$('newDonationBtn').onclick = () => {
  $('donationForm').reset();
  $('donationId').value=''; $('donationDate').value=today();
  show($('donationForm'),true);
};
$('cancelDonationBtn').onclick=()=>show($('donationForm'),false);

$('donationForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const id=$('donationId').value;
  const row={
    donor_name:$('donorName').value.trim(),
    mobile:$('donorMobile').value.trim(),
    amount:Number($('donorAmount').value),
    payment_mode:$('paymentMode').value,
    donation_date:$('donationDate').value,
    notes:$('donationNotes').value.trim()
  };
  const q=id ? sb.from('vargani').update(row).eq('id',id) : sb.from('vargani').insert(row);
  const {error}=await q;
  $('donationMsg').textContent=error?error.message:'Donation saved.';
  if(!error){show($('donationForm'),false);await loadDonations();}
});

async function loadDonations(){
  const box=$('donationsList'); box.innerHTML='<p>Loading donations...</p>';
  const {data,error}=await sb.from('vargani').select('*').order('donation_date',{ascending:false}).order('created_at',{ascending:false});
  if(error){box.innerHTML='<p class="msg">'+esc(error.message)+'</p>';return;}
  if(!data.length){box.innerHTML='<p>No donations recorded yet.</p>';return;}
  const total=data.reduce((s,x)=>s+Number(x.amount||0),0);
  box.innerHTML='<p><strong>Total recorded: ₹'+total.toFixed(2)+'</strong></p>'+data.map(x=>`
    <div class="item">
      <div><h3>${esc(x.donor_name)} — ₹${Number(x.amount||0).toFixed(2)}</h3>
      <p>📅 ${esc(x.donation_date)} · ${esc(x.payment_mode)}</p>
      ${x.mobile?'<p>📱 '+esc(x.mobile)+'</p>':''}
      ${x.notes?'<p>'+esc(x.notes)+'</p>':''}</div>
      <div class="itemActions"><button onclick="editDonation('${x.id}')">Edit</button><button class="secondary" onclick="deleteDonation('${x.id}')">Delete</button></div>
    </div>`).join('');
}
window.editDonation=async id=>{
  const {data,error}=await sb.from('vargani').select('*').eq('id',id).single();
  if(error){alert(error.message);return;}
  $('donationId').value=data.id;$('donorName').value=data.donor_name||'';$('donorMobile').value=data.mobile||'';
  $('donorAmount').value=data.amount??'';$('paymentMode').value=data.payment_mode||'Other';$('donationDate').value=data.donation_date||'';
  $('donationNotes').value=data.notes||'';show($('donationForm'),true);window.scrollTo({top:0,behavior:'smooth'});
};
window.deleteDonation=async id=>{
  if(!confirm('Delete this donation record?'))return;
  const {error}=await sb.from('vargani').delete().eq('id',id);
  if(error)alert(error.message);else await loadDonations();
};

$('newExpenseBtn').onclick = () => {
  $('expenseForm').reset();
  $('expenseId').value = '';
  $('expenseDate').value = today();
  show($('expenseForm'), true);
};
$('cancelExpenseBtn').onclick = () => show($('expenseForm'), false);

$('expenseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('expenseId').value;
  const row = {
    item_name: $('expenseItem').value.trim(),
    amount: Number($('expenseAmount').value),
    expense_date: $('expenseDate').value,
    notes: $('expenseNotes').value.trim()
  };
  const q = id
    ? sb.from('expenses').update(row).eq('id', id)
    : sb.from('expenses').insert(row);
  const {error} = await q;
  $('expenseMsg').textContent = error ? error.message : 'Expense saved.';
  if (!error) {
    show($('expenseForm'), false);
    await loadExpenses();
  }
});

async function loadExpenses() {
  const box = $('expensesList');
  box.innerHTML = '<p>Loading expenses...</p>';

  const {data, error} = await sb.from('expenses')
    .select('*')
    .order('expense_date', {ascending:false})
    .order('created_at', {ascending:false});

  if (error) {
    box.innerHTML = '<p class="msg">'+esc(error.message)+'</p>';
    return;
  }

  const expenseTotal = (data || []).reduce((s,x) => s + Number(x.amount || 0), 0);
  $('totalExpenses').textContent = '₹' + expenseTotal.toFixed(2);

  const {data: donations, error: donationError} =
    await sb.from('vargani').select('amount');

  if (donationError) {
    $('totalVargani').textContent = '—';
    $('remainingVargani').textContent = '—';
  } else {
    const donationTotal = (donations || [])
      .reduce((s,x) => s + Number(x.amount || 0), 0);
    $('totalVargani').textContent = '₹' + donationTotal.toFixed(2);
    $('remainingVargani').textContent =
      '₹' + (donationTotal - expenseTotal).toFixed(2);
  }

  if (!data || !data.length) {
    box.innerHTML = '<p>No expenses recorded yet.</p>';
    return;
  }

  box.innerHTML = data.map(x => `
    <div class="item">
      <div>
        <h3>${esc(x.item_name)} — ₹${Number(x.amount||0).toFixed(2)}</h3>
        <p>📅 ${esc(x.expense_date)}</p>
        ${x.notes ? '<p>'+esc(x.notes)+'</p>' : ''}
      </div>
      <div class="itemActions">
        <button onclick="editExpense('${x.id}')">Edit</button>
        <button class="secondary" onclick="deleteExpense('${x.id}')">Delete</button>
      </div>
    </div>`).join('');
}

window.editExpense = async id => {
  const {data,error} = await sb.from('expenses').select('*').eq('id',id).single();
  if (error) { alert(error.message); return; }
  $('expenseId').value = data.id;
  $('expenseItem').value = data.item_name || '';
  $('expenseAmount').value = data.amount ?? '';
  $('expenseDate').value = data.expense_date || '';
  $('expenseNotes').value = data.notes || '';
  show($('expenseForm'), true);
  window.scrollTo({top:0,behavior:'smooth'});
};

window.deleteExpense = async id => {
  if (!confirm('Delete this expense record?')) return;
  const {error} = await sb.from('expenses').delete().eq('id',id);
  if (error) alert(error.message);
  else await loadExpenses();
};


sb.auth.getSession().then(() => requireAdmin());
