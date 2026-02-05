import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, hasKey: !!supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing connection...');

    // Check Products
    const { data: products, error: prodError } = await supabase.from('products').select('count', { count: 'exact' });
    if (prodError) console.error('Products Error:', prodError);
    else console.log('Products Count:', products.length);

    // Check Sales
    const { data: sales, error: salesError } = await supabase.from('sales').select('*');
    if (salesError) console.error('Sales Error:', salesError);
    else {
        console.log('Sales Count:', sales.length);
        if (sales.length > 0) console.log('Sample Sale:', sales[0]);
    }

    // Check Purchases
    const { data: purchases, error: purError } = await supabase.from('purchases').select('*');
    if (purError) console.error('Purchases Error:', purError);
    else console.log('Purchases Count:', purchases.length);
}

testFetch();