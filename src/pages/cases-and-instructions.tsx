import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import InstructionTemplateList from '@/components/InstructionTemplateList';
import { InstructionTemplate } from '@/models/InstructionTemplate';

const CasesAndInstructions: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<InstructionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/instruction-templates');
        if (!response.ok) {
          throw new Error('Failed to fetch instruction templates');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching instruction templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cases and Instructions</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <InstructionTemplateList templates={templates} />
      )}
    </div>
  );
};

export default CasesAndInstructions;