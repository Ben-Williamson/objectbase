import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import {wrapper} from "../src";

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
)

// wrapper(supabase);