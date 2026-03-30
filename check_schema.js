const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('cases').select('*').limit(5);
    if (error) {
        console.log("Error:", error.message);
    } else {
        data.forEach((row, i) => {
            console.log(`\n--- Row ${i + 1} ---`);
            console.log("title:", row.title);
            console.log("description:", row.description ? row.description.substring(0, 80) + "..." : "NULL/EMPTY");
            console.log("evidence_url:", row.evidence_url || "NULL/EMPTY");
            console.log("category:", row.category);
            console.log("platform:", row.platform);
            console.log("All columns:", Object.keys(row).join(", "));
        });
    }

    // Also check if storage bucket exists
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    console.log("\n--- Storage Buckets ---");
    if (bucketErr) console.log("Bucket error:", bucketErr.message);
    else console.log("Buckets:", buckets?.map(b => b.name).join(", ") || "NONE");
}
check();
