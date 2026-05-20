import dns from 'dns';

const hosts = [
  'ekhsbwcdenmfokmzafzw.supabase.co',
  'db.ekhsbwcdenmfokmzafzw.supabase.co',
  'aws-0-eu-central-1.pooler.supabase.com'
];

async function checkDns() {
  for (const host of hosts) {
    try {
      const addresses = await dns.promises.lookup(host);
      console.log(`DNS Lookup for ${host}:`, addresses);
    } catch (err) {
      console.error(`DNS Lookup failed for ${host}:`, err.message);
    }
  }
}

checkDns();
