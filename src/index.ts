import {PostgrestError, SupabaseClient} from "@supabase/supabase-js";

class tracked_promise<T>
    {
    wrapped_promise: Promise<T>;
    is_settled: boolean;

    constructor(promise: Promise<T>)
        {
        this.is_settled = false;

        this.wrapped_promise = promise.finally(
            () => {
            this.is_settled = true;
            }
        );
        }

    finally(func: () => void): tracked_promise<T>
        {
        this.wrapped_promise.finally(func);
        return this;
        }
    }

export class Table<RowObject extends Row>
    {
    supabase: SupabaseClient;
    table_name: string;
    rowConstructor: new (table: Table<RowObject>, content: any) => RowObject;

    constructor(
        supabase: SupabaseClient,
        table_name: string,
        rowConstructor: new (table: Table<RowObject>, content: any) => RowObject
    )
        {
        this.supabase = supabase;
        this.table_name = table_name;
        this.rowConstructor = rowConstructor;
        }

    toString(): string
        {
        return `Objectbase table: ${this.table_name}`;
        }

    async select_all(): Promise<[RowObject[], PostgrestError | null]>
        {
        const {data, error} = await this.supabase
            .from(this.table_name)
            .select("*");

        if (error) return [[], error];

        return [data.map((item) => new this.rowConstructor(this, item)), null];
        }
    }

export class Row
    {
    table: Table<any>;
    content: any;
    private is_locked: boolean;
    private running_promises: tracked_promise<boolean>[];

    constructor(table: Table<any>, content: any)
        {
        this.table = table;
        this.content = content;

        this.is_locked = false;
        this.running_promises = [];
        }

    private unlock(): void
        {
        this.is_locked = false;
        this.running_promises = [];
        }

    private check_all_promises(): void
        {
        let all_settled = true;
        this.running_promises.forEach((p) => {
            all_settled = all_settled && p.is_settled;
        });

        if(all_settled)
            this.unlock();
        }

    private lock(promise: Promise<boolean>): void
        {
        let wrapped_promise = new tracked_promise(promise).finally(() => this.check_all_promises());
        this.is_locked = true;
        this.running_promises.push(wrapped_promise);
        }

    async sync(): Promise<boolean>
        {
        if (this.running_promises)
            await Promise.all(this.running_promises.map((wp) => wp.wrapped_promise));
        return true;
        }

    ready_to_read(): boolean
        {
        return !this.is_locked;
        }

    async update_field(field: string | symbol, value: any)
        {
        async function updater(this_row: Row): Promise<boolean>
            {
            const { error } = await this_row.table.supabase
                .from(this_row.table.table_name)
                .update({[field]: value})
                .eq('id', this_row.content.id)

            if (error)
                return false;

            this_row.content[field] = value;
            return true;
            }

        this.lock(updater(this));
        }

    }

export class RowObjectProxy extends Row
    {
    constructor(table: Table<any>, content: any)
        {
        super(table, content);

        return new Proxy(this, {
            get: (target: this, prop: string | symbol) => {
            // Check if the property exists on the instance
            if (prop in target)
            {
                return (target as any)[prop];
            }
            if (target.ready_to_read() && prop in target.content)
            {
                return (target.content as any)[prop];
            }
            return undefined;
            },
            set: (target: this, prop: string | symbol, value: any) => {
            if (prop === 'content')
                {
                this.content = value;
                return true;
                }
            target.update_field(prop, value);
            return true;
            }
        });
        }
    }
