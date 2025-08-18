// Supabase client wrapper for uploads + metadata insert
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || '';
const SUPABASE_BUCKET = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_BUCKET) || 'drawerzen';
const SUPABASE_TABLE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_TABLE) || 'dataset';
const SUPABASE_ORDERS_TABLE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ORDERS_TABLE) || 'orders';
const SUPABASE_DEBUG = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_DEBUG) || '';

class SupabaseService {
  constructor() {
  this.bucket = SUPABASE_BUCKET;
  this.table = SUPABASE_TABLE; // legacy dataset table for rectification metadata
  this.ordersTable = SUPABASE_ORDERS_TABLE;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.enabled = true;
      } catch (e) {
        console.warn('Supabase init failed', e);
        this.client = null;
        this.enabled = false;
      }
    } else {
      this.client = null;
      this.enabled = false;
      if (typeof window !== 'undefined') {
        const missing = [];
        if (!SUPABASE_URL) missing.push('REACT_APP_SUPABASE_URL');
        if (!SUPABASE_ANON_KEY) missing.push('REACT_APP_SUPABASE_ANON_KEY');
        // Only log once
        if (!window.__SUPABASE_DISABLED_LOGGED) {
          window.__SUPABASE_DISABLED_LOGGED = true;
          console.warn('[SupabaseService] Disabled. Missing env vars:', missing.join(', ') || 'none');
        }
      }
    }
  }

  isEnabled() { return !!this.enabled; }

  async uploadImage(path, blob, contentType = 'image/jpeg') {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await this.client.storage.from(this.bucket).upload(path, blob, { contentType, upsert: true });
    if (error) {
      if (SUPABASE_DEBUG) console.error('[SupabaseService] uploadImage error', { path, error });
      return { success: false, error };
    }
    const { data: pub } = this.client.storage.from(this.bucket).getPublicUrl(path);
    if (SUPABASE_DEBUG) console.debug('[SupabaseService] uploadImage success', { path, publicUrl: pub?.publicUrl });
    return { success: true, data, publicUrl: pub?.publicUrl };
  }

  async insertRecord(record) { // backwards compatible (dataset)
    return this.insertInto(this.table, record);
  }

  async insertInto(tableName, record) {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    try {
      // Wrap in array only if needed – supabase-js accepts object or array
      const { data, error } = await this.client.from(tableName).insert(record).select();
      if (error) {
        if (SUPABASE_DEBUG) console.error('[SupabaseService] insert error', { tableName, error, record });
        return { success: false, error };
      }
      if (SUPABASE_DEBUG) console.debug('[SupabaseService] insert success', { tableName, data });
      return { success: true, data };
    } catch (e) {
      if (SUPABASE_DEBUG) console.error('[SupabaseService] insert exception', { tableName, error: e, record });
      return { success: false, error: e };
    }
  }

  async insertOrder(orderRecord) {
    return this.insertInto(this.ordersTable, orderRecord);
  }
}

export default new SupabaseService();
