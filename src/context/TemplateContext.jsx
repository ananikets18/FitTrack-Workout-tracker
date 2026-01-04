import { createContext, useContext, useState, useEffect } from 'react';

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

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY);
      const loadedTemplates = stored ? JSON.parse(stored) : [];
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever templates change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
      } catch (error) {
        console.error('Error saving templates:', error);
      }
    }
  }, [templates, isLoading]);

  const saveTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const updateTemplate = (id, updates) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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
