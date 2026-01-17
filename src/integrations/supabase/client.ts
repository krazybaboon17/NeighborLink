// This file creates and exports the Supabase client. If VITE_SUPABASE_URL or
// VITE_SUPABASE_PUBLISHABLE_KEY is not provided, it falls back to a lightweight
// in-memory mock implementation so the app can run locally without a Supabase
// project. The mock implements the minimal `.from(...).select/insert/update`
// API used by the app.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Debug environment variables
console.log('Environment variables:', {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  allEnvVars: import.meta.env
});

// Use real client if credentials are available, otherwise fall back to mock
let supabase: any;

if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  console.log('Using real Supabase client with URL:', SUPABASE_URL);
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} else {
  console.log('Using mock Supabase client');
  // Minimal in-memory mock implementation
  function genId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  type Row = Record<string, any>;

  class MockQuery {
    table: string;
    db: MockDB;
    _filters: Array<(r: Row) => boolean> = [];
    _order: { field: string; asc: boolean } | null = null;
    constructor(table: string, db: MockDB) {
      this.table = table;
      this.db = db;
    }
    select(_: any = '*') {
      return this;
    }
    eq(field: string, value: any) {
      this._filters.push((r) => r[field] === value);
      return this;
    }
    in(field: string, values: any[]) {
      this._filters.push((r) => values.includes(r[field]));
      return this;
    }
    order(field: string, opts: { ascending: boolean }) {
      // Handle undefined opts gracefully
      const ascending = opts?.ascending ?? true;
      this._order = { field, asc: ascending };
      return this;
    }
    async single() {
      const res = await this._execute();
      if (!res || res.length === 0) return { data: null, error: { message: 'No rows' } };
      return { data: res[0], error: null };
    }
    async _execute() {
      const table = this.db.getTable(this.table);
      let rows = table.slice();
      for (const f of this._filters) rows = rows.filter(f);
      if (this._order) rows.sort((a, b) => {
        const A = a[this._order!.field];
        const B = b[this._order!.field];
        if (A === B) return 0;
        return (A > B ? 1 : -1) * (this._order!.asc ? 1 : -1);
      });
      return rows;
    }
    // Make the MockQuery thenable so `await supabase.from(...).select()` works
    then(resolve: any, reject: any) {
      this._execute()
        .then((rows) => resolve({ data: rows, error: null }))
        .catch((err) => reject(err));
    }
    async insert(obj: Row | Row[]) {
      const table = this.db.getTable(this.table);
      const items = Array.isArray(obj) ? obj : [obj];
      const now = new Date().toISOString();
      for (const item of items) {
        const row: Row = { ...item };
        if (!row.id) row.id = genId();
        if (!row.created_at) row.created_at = now;
        if (!row.updated_at) row.updated_at = now;
        table.push(row);
      }
      // Persist changes to localStorage
      persistData(this.db);
      return { data: items, error: null };
    }
    async update(obj: Row) {
      const table = this.db.getTable(this.table);
      const rows = await this._execute();
      const now = new Date().toISOString();
      for (const r of rows) {
        Object.assign(r, obj);
        r.updated_at = now;
      }
      // Persist changes to localStorage
      persistData(this.db);
      return { data: rows, error: null };
    }
  }

  // Load persisted data from localStorage or use empty arrays
  const loadPersistedData = () => {
    try {
      const data = localStorage.getItem('mockDB');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading mock data:', e);
    }
    return {
      tasks: [],
      offers: [],
      profiles: [],
      messages: [],
      verifications: [],
      volunteer_hours: []
    };
  };

  // Save data to localStorage
  const persistData = (db: any) => {
    try {
      localStorage.setItem('mockDB', JSON.stringify({
        tasks: db.tasks,
        offers: db.offers,
        profiles: db.profiles,
        messages: db.messages,
        verifications: db.verifications,
        volunteer_hours: db.volunteer_hours
      }));
    } catch (e) {
      console.error('Error persisting mock data:', e);
    }
  };

  class MockDB {
    tasks: Row[];
    offers: Row[];
    profiles: Row[];
    messages: Row[];
    verifications: Row[];
    volunteer_hours: Row[];

    constructor() {
      const data = loadPersistedData();
      this.tasks = data.tasks;
      this.offers = data.offers;
      this.profiles = data.profiles;
      this.messages = data.messages;
      this.verifications = data.verifications;
      this.volunteer_hours = data.volunteer_hours;
    }

    getTable(name: string) {
      switch (name) {
        case 'tasks': return this.tasks;
        case 'offers': return this.offers;
        case 'profiles': return this.profiles;
        case 'messages': return this.messages;
        case 'verifications': return this.verifications;
        case 'volunteer_hours': return this.volunteer_hours;
        default:
          (this as any)[name] = (this as any)[name] || [];
          return (this as any)[name];
      }
    }
  }

  const mockDB = new MockDB();

  // Mock auth state management
  let currentMockUser = {
    id: '00000000-0000-4000-8000-000000000000',
    email: 'local@dev'
  };

  const authCallbacks: ((event: string, session: any) => void)[] = [];
  
  supabase = {
    auth: {
      async getUser() {
        return { data: { user: currentMockUser }, error: null };
      },
      async getSession() {
        return currentMockUser ? { 
          data: { session: { user: currentMockUser } },
          error: null 
        } : { 
          data: { session: null },
          error: null 
        };
      },
      onAuthStateChange(callback: any) {
        const subscription = {
          unsubscribe() { 
            const index = authCallbacks.indexOf(callback);
            if (index > -1) {
              authCallbacks.splice(index, 1);
            }
          }
        };
        authCallbacks.push(callback);
        // Call callback with initial state
        if (currentMockUser) {
          setTimeout(() => callback('SIGNED_IN', { user: currentMockUser }), 0);
        } else {
          setTimeout(() => callback('SIGNED_OUT', null), 0);
        }
        return { data: { subscription } };
      },
      async signOut() {
        currentMockUser = null as any;
        // Notify all listeners
        authCallbacks.forEach(cb => cb('SIGNED_OUT', null));
        console.log('Mock sign out successful');
        return { error: null };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        // For mock purposes, accept any email/password
        currentMockUser = {
          id: genId(), // Generate a new random ID for each sign in
          email: email
        };

        // Create a profile for the new user
        const profilesTable = mockDB.getTable('profiles');
        const profile = {
          id: currentMockUser.id,
          email: currentMockUser.email,
          full_name: email.split('@')[0] // Use part before @ as name
        };
        profilesTable.push(profile);
        persistData(mockDB);

        // Notify all listeners
        authCallbacks.forEach(cb => cb('SIGNED_IN', { user: currentMockUser }));
        console.log('Mock sign in successful:', currentMockUser);
        return { data: { user: currentMockUser }, error: null };
      }
    },
    from(table: string) {
      return new MockQuery(table, mockDB);
    },
    // basic channel stub for realtime in Messages.tsx
    channel() {
      return {
        on() { return this; },
        subscribe() { return this; }
      };
    },
    removeChannel() { /* noop */ },
    storage: {
      from() {
        return {
          async upload() { return { error: null, data: null }; },
          async getPublicUrl() { return { data: { publicUrl: '' } }; }
        };
      }
    }
  } as any;
}

export { supabase };