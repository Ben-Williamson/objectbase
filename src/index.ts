import {SupabaseClient} from "@supabase/supabase-js";

export function wrapper(client: SupabaseClient): void {
    console.log(client);
}