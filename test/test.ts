import 'dotenv/config'

import {createClient, SupabaseClient} from '@supabase/supabase-js'
import {Table, Row, RowObjectProxy} from "../src";

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
)

class PetsTable extends Table<Pet>
    {
    constructor(supabase: SupabaseClient)
        {
        super(supabase, 'pets', Pet);
        }
    }

class Pet extends RowObjectProxy
    {
    id!: number;
    name!: string;
    breed!: string;

    constructor(table: Table<Pet>, content: any)
        {
        super(table, content);
        }
    }

async function testit()
    {
    const { data, error: e } = await supabase.auth.signInWithPassword({
        email: process.env.USER_EMAIL as string,
        password: process.env.USER_PASSWORD as string,
    });

    let pets_table = new PetsTable(supabase);

    let [pets, error] = await pets_table.select_all();

    if (pets)
        {
        let pet = pets[0];

        console.log(pet.id, pet.name, pet.breed);

        // Looks like we might have occasional issues with
        // not waiting for the last update.  This is likely
        // due to how Promise.all().finally() is used under
        // the hood.
        pet.id = 14;
        pet.name = "Pip";
        pet.breed = "Russian Dwarf";

        await pet.sync();

        console.log(pet.id, pet.name, pet.breed);
        }

    }

testit();