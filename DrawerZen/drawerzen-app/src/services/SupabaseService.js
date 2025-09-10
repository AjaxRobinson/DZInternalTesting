import { supabase } from '../supabaseClient';

// Configuration with proper fallbacks and validation
const SUPABASE_BUCKET = 'drawerzen' || process.env.REACT_APP_SUPABASE_BUCKET ;
const SUPABASE_TABLE = process.env.REACT_APP_SUPABASE_TABLE || 'dataset';
const SUPABASE_ORDERS_TABLE = process.env.REACT_APP_SUPABASE_ORDERS_TABLE || 'orders';
const SUPABASE_BINS_TABLE = process.env.REACT_APP_SUPABASE_BINS_TABLE || 'bins';
const SUPABASE_PROJECTS_TABLE = process.env.REACT_APP_SUPABASE_PROJECTS_TABLE || 'drawer_projects';

class SupabaseService {
  constructor() {
    this.bucket = SUPABASE_BUCKET;
    this.table = SUPABASE_TABLE;
    this.ordersTable = SUPABASE_ORDERS_TABLE;
    this.binsTable = SUPABASE_BINS_TABLE;
    this.projectsTable = SUPABASE_PROJECTS_TABLE;
    
    
    try {
      this.client = supabase;
      this.enabled = true;
      console.log('✅ Supabase DB Connection Success');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      this.client = null;
      this.enabled = false;
    }
  }

  /**
   * Get current user ID (for associating data with users)
   * @returns {string|null} User ID or null
   */
  async getCurrentUserId() {
    if (!this.isEnabled()) {
      return null;
    }
    
    try {
      const { data: { session } } = await this.client.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Check if Supabase service is properly configured
   * @returns {boolean} Service enabled status
   */
  isEnabled() {
    return this.enabled && this.client !== null;
  }

  /**
   * Upload image to Supabase storage (private bucket)
   * @param {string} path - Storage path
   * @param {Blob} blob - Image blob
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(path, blob, contentType = 'image/jpeg') {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      // Get current user ID for private path
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User must be authenticated to upload files' };
      }
      
      // Create user-specific path
      const userPath = `users/${userId}/${path}`;
      
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .upload(userPath, blob, { 
          contentType, 
          upsert: true 
        });
      
      if (error) {
        console.error('❌ Image upload failed:', error);
        return { success: false, error };
      }
      
      // Generate signed URL for private access (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(userPath, 3600); // URL valid for 1 hour
      
      if (signedUrlError) {
        console.error('❌ Signed URL generation failed:', signedUrlError);
        return { success: false, error: signedUrlError };
      }
      
      return { 
        success: true, 
        data, 
        publicUrl: signedUrlData.signedUrl,
        path: userPath
      };
    } catch (error) {
      console.error('❌ Image upload error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Get signed URL for private image
   * @param {string} path - Image path
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<Object>} Signed URL result
   */
  async getPrivateImageUrl(path, expiresIn = 3600) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) {
        console.error('❌ Signed URL generation failed:', error);
        return { success: false, error };
      }
      
      return { 
        success: true, 
        publicUrl: data.signedUrl 
      };
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      return { success: false, error };
    }
  }

  /**
   * Insert record with duplicate handling (uses sample_id for dataset table)
   * @param {Object} record - Record to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertRecord(record) {
    return this.insertIntoWithDuplicateCheck(this.table, record, 'project_id');
  }

  /**
   * Insert into table with duplicate checking and user confirmation
   * @param {string} tableName - Target table name
   * @param {Object} record - Record to insert
   * @param {string} duplicateCheckField - Field to check for duplicates (default: 'sample_id' for dataset table)
   * @returns {Promise<Object>} Insert result
   */
  async insertIntoWithDuplicateCheck(tableName, record, duplicateCheckField = 'project_id') {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Add user_id to record if user is authenticated
      const userId = await this.getCurrentUserId();
      const recordWithUser = userId ? { ...record, user_id: userId } : record;

      // Check for existing record with same sample_id
      const { data: existingRecords, error: checkError } = await this.client
        .from(tableName)
        .select('*')
        .eq(duplicateCheckField, recordWithUser[duplicateCheckField]);

      if (checkError) {
        console.error(`❌ Duplicate check failed for ${tableName}:`, checkError);
        return { success: false, error: checkError };
      }

      // If duplicate found, ask user for confirmation
      if (existingRecords && existingRecords.length > 0) {
        const existingRecord = existingRecords[0];
        const userConfirmed = window.confirm(
          `A record with the ${duplicateCheckField} "${recordWithUser[duplicateCheckField]}" already exists. Do you want to update it?`
        );

        if (userConfirmed) {
          // Update existing record
          const { data, error } = await this.client
            .from(tableName)
            .update(recordWithUser)
            .eq('id', existingRecord.id)
            .select();

          if (error) {
            console.error(`❌ Record update failed for ${tableName}:`, error);
            return { success: false, error };
          }

          console.log(`✅ Record updated in ${tableName}:`, data[0]);
          return { 
            success: true, 
            data, 
            updated: true,
            message: 'Record updated successfully' 
          };
        } else {
          return { 
            success: false, 
            cancelled: true,
            message: 'Operation cancelled by user' 
          };
        }
      }

      // No duplicate, proceed with insertion
      const { data, error } = await this.client
        .from(tableName)
        .insert(recordWithUser)
        .select();

      if (error) {
        console.error(`❌ Record insertion failed for ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`✅ Record inserted into ${tableName}:`, data[0]);
      return { 
        success: true, 
        data,
        inserted: true,
        message: 'Record inserted successfully' 
      };
    } catch (error) {
      console.error(`❌ Record operation error for ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Insert record without duplicate checking
   * @param {string} tableName - Target table name
   * @param {Object|Array} record - Record(s) to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertInto(tableName, record) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Add user_id to record if user is authenticated
      const userId = await this.getCurrentUserId();
      const recordWithUser = Array.isArray(record) 
        ? record.map(r => userId ? { ...r, user_id: userId } : r)
        : userId ? { ...record, user_id: userId } : record;

      const { data, error } = await this.client
        .from(tableName)
        .insert(recordWithUser)
        .select();

      if (error) {
        console.error(`❌ Record insertion failed for ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`✅ Records inserted into ${tableName}:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Record insertion error for ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Insert order record
   * @param {Object} orderRecord - Order data
   * @returns {Promise<Object>} Insert result
   */
  async insertOrder(orderRecord) {
    return this.insertInto(this.ordersTable, orderRecord);
  }

  /**
   * Save bins for a project
   * @param {string} projectId - Project UUID
   * @param {Array} bins - Array of bin objects
   * @returns {Promise<Object>} Save result
   */
  async saveBins(projectId, bins) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }
  
    try {
      // First, delete existing bins for this project
      const { error: deleteError } = await this.client
        .from(this.binsTable)
        .delete()
        .eq('project_id', projectId);
  
      if (deleteError) {
        console.error('❌ Failed to delete existing bins:', deleteError);
        return { success: false, error: deleteError };
      }
  
      // If no bins to save, return success
      if (!bins || bins.length === 0) {
        console.log(`✅ No bins to save for project ${projectId}`);
        return { success: true, data: [] };
      }
  
      // Get current user ID
      const userId = await this.getCurrentUserId();
      // --- NEW CHECK FOR GUEST USER ---
     if (!userId) {
      console.warn('Guest user detected. Bins will not be saved to database for project:', projectId);
       localStorage.setItem(`guest_project_${projectId}_bins`, JSON.stringify(bins));
      return { success: true, message: 'Bins not saved (guest mode)', guest: true }; // Indicate success locally
    }
    // --- END NEW CHECK ---


      // Prepare bins data for insertion - generate NEW unique IDs for all bins
      const binsData = bins.map(bin => {
        const binData = {
          id: this.generateUUID(), // ALWAYS generate new ID to avoid duplicates
          project_id: projectId,
          x_mm: bin.x,
          y_mm: bin.y,
          width_mm: bin.width,
          length_mm: bin.length,
          height_mm: bin.height || 21,
          color: bin.color || '#F5E6C8',
          colorway: bin.colorway || 'cream',
          shadow_board: bin.shadowBoard || false,
          name: bin.name || `Bin ${this.generateUUID().substring(0, 8)}`
        };
        
        // Add user_id if user is authenticated
        if (userId) {
          binData.user_id = userId;
        }
        
        return binData;
      });
  
      // Insert new bins
      const { data, error } = await this.client
        .from(this.binsTable)
        .insert(binsData)
        .select();
  
      if (error) {
        console.error('❌ Failed to save bins:', error);
        return { success: false, error };
      }
  
      console.log(`✅ ${binsData.length} bins saved for project ${projectId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Get bins by project ID
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Query result
   */
  async getBinsByProjectId(projectId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const userId = await this.getCurrentUserId();
      let query = this.client
        .from(this.binsTable)
        .select('*')
        .eq('project_id', projectId);
      
      // If user is authenticated, filter by user_id
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch bins:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Delete bins by project ID
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBinsByProjectId(projectId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const userId = await this.getCurrentUserId();
      let query = this.client
        .from(this.binsTable)
        .delete()
        .eq('project_id', projectId);
      
      // If user is authenticated, filter by user_id
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to delete bins:', error);
        return { success: false, error };
      }

      console.log(`✅ Bins deleted for project ${projectId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error deleting bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all records from a table
   * @param {string} tableName - Table name
   * @returns {Promise<Object>} Query result
   */
  async getAllRecords(tableName) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const userId = await this.getCurrentUserId();
      let query = this.client.from(tableName).select('*');
      
      // If user is authenticated, filter by user_id
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ Failed to fetch records from ${tableName}:`, error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error fetching records from ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Get record by sample_id (for dataset table)
   * @param {string} projectId - Sample ID
   * @returns {Promise<Object>} Query result
   */
  async getDatasetBySampleId(projectId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const userId = await this.getCurrentUserId();
      let query = this.client
        .from(this.table)
        .select('*')
        .eq('project_id', projectId);
      
      // If user is authenticated, filter by user_id
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('❌ Failed to fetch dataset record:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching dataset record:', error);
      return { success: false, error };
    }
  }

  /**
   * Create or verify project exists
   * @param {string} projectId - Project UUID
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Project result
   */
  async createOrVerifyProject(projectId, projectData = {}) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const userId = await this.getCurrentUserId(); 
        // --- NEW CHECK FOR GUEST USER ---
    if (!userId) {
      console.warn('Guest user detected. Project will not be saved to database.');
      // Option 1a: Return a simulated success without DB interaction
      // You might want to structure this data similarly to a real DB record
      const simulatedProjectData = {
        id: projectId,
        sample_id: projectData.sample_id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        drawer_width_mm: projectData.drawer_width_mm || 320,
        drawer_length_mm: projectData.drawer_length_mm || 320,
        drawer_height_mm: projectData.drawer_height_mm || 21,
        status: projectData.status || 'draft',
        unit: projectData.unit || 'mm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      // Return success but indicate it's not persisted
      return { success: true, data: simulatedProjectData, guest: true }; 
    }
    
      // Check if project already exists
      let projectQuery = this.client
        .from(this.projectsTable)
        .select('*')
        .eq('id', projectId)
        .limit(1);
      
      // If user is authenticated, filter by user_id
      if (userId) {
        projectQuery = projectQuery.eq('user_id', userId);
      }

      const { data: existingProjects, error: checkError } = await projectQuery;

      // Handle actual errors (not the "no rows" case)
      if (checkError) {
        // PGRST116 is the "no rows" error which is expected when project doesn't exist
        if (checkError.code !== 'PGRST116') {
          console.error('Error checking project:', checkError);
          return { success: false, error: checkError };
        }
        // If it's PGRST116 (no rows), continue to create project
      }

      // If project exists, return it
      if (existingProjects && existingProjects.length > 0) {
        console.log('✅ Project already exists:', existingProjects[0].id);
        return { success: true, data: existingProjects[0] };
      }

      // Create new project with required fields
      const newProjectData = {
        id: projectId,
        sample_id: projectData.sample_id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        drawer_width_mm: projectData.drawer_width_mm || 320,
        drawer_length_mm: projectData.drawer_length_mm || 320,
        drawer_height_mm: projectData.drawer_height_mm || 21,
        status: projectData.status || 'draft',
        unit: projectData.unit || 'mm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add user_id if user is authenticated
      if (userId) {
        newProjectData.user_id = userId;
      }

      // Only add session_id if it's provided
      if (projectData.session_id) {
        newProjectData.session_id = projectData.session_id;
      }

      const { data, error } = await this.client
        .from(this.projectsTable)
        .insert(newProjectData)
        .select();

      if (error) {
        console.error('❌ Error creating project:', error);
        return { success: false, error };
      }

      console.log('✅ Project created successfully:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error in createOrVerifyProject:', error);
      return { success: false, error };
    }
  }

  /**
   * Create or get session
   * @param {string} sessionId - Session ID (optional)
   * @returns {Promise<Object>} Session result
   */
  async createOrGetSession(sessionId = null) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      let sessionIdToUse = sessionId;
      
      // If no session ID provided, generate one or get from localStorage
      if (!sessionIdToUse) {
        sessionIdToUse = localStorage.getItem('currentSessionId');
        if (!sessionIdToUse) {
          sessionIdToUse = this.generateUUID();
          localStorage.setItem('currentSessionId', sessionIdToUse);
        }
      }

      const userId = await this.getCurrentUserId();
      
      // Check if session exists
      let sessionQuery = this.client
        .from('sessions')
        .select('*')
        .eq('id', sessionIdToUse)
        .limit(1);
      
      // If user is authenticated, filter by user_id
      if (userId) {
        sessionQuery = sessionQuery.eq('user_id', userId);
      }

      const { data: existingSessions, error: checkError } = await sessionQuery;

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking session:', checkError);
        return { success: false, error: checkError };
      }

      // If session exists, return it
      if (existingSessions && existingSessions.length > 0) {
        return { success: true, data: existingSessions[0] };
      }
      const { browser, os, device } = getClientInfo();
      // Create new session
      const sessionData = {
        id: sessionIdToUse,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        client_device: device,
        client_os: os,
        client_browser: browser
      };

      
      if (userId) {
        sessionData.user_id = userId;
      }

      const { data, error } = await this.client
        .from('sessions')
        .insert(sessionData)
        .select();

      if (error) {
        console.error('Error creating session:', error);
        return { success: false, error };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in createOrGetSession:', error);
      return { success: false, error };
    }
  }

  /**
   * Generate UUID helper method
   * @returns {string} Generated UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  getClientInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";

     // --- Detect Device ---
    let device = null;
    if (/Mobi|Android/i.test(ua)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(ua)) {
      device = "Tablet";
    } else {
      device = "Desktop";
    }

    // --- Detect Browser ---
    if (/chrome|crios|crmo/i.test(ua) && !/edge|edg|opr/i.test(ua)) {
      browser = "Chrome";
    } else if (/firefox|fxios/i.test(ua)) {
      browser = "Firefox";
    } else if (/safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)) {
      browser = "Safari";
    } else if (/edg/i.test(ua)) {
      browser = "Edge";
    } else if (/opr|opera/i.test(ua)) {
      browser = "Opera";
    }
  
    // --- Detect OS ---
    if (/windows nt 10/i.test(ua)) {
      os = "Windows 10";
    } else if (/windows nt 11/i.test(ua)) {
      os = "Windows 11";
    } else if (/mac os x/i.test(ua)) {
      os = "macOS";
    } else if (/android/i.test(ua)) {
      os = "Android";
      device = "Mobile";
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      os = "iOS";
      device = "Mobile";
    } else if (/linux/i.test(ua)) {
      os = "Linux";
    }
  
  
  
    return { browser, os, device };
  }
}

export default new SupabaseService();