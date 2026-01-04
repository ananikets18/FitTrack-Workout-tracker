import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/supabase';

const TemplateContext = createContext();
const TEMPLATES_KEY = 'workout_templates';

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within TemplateProvider');
  }
  return context;
};

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [useSupabase, setUseSupabase] = useState(false);

  // Determine if we should use Supabase or localStorage
  useEffect(() => {
    setUseSupabase(!!user);
  }, [user]);

  // Load templates on mount
  useEffect(() => {
    if (!user) {
      loadFromLocalStorage();
    } else {
      loadFromSupabase();
    }
  }, [user]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY);
      const loadedTemplates = stored ? JSON.parse(stored) : [];
      setTemplates(loadedTemplates);
    } catch (error) {
      if (import.meta.env.MODE !== 'production') {
        console.error('Error loading templates:', error);
      }
      setTemplates([]);
    } finally {
      // Always set loading to false
      setIsLoading(false);
    }
  };

  const loadFromSupabase = async () => {
    setIsLoading(true);
    try {
      const data = await db.getTemplates(user.id);
      setTemplates(data || []);
    } catch (error) {
      if (import.meta.env.MODE !== 'production') {
        console.error('Error loading templates from Supabase:', error);
      }
      setTemplates([]);
    } finally {
      // Always set loading to false
      setIsLoading(false);
    }
  };

  // Save to localStorage whenever templates change (only if not using Supabase)
  useEffect(() => {
    if (!isLoading && !useSupabase) {
      try {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
      } catch (error) {
        console.error('Error saving templates:', error);
      }
    }
  }, [templates, isLoading, useSupabase]);

  const saveTemplate = async (template) => {
    const newTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (useSupabase && user) {
      try {
        const created = await db.createTemplate(newTemplate, user.id);
        setTemplates(prev => [created, ...prev]);
        return created;
      } catch (error) {
        console.error('Error saving template to Supabase:', error);
        throw error;
      }
    } else {
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    }
  };

  const deleteTemplate = async (id) => {
    if (useSupabase && user) {
      try {
        await db.deleteTemplate(id, user.id);
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting template from Supabase:', error);
        throw error;
      }
    } else {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTemplate = async (id, updates) => {
    if (useSupabase && user) {
      try {
        // Supabase doesn't have an update method for templates, so we'll handle it locally
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      } catch (error) {
        console.error('Error updating template in Supabase:', error);
        throw error;
      }
    } else {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  return (
    <TemplateContext.Provider value={{
      templates,
      saveTemplate,
      deleteTemplate,
      updateTemplate,
      isLoading,
    }}>
      {children}
    </TemplateContext.Provider>
  );
};
