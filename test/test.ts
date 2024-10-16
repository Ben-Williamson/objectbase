import 'dotenv/config'

import {createClient, SupabaseClient} from '@supabase/supabase-js'
import {Table, row_content, RowObjectProxy} from "../src";

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
    lat!: number;

    constructor(table: Table<Pet>, content: row_content)
        {
        super(table, content);
        }
    }

async function testit()
    {
    await supabase.auth.signInWithPassword({
        email: process.env.USER_EMAIL as string,
        password: process.env.USER_PASSWORD as string,
    });

    const pets_table = new PetsTable(supabase);

    const [pets, error] = await pets_table.select_all();

    if (!error)
        {
        pets.forEach(
            (pet) => {
            pet.delete();
            }
        )
        }

    // let [pets, error] = await pets_table.select_all();
    //
    // if (pets)
    //     {
    //     let pet = pets[6];
    //
    //     console.log(pet.id, pet.name, pet.breed);
    //
    //     pet.name = "Pip";
    //     pet.breed = "Russian Dwarf";
    //
    //     await pet.sync();
    //
    //     console.log(pet.id, pet.name, pet.breed);
    //     }

    const [new_pet] = await pets_table.new(
        {
            breed: 'Dog',
            name: 'Gromit',
            type: 'Hamster',
            to_dest: ''
        }
    );

    if (!new_pet)
        return false;

    new_pet.name = "Hetty"
    new_pet.lat = 10


    await new_pet?.sync()
    //
    // let [pet, err] = await pets_table.select_by_id(new_pet.id);
    //
    // if (!pet)
    //     return false;
    //
    // console.log("We have a pet!");
    // pet.name = "Abi Taylor";
    // await pet.sync();
    // pet.delete();
    // await pet.sync();
    }

testit();