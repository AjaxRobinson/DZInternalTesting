// Supabase client wrapper for uploads + metadata insert
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || '';
const SUPABASE_BUCKET = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_BUCKET) || 'drawerzen';
const SUPABASE_TABLE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_TABLE) || 'dataset';

class SupabaseService {
  constructor() {
    this.bucket = SUPABASE_BUCKET;
    this.table = SUPABASE_TABLE;
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
    }
  }

  isEnabled() { return !!this.enabled; }

  async uploadImage(path, blob, contentType = 'image/jpeg') {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await this.client.storage.from(this.bucket).upload(path, blob, { contentType, upsert: true });
    if (error) return { success: false, error };
    const { data: pub } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return { success: true, data, publicUrl: pub?.publicUrl };
  }

  async insertRecord(record) {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await this.client.from(this.table).insert(record).select();
    if (error) return { success: false, error };
    return { success: true, data };
  }
}

export default new SupabaseService();
