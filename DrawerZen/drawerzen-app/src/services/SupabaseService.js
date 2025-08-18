// Supabase client wrapper for uploads + metadata insert
import { createClient } from '@supabase/supabase-js';
import { ORDER_STATUS_LIST, ORDER_STATUSES, normalizeStatus } from '../constants/orderStatuses';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || '';
const SUPABASE_BUCKET = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_BUCKET) || 'drawerzen';
const SUPABASE_TABLE = (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_SUPABASE_RECTIFY_TABLE || process.env.REACT_APP_SUPABASE_TABLE)) || 'dataset';
const SUPABASE_ORDERS_TABLE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ORDERS_TABLE) || 'orders';
const SUPABASE_DEBUG = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_DEBUG) || '';
const ORDER_INITIAL_STATUS = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ORDER_INITIAL_STATUS) || '';
const ORDER_ALLOWED_STATUSES = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ORDER_ALLOWED_STATUSES) || '';
const ORDER_REQUIRE_IMAGE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ORDER_REQUIRE_IMAGE) || '';

class SupabaseService {
  constructor() {
  this.bucket = SUPABASE_BUCKET;
  this.table = SUPABASE_TABLE; // legacy dataset table for rectification metadata
  this.ordersTable = SUPABASE_ORDERS_TABLE;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.enabled = true;
        if (SUPABASE_DEBUG) {
          const safeUrl = SUPABASE_URL.replace(/([a-zA-Z0-9._-]{6}).+/, '$1***');
          const safeKey = SUPABASE_ANON_KEY.slice(0, 6) + '***';
          // Provide a one-time snapshot so we can confirm which env source populated values
          if (typeof window !== 'undefined' && !window.__SUPABASE_ENV_SNAPSHOT) {
            window.__SUPABASE_ENV_SNAPSHOT = { url: safeUrl, bucket: this.bucket, table: this.table, ordersTable: this.ordersTable };
            console.info('[SupabaseService] Initialized with env snapshot', window.__SUPABASE_ENV_SNAPSHOT);
          }
        }
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
          // Distinguish missing table (404) vs policy
          if (error.code === 'PGRST116' || /not found/i.test(error.message || '')) {
            if (SUPABASE_DEBUG) console.error('[SupabaseService] table not found', tableName, error);
            return { success: false, error: { message: `Table ${tableName} not found (check env var)`, original: error } };
          }
        const errMsg = (error.message || '').toLowerCase();
        const isSelectPolicyIssue = errMsg.includes('permission') || errMsg.includes('policy') || errMsg.includes('rls') || errMsg.includes('select');
        if (isSelectPolicyIssue) {
          // Retry without .select() so that lack of SELECT policy doesn't mask a successful INSERT
            if (SUPABASE_DEBUG) console.warn('[SupabaseService] insert select failed – retrying without select', { tableName, error });
          const retry = await this.client.from(tableName).insert(record); // no select
          if (retry.error) {
            if (SUPABASE_DEBUG) console.error('[SupabaseService] insert retry failed', { tableName, error: retry.error });
            return { success: false, error: retry.error };
          }
          if (SUPABASE_DEBUG) console.debug('[SupabaseService] insert success (no return due to missing SELECT policy)', { tableName });
          return { success: true, data: null, note: 'Inserted without returning (no select policy)' };
        }
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

  // Generate a unique session id (lightweight, client side)
  generateUniqueSessionId() {
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buf = new Uint32Array(2);
        crypto.getRandomValues(buf);
        return 'sess_' + Date.now().toString(36) + '_' + Array.from(buf).map(n => n.toString(36)).join('');
      }
    } catch (e) { /* ignore */ }
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  /**
   * submitOrder mirrors the provided Order submission example:
   * - Validates required fields
   * - Sets default status
   * - Generates session_id when absent
   * - Inserts and returns the inserted row (if SELECT policy exists)
   * @param {Object} orderData - order object without id/created_at
   */
  async submitOrder(orderData) {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    if (!orderData || typeof orderData !== 'object') return { success: false, error: 'Invalid order data' };

    const mutable = { ...orderData };
  const requiredFields = ['drawer_dimensions_mm', 'shipping_address'];
  if (ORDER_REQUIRE_IMAGE) requiredFields.push('source_image');
    for (const field of requiredFields) {
      if (mutable[field] == null || mutable[field] === '') {
        return { success: false, error: new Error(`Missing required field: ${field}`) };
      }
    }

    // Enforce drawer_dimensions_mm structure (width, length, depth as numbers)
    if (mutable.drawer_dimensions_mm) {
      const dims = mutable.drawer_dimensions_mm;
      const dimKeys = ['width','length','depth'];
      const bad = dimKeys.filter(k => typeof dims[k] !== 'number' || Number.isNaN(dims[k]));
      if (bad.length) {
        return { success: false, error: new Error(`Invalid drawer_dimensions_mm.${bad.join(', ')} (must be numbers)`) };
      }
    }

    // Enforce shipping_address structure
    if (mutable.shipping_address) {
      const addr = mutable.shipping_address;
      const requiredAddr = ['street','city','state','zip','country'];
      const missingAddr = requiredAddr.filter(k => !addr[k] || (typeof addr[k] === 'string' && addr[k].trim() === ''));
      if (missingAddr.length) {
        return { success: false, error: new Error(`shipping_address missing fields: ${missingAddr.join(', ')}`) };
      }
    }

    // Source image strictly required if ORDER_REQUIRE_IMAGE or spec demands
    if (!mutable.source_image && ORDER_REQUIRE_IMAGE) {
      return { success: false, error: new Error('Missing required field: source_image') };
    }

    // Status normalization using centralized constant list (env list still optional override)
    let allowedStatuses = ORDER_STATUS_LIST;
    if (ORDER_ALLOWED_STATUSES) {
      const fromEnv = ORDER_ALLOWED_STATUSES.split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
      if (fromEnv.length) allowedStatuses = fromEnv;
    }
  const initial = ORDER_INITIAL_STATUS && allowedStatuses.includes(ORDER_INITIAL_STATUS) ? ORDER_INITIAL_STATUS : ORDER_STATUSES.PENDING;
    mutable.status = normalizeStatus(mutable.status || initial);
    if (!allowedStatuses.includes(mutable.status)) {
      if (SUPABASE_DEBUG) console.warn('[SupabaseService] Status not in allowed set, coercing', { provided: mutable.status, allowed: allowedStatuses });
      mutable.status = allowedStatuses[0];
    }
    if (!mutable.session_id) mutable.session_id = this.generateUniqueSessionId();
    // If orders.id column is UUID NOT NULL without default, generate a UUID client-side to avoid 22P02.
    if (mutable.id == null) {
      try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          mutable.id = crypto.randomUUID();
        } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const buf = new Uint8Array(16);
          crypto.getRandomValues(buf);
          // RFC4122 v4 formatting
          buf[6] = (buf[6] & 0x0f) | 0x40;
          buf[8] = (buf[8] & 0x3f) | 0x80;
          const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
          mutable.id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        } else {
          // Fallback pseudo-UUID (not cryptographically strong)
            const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
          mutable.id = `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
        }
      } catch (_) {
        // Worst-case: leave id undefined and let DB attempt default (will error if none)
        delete mutable.id;
      }
    } else {
      // If provided id is not valid UUID format and column expects UUID, remove to let DB assign default
      if (typeof mutable.id === 'number' || (typeof mutable.id === 'string' && !/^[0-9a-fA-F-]{32,36}$/.test(mutable.id))) {
        delete mutable.id;
      }
    }
    // Let DB default handle created_at unless caller supplies; do not force here

    try {
      const { data, error } = await this.client.from(this.ordersTable).insert(mutable).select();
      if (error) {
        // Handle status check constraint dynamically (23514)
        if (error.code === '23514' && /status/i.test(error.message || '') && /constraint/i.test(error.message || '')) {
          // Attempt with other allowed statuses
          for (const candidate of allowedStatuses) {
            if (candidate === mutable.status) continue;
            try {
              const retryAttempt = await this.client.from(this.ordersTable).insert({ ...mutable, status: candidate }).select();
              if (!retryAttempt.error) {
                if (SUPABASE_DEBUG) console.warn('[SupabaseService] submitOrder succeeded after status retry', { original: mutable.status, used: candidate });
                return { success: true, data: retryAttempt.data && retryAttempt.data[0], note: 'Status coerced due to constraint' };
              }
            } catch (_) { /* ignore */ }
          }
        }
        // Fallback behavior replicates insertInto logic if SELECT policy missing
        const errMsg = (error.message || '').toLowerCase();
        const isSelectPolicyIssue = errMsg.includes('permission') || errMsg.includes('policy') || errMsg.includes('rls') || errMsg.includes('select');
        if (isSelectPolicyIssue) {
          if (SUPABASE_DEBUG) console.warn('[SupabaseService] submitOrder select blocked – retrying without select', error);
          const retry = await this.client.from(this.ordersTable).insert(mutable); // no select
          if (retry.error) {
            if (SUPABASE_DEBUG) console.error('[SupabaseService] submitOrder retry failed', retry.error);
            return { success: false, error: retry.error };
          }
          return { success: true, data: null, note: 'Inserted without returning (no select policy)' };
        }
        if (SUPABASE_DEBUG) console.error('[SupabaseService] submitOrder error', error);
        return { success: false, error };
      }
      return { success: true, data: data && data[0] };
    } catch (e) {
      if (SUPABASE_DEBUG) console.error('[SupabaseService] submitOrder exception', e);
      return { success: false, error: e };
    }
  }
}

export default new SupabaseService();
